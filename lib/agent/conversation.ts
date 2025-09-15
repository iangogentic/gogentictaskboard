import { prisma } from "@/lib/prisma";
import { agentMemory } from "./memory";
import { Conversation, Message } from "@prisma/client";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ConversationContext {
  conversation: Conversation;
  messages: Message[];
  summary?: string;
}

export class ConversationManager {
  /**
   * Create or continue a conversation
   */
  async getOrCreateConversation(
    userId: string,
    projectId?: string,
    conversationId?: string
  ): Promise<ConversationContext> {
    let conversation: Conversation;
    let messages: Message[];

    if (conversationId) {
      // Continue existing conversation
      const existing = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          Message: {
            orderBy: { createdAt: "asc" },
            take: 50, // Last 50 messages for context
          },
        },
      });

      if (!existing || existing.userId !== userId) {
        throw new Error("Conversation not found or access denied");
      }

      conversation = existing;
      messages = existing.Message;
    } else {
      // Create new conversation
      const { randomUUID } = require("crypto");
      conversation = await prisma.conversation.create({
        data: {
          id: randomUUID(),
          userId,
          projectId,
          title: `Conversation ${new Date().toLocaleString()}`,
          updatedAt: new Date(),
        },
      });
      messages = [];
    }

    return {
      conversation,
      messages,
      summary: conversation.summary || undefined,
    };
  }

  /**
   * Add a message to the conversation
   */
  async addMessage(
    conversationId: string,
    role: "user" | "assistant" | "system",
    content: string,
    metadata?: any
  ): Promise<Message> {
    const { randomUUID } = require("crypto");
    const message = await prisma.message.create({
      data: {
        id: randomUUID(),
        conversationId,
        role,
        content,
        metadata: metadata || {},
      },
    });

    // Update conversation's updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  /**
   * Get conversation history with pagination
   */
  async getConversationHistory(
    conversationId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Message[]> {
    return await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Build context from conversation history
   */
  buildContextFromHistory(
    messages: Message[],
    maxTokens: number = 2000
  ): string {
    let context = "";
    let tokenCount = 0;

    // Process messages in reverse (most recent first)
    const reversed = [...messages].reverse();

    for (const message of reversed) {
      const messageText = `${message.role}: ${message.content}\n`;
      const estimatedTokens = messageText.length / 4;

      if (tokenCount + estimatedTokens > maxTokens) {
        break;
      }

      context = messageText + context;
      tokenCount += estimatedTokens;
    }

    return context.trim();
  }

  /**
   * Summarize a conversation
   */
  async summarizeConversation(conversationId: string): Promise<string> {
    const messages = await this.getConversationHistory(conversationId, 100);

    if (messages.length === 0) {
      return "Empty conversation";
    }

    const context = this.buildContextFromHistory(messages, 3000);

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "Summarize the following conversation in 2-3 sentences, highlighting key topics and decisions made.",
          },
          {
            role: "user",
            content: context,
          },
        ],
        temperature: 0.5,
        max_tokens: 200,
      });

      const summary =
        response.choices[0]?.message?.content || "Unable to generate summary";

      // Update conversation with summary
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { summary },
      });

      return summary;
    } catch (error) {
      console.error("Error summarizing conversation:", error);
      return "Error generating summary";
    }
  }

  /**
   * Get conversation context with RAG memory
   */
  async getEnhancedContext(
    conversationId: string,
    currentQuery: string,
    projectId?: string
  ): Promise<{
    conversationContext: string;
    ragContext: string;
    fullContext: string;
  }> {
    // Get conversation history
    const messages = await this.getConversationHistory(conversationId, 20);
    const conversationContext = this.buildContextFromHistory(messages);

    // Get RAG memory
    const memory = await agentMemory.retrieveMemory(
      currentQuery,
      projectId,
      undefined
    );
    const ragContext = agentMemory.buildContextString(memory);

    // Combine contexts
    const fullContext = `
## Conversation History
${conversationContext}

## Relevant Knowledge
${ragContext}
    `.trim();

    return {
      conversationContext,
      ragContext,
      fullContext,
    };
  }

  /**
   * Search conversations
   */
  async searchConversations(
    userId: string,
    query: string,
    limit: number = 10
  ): Promise<Conversation[]> {
    // Simple text search - could be enhanced with vector search
    return await prisma.conversation.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { summary: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
  }

  /**
   * Get user's recent conversations
   */
  async getRecentConversations(
    userId: string,
    projectId?: string,
    limit: number = 10
  ): Promise<Conversation[]> {
    const where: any = { userId };
    if (projectId) {
      where.projectId = projectId;
    }

    return await prisma.conversation.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(
    conversationId: string,
    userId: string
  ): Promise<void> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || conversation.userId !== userId) {
      throw new Error("Conversation not found or access denied");
    }

    await prisma.conversation.delete({
      where: { id: conversationId },
    });
  }

  /**
   * Update conversation title
   */
  async updateConversationTitle(
    conversationId: string,
    title: string
  ): Promise<void> {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { title },
    });
  }

  /**
   * Get conversation statistics
   */
  async getConversationStats(userId: string): Promise<{
    total: number;
    byProject: Record<string, number>;
    averageLength: number;
    mostActive: string[];
  }> {
    const conversations = await prisma.conversation.findMany({
      where: { userId },
      include: {
        _count: {
          select: { Message: true },
        },
      },
    });

    const byProject: Record<string, number> = {};
    let totalMessages = 0;

    for (const conv of conversations) {
      const projectKey = conv.projectId || "no-project";
      byProject[projectKey] = (byProject[projectKey] || 0) + 1;
      totalMessages += conv._count.Message;
    }

    const averageLength =
      conversations.length > 0
        ? Math.round(totalMessages / conversations.length)
        : 0;

    const mostActive = conversations
      .sort((a, b) => b._count.Message - a._count.Message)
      .slice(0, 5)
      .map((c) => c.title || c.id);

    return {
      total: conversations.length,
      byProject,
      averageLength,
      mostActive,
    };
  }
}

export const conversationManager = new ConversationManager();
