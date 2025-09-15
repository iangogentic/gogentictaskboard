import { embeddingService } from "@/lib/embeddings";
import { documentIngestionService } from "@/lib/document-ingestion";
import { prisma } from "@/lib/prisma";
import { AgentSession } from "@prisma/client";

export interface MemoryContext {
  relevantDocuments: Array<{
    title: string;
    content: string;
    source: string;
    similarity: number;
  }>;
  projectContext?: {
    title: string;
    status: string;
    stage: string;
    notes?: string;
  };
  recentUpdates?: Array<{
    author: string;
    body: string;
    createdAt: Date;
  }>;
  similarSessions?: Array<{
    plan: any;
    result: any;
    createdAt: Date;
  }>;
}

export class AgentMemory {
  /**
   * Retrieve relevant memory for an agent request
   */
  async retrieveMemory(
    request: string,
    projectId?: string,
    userId?: string
  ): Promise<MemoryContext> {
    const memory: MemoryContext = {
      relevantDocuments: [],
    };

    // Get relevant documents using semantic search
    const searchResults = await embeddingService.search(
      request,
      projectId,
      5, // Top 5 most relevant
      0.6 // Lower threshold for more results
    );

    memory.relevantDocuments = searchResults.map((r) => ({
      title: r.document.title,
      content: r.chunk,
      source: r.document.source,
      similarity: r.similarity,
    }));

    // Get project context if projectId provided
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          updates: {
            orderBy: { createdAt: "desc" },
            take: 3,
            include: {
              author: true,
            },
          },
        },
      });

      if (project) {
        memory.projectContext = {
          title: project.title,
          status: project.status,
          stage: project.stage,
          notes: project.notes || undefined,
        };

        memory.recentUpdates = project.updates.map((u) => ({
          author: u.author.name || u.author.email,
          body: u.body,
          createdAt: u.createdAt,
        }));
      }
    }

    // Find similar past agent sessions
    if (userId) {
      const sessions = await this.findSimilarSessions(request, userId, 3);
      if (sessions.length > 0) {
        memory.similarSessions = sessions;
      }
    }

    return memory;
  }

  /**
   * Find similar past agent sessions
   */
  private async findSimilarSessions(
    request: string,
    userId: string,
    limit: number = 3
  ): Promise<
    Array<{
      plan: any;
      result: any;
      createdAt: Date;
    }>
  > {
    // Get recent successful sessions
    const recentSessions = await prisma.agentSession.findMany({
      where: {
        userId,
        state: "completed",
        plan: { not: null },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    if (recentSessions.length === 0) {
      return [];
    }

    // Score sessions by relevance to current request
    const scoredSessions = recentSessions.map((session) => {
      const plan = session.plan as any;
      let score = 0;

      // Simple keyword matching for now
      const requestWords = request.toLowerCase().split(" ");
      const planString = JSON.stringify(plan).toLowerCase();

      for (const word of requestWords) {
        if (planString.includes(word)) {
          score++;
        }
      }

      return { session, score };
    });

    // Sort by score and return top matches
    return scoredSessions
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .filter((s) => s.score > 0)
      .map((s) => ({
        plan: s.session.plan,
        result: s.session.result,
        createdAt: s.session.createdAt,
      }));
  }

  /**
   * Store session memory for future retrieval
   */
  async storeSessionMemory(
    sessionId: string,
    request: string,
    plan: any,
    result: any
  ): Promise<void> {
    try {
      // Create a document for this session
      const session = await prisma.agentSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return;
      }

      const content = `
Agent Session: ${sessionId}
Request: ${request}
Plan: ${JSON.stringify(plan, null, 2)}
Result: ${JSON.stringify(result, null, 2)}
Status: ${session.state}
Date: ${session.createdAt.toISOString()}
      `.trim();

      await documentIngestionService.ingestDocument(
        session.projectId || "global",
        "manual",
        `Agent Session: ${new Date().toISOString()}`,
        content,
        `session_${sessionId}`,
        undefined,
        {
          type: "agent_session",
          sessionId,
          userId: session.userId,
        }
      );
    } catch (error) {
      console.error("Error storing session memory:", error);
    }
  }

  /**
   * Build context string for AI
   */
  buildContextString(memory: MemoryContext): string {
    let context = "";

    // Add project context
    if (memory.projectContext) {
      context += `## Project Context\n`;
      context += `Title: ${memory.projectContext.title}\n`;
      context += `Status: ${memory.projectContext.status}\n`;
      context += `Stage: ${memory.projectContext.stage}\n`;
      if (memory.projectContext.notes) {
        context += `Notes: ${memory.projectContext.notes}\n`;
      }
      context += "\n";
    }

    // Add recent updates
    if (memory.recentUpdates && memory.recentUpdates.length > 0) {
      context += `## Recent Updates\n`;
      for (const update of memory.recentUpdates) {
        context += `- ${update.author} (${update.createdAt.toISOString()}): ${update.body}\n`;
      }
      context += "\n";
    }

    // Add relevant documents
    if (memory.relevantDocuments.length > 0) {
      context += `## Relevant Information\n`;
      for (const doc of memory.relevantDocuments) {
        context += `[${doc.source}] ${doc.title} (${Math.round(
          doc.similarity * 100
        )}% relevant):\n`;
        context += `${doc.content}\n\n`;
      }
    }

    // Add similar past sessions
    if (memory.similarSessions && memory.similarSessions.length > 0) {
      context += `## Similar Past Sessions\n`;
      for (const session of memory.similarSessions) {
        const plan = session.plan as any;
        if (plan && plan.description) {
          context += `- Previous plan: ${plan.description}\n`;
          if (session.result) {
            const result = session.result as any;
            if (result.summary) {
              context += `  Result: ${result.summary}\n`;
            }
          }
        }
      }
      context += "\n";
    }

    return context.trim();
  }

  /**
   * Clear old session memories (cleanup)
   */
  async cleanupOldMemories(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // Delete old session documents
    const oldDocs = await prisma.document.findMany({
      where: {
        source: "manual",
        metadata: {
          path: ["type"],
          equals: "agent_session",
        },
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    for (const doc of oldDocs) {
      await embeddingService.deleteDocumentEmbeddings(doc.id);
    }

    const deleted = await prisma.document.deleteMany({
      where: {
        source: "manual",
        metadata: {
          path: ["type"],
          equals: "agent_session",
        },
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return deleted.count;
  }
}

export const agentMemory = new AgentMemory();
