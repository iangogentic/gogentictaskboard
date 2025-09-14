import { MCPTool, MCPToolResponse } from "../types";
import { embeddingService } from "@/lib/embeddings";
import { documentIngestionService } from "@/lib/document-ingestion";
import { agentMemory } from "../memory";

export class RAGSearchTool implements MCPTool {
  name = "rag_search";
  description = "Search project knowledge base using semantic search";
  inputSchema = {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query",
      },
      projectId: {
        type: "string",
        description: "Optional project ID to search within",
      },
      limit: {
        type: "number",
        description: "Maximum number of results (default: 5)",
      },
    },
    required: ["query"],
  };

  async execute(input: any, context: any): Promise<MCPToolResponse> {
    try {
      const { query, projectId, limit = 5 } = input;

      const results = await embeddingService.search(
        query,
        projectId || context.project?.id,
        limit,
        0.6
      );

      return {
        content: [
          {
            type: "text",
            text: `Found ${results.length} relevant results:\n\n${results
              .map(
                (r, i) =>
                  `${i + 1}. [${r.document.source}] ${r.document.title} (${Math.round(
                    r.similarity * 100
                  )}% match)\n   ${r.chunk.substring(0, 200)}...`
              )
              .join("\n\n")}`,
          },
        ],
        data: results,
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error performing RAG search: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
}

export class SyncDocumentsTool implements MCPTool {
  name = "sync_documents";
  description =
    "Sync documents from Slack, Google Drive, or project data into knowledge base";
  inputSchema = {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "Project ID to sync documents for",
      },
      sources: {
        type: "array",
        items: {
          type: "string",
          enum: ["slack", "gdrive", "project"],
        },
        description: "Sources to sync from",
      },
    },
    required: ["projectId"],
  };

  async execute(input: any, context: any): Promise<MCPToolResponse> {
    try {
      const { projectId, sources = ["project"] } = input;

      const results = await documentIngestionService.syncProject(
        projectId,
        context.user.id,
        sources
      );

      return {
        content: [
          {
            type: "text",
            text: `Successfully synced ${results.total} documents:\n${
              results.project
                ? `- Project data: ${results.project} documents\n`
                : ""
            }${results.slack ? `- Slack: ${results.slack} messages\n` : ""}${
              results.gdrive ? `- Google Drive: ${results.gdrive} files\n` : ""
            }`,
          },
        ],
        data: results,
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error syncing documents: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
}

export class GetMemoryContextTool implements MCPTool {
  name = "get_memory_context";
  description = "Retrieve relevant context and memory for a query";
  inputSchema = {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Query to get context for",
      },
      projectId: {
        type: "string",
        description: "Optional project ID",
      },
    },
    required: ["query"],
  };

  async execute(input: any, context: any): Promise<MCPToolResponse> {
    try {
      const { query, projectId } = input;

      const memory = await agentMemory.retrieveMemory(
        query,
        projectId || context.project?.id,
        context.user.id
      );

      const contextString = agentMemory.buildContextString(memory);

      return {
        content: [
          {
            type: "text",
            text: contextString || "No relevant context found.",
          },
        ],
        data: memory,
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error retrieving memory context: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
}

export class FindSimilarDocumentsTool implements MCPTool {
  name = "find_similar_documents";
  description = "Find documents similar to a given document";
  inputSchema = {
    type: "object",
    properties: {
      documentId: {
        type: "string",
        description: "Document ID to find similar documents for",
      },
      limit: {
        type: "number",
        description: "Maximum number of similar documents (default: 5)",
      },
    },
    required: ["documentId"],
  };

  async execute(input: any, context: any): Promise<MCPToolResponse> {
    try {
      const { documentId, limit = 5 } = input;

      const similarDocs = await embeddingService.findSimilar(documentId, limit);

      return {
        content: [
          {
            type: "text",
            text: `Found ${similarDocs.length} similar documents:\n${similarDocs
              .map(
                (d, i) =>
                  `${i + 1}. ${d.title} (${d.source})\n   Created: ${d.createdAt.toISOString()}`
              )
              .join("\n\n")}`,
          },
        ],
        data: similarDocs,
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error finding similar documents: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
}

// Export all RAG tools
export function getRAGTools(): MCPTool[] {
  return [
    new RAGSearchTool(),
    new SyncDocumentsTool(),
    new GetMemoryContextTool(),
    new FindSimilarDocumentsTool(),
  ];
}
