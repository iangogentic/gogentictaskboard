import { AgentTool, ToolResult } from "../types";
import { embeddingService } from "@/lib/embeddings";
import { documentIngestionService } from "@/lib/document-ingestion";
import { agentMemory } from "../memory";

export const ragSearchTool: AgentTool = {
  name: "rag_search",
  description: "Search project knowledge base using semantic search",
  parameters: {
    query: { type: "string", required: true },
    projectId: { type: "string", required: false },
    limit: { type: "number", required: false },
  },
  execute: async (params: any): Promise<ToolResult> => {
    try {
      const { query, projectId, limit = 5 } = params;
      const context = params.context || {};

      const results = await embeddingService.search(
        query,
        projectId || context.project?.id,
        limit,
        0.6
      );

      const resultText = `Found ${results.length} relevant results:\n\n${results
        .map(
          (r, i) =>
            `${i + 1}. [${r.document.source}] ${r.document.title} (${Math.round(
              r.similarity * 100
            )}% match)\n   ${r.chunk.substring(0, 200)}...`
        )
        .join("\n\n")}`;

      return {
        success: true,
        data: {
          text: resultText,
          results,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error performing RAG search: ${error.message}`,
      };
    }
  },
};

export const syncDocumentsTool: AgentTool = {
  name: "sync_documents",
  description:
    "Sync documents from Slack, Google Drive, or project data into knowledge base",
  parameters: {
    projectId: { type: "string", required: true },
    sources: { type: "array", required: false },
  },
  execute: async (params: any): Promise<ToolResult> => {
    try {
      const { projectId, sources = ["project"] } = params;
      const context = params.context || {};

      const results = await documentIngestionService.syncProject(
        projectId,
        context.user?.id || params.userId,
        sources
      );

      const text = `Successfully synced ${results.total} documents:\n${
        results.project ? `- Project data: ${results.project} documents\n` : ""
      }${results.slack ? `- Slack: ${results.slack} messages\n` : ""}${
        results.gdrive ? `- Google Drive: ${results.gdrive} files\n` : ""
      }`;

      return {
        success: true,
        data: {
          text,
          results,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error syncing documents: ${error.message}`,
      };
    }
  },
};

export const getMemoryContextTool: AgentTool = {
  name: "get_memory_context",
  description: "Retrieve relevant context and memory for a query",
  parameters: {
    query: { type: "string", required: true },
    projectId: { type: "string", required: false },
  },
  execute: async (params: any): Promise<ToolResult> => {
    try {
      const { query, projectId } = params;
      const context = params.context || {};

      const memory = await agentMemory.retrieveMemory(
        query,
        projectId || context.project?.id,
        context.user?.id || params.userId
      );

      const contextString = agentMemory.buildContextString(memory);

      return {
        success: true,
        data: {
          text: contextString || "No relevant context found.",
          memory,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error retrieving memory context: ${error.message}`,
      };
    }
  },
};

export const findSimilarDocumentsTool: AgentTool = {
  name: "find_similar_documents",
  description: "Find documents similar to a given document",
  parameters: {
    documentId: { type: "string", required: true },
    limit: { type: "number", required: false },
  },
  execute: async (params: any): Promise<ToolResult> => {
    try {
      const { documentId, limit = 5 } = params;

      const similarDocs = await embeddingService.findSimilar(documentId, limit);

      const text = `Found ${similarDocs.length} similar documents:\n${similarDocs
        .map(
          (d, i) =>
            `${i + 1}. ${d.title} (${d.source})\n   Created: ${d.createdAt.toISOString()}`
        )
        .join("\n\n")}`;

      return {
        success: true,
        data: {
          text,
          documents: similarDocs,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error finding similar documents: ${error.message}`,
      };
    }
  },
};

// Export all RAG tools
export function getRAGTools(): AgentTool[] {
  return [
    ragSearchTool,
    syncDocumentsTool,
    getMemoryContextTool,
    findSimilarDocumentsTool,
  ];
}
