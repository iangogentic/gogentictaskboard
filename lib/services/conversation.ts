// Conversation Memory Service - Sprint 5 Implementation
import { prisma } from "@/lib/prisma";

export class ConversationMemory {
  async getOrCreateConversation(userId: string, projectId?: string) {
    // Try to find existing conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        userId,
        ...(projectId && { projectId }),
      },
      orderBy: { updatedAt: "desc" },
    });

    // Create new if not found
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          id: `conv_${userId}_${projectId || "general"}_${Date.now()}`,
          userId,
          projectId,
          title: projectId ? "Project Chat" : "General Chat",
          updatedAt: new Date(),
        },
      });
    }

    return conversation;
  }

  async addMessage(conversationId: string, role: string, content: string) {
    return await prisma.message.create({
      data: {
        id: `msg_${conversationId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        conversationId,
        role,
        content,
      },
    });
  }

  async getMessages(conversationId: string, limit: number = 50) {
    return await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
  }

  async semanticSearch(query: string, projectId?: string, limit: number = 5) {
    // For now, do a simple text search. In production, this would use pgvector
    const embeddings = await prisma.embedding.findMany({
      where: {
        ...(projectId && {
          document: { projectId },
        }),
        chunkText: {
          contains: query,
          mode: "insensitive",
        },
      },
      include: {
        Document: true,
      },
      take: limit,
    });

    return embeddings;
  }

  async updateConversationSummary(conversationId: string, summary: string) {
    return await prisma.conversation.update({
      where: { id: conversationId },
      data: { summary },
    });
  }
}
