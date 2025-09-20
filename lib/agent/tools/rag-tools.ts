import { z } from "zod";
import { ToolDefinition } from "../tool-registry";
import { DocumentIngestionService } from "@/lib/document-ingestion";
import { embeddingService, EmbeddingService } from "@/lib/embeddings";
import { prisma } from "@/lib/prisma";

// Schemas for RAG tools
const syncDocumentsSchema = z.object({
  projectId: z.string().describe("Project ID to sync documents for"),
  sources: z
    .array(z.enum(["slack", "drive", "uploads"]))
    .optional()
    .describe("Sources to sync from"),
  forceReindex: z
    .boolean()
    .optional()
    .default(false)
    .describe("Force re-indexing of all documents"),
});

const searchKnowledgeSchema = z.object({
  query: z.string().describe("Search query"),
  projectId: z
    .string()
    .optional()
    .describe("Optional project ID to scope search"),
  limit: z.number().optional().default(5).describe("Maximum number of results"),
  threshold: z
    .number()
    .optional()
    .default(0.7)
    .describe("Similarity threshold (0-1)"),
});

const ingestDocumentSchema = z.object({
  content: z.string().describe("Document content to index"),
  title: z.string().describe("Document title"),
  type: z.string().optional().default("text").describe("Document type"),
  projectId: z.string().optional().describe("Associated project ID"),
  metadata: z.record(z.any()).optional().describe("Additional metadata"),
});

export const ragTools: ToolDefinition[] = [
  {
    name: "syncProjectDocuments",
    description:
      "Sync and index documents from connected integrations (Slack, Drive) for RAG",
    schema: syncDocumentsSchema,
    mutates: true,
    scopes: ["rag:write", "project:read"],
    handler: async (ctx, input) => {
      try {
        const ingestion = new DocumentIngestionService();

        // Verify project access
        const project = await prisma.project.findFirst({
          where: {
            id: input.projectId,
          },
          include: {
            ProjectIntegration: true,
          },
        });

        if (!project) {
          throw new Error("Project not found or access denied");
        }

        const results = {
          slack: 0,
          drive: 0,
          uploads: 0,
          errors: [] as string[],
        };

        // Sync from each source
        const sources = input.sources || ["slack", "drive", "uploads"];

        for (const source of sources) {
          try {
            if (
              source === "slack" &&
              project.ProjectIntegration.some((i) => i.key === "slack_channel")
            ) {
              const slackDocs = await ingestion.syncSlackMessages(
                input.projectId,
                ctx.userId
              );
              results.slack = slackDocs;
            }

            if (
              source === "drive" &&
              project.ProjectIntegration.some(
                (i) => i.key === "google_drive_folder"
              )
            ) {
              const driveDocs = await ingestion.syncGoogleDriveFiles(
                input.projectId,
                ctx.userId
              );
              results.drive = driveDocs;
            }

            if (source === "uploads") {
              // Sync uploaded documents
              const uploadedDocs = await prisma.document.findMany({
                where: {
                  projectId: input.projectId,
                  source: { not: "embedding" },
                },
              });

              for (const doc of uploadedDocs) {
                if (doc.content) {
                  await ingestion.ingestDocument(
                    input.projectId,
                    doc.source as any,
                    doc.title,
                    doc.content as string,
                    doc.id,
                    doc.url || undefined,
                    doc.metadata as any
                  );
                }
              }
              results.uploads = uploadedDocs.length;
            }
          } catch (error: any) {
            results.errors.push(`${source}: ${error.message}`);
          }
        }

        return {
          success: true,
          message: `Synced ${results.slack + results.drive + results.uploads} documents`,
          details: results,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || "Failed to sync documents",
        };
      }
    },
  },

  {
    name: "searchKnowledgeBase",
    description: "Search the knowledge base using semantic search",
    schema: searchKnowledgeSchema,
    mutates: false,
    scopes: ["rag:read"],
    handler: async (ctx, input) => {
      try {
        const embeddings = new EmbeddingService();

        // Search similar documents directly (search method handles embedding generation internally)
        const results = await embeddings.search(
          input.query,
          input.projectId,
          input.limit,
          input.threshold
        );

        // Map results with similarity scores
        const enrichedResults = results.map((r) => {
          return {
            id: r.document.id,
            title: r.document.title || "Untitled",
            content: r.chunk,
            similarity: r.similarity,
            projectId: r.document.projectId,
            type: r.document.source,
            url: r.document.url,
            metadata: r.metadata,
          };
        });

        return {
          success: true,
          results: enrichedResults,
          count: enrichedResults.length,
          query: input.query,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || "Failed to search knowledge base",
        };
      }
    },
  },

  {
    name: "ingestDocument",
    description: "Index a new document or text content into the knowledge base",
    schema: ingestDocumentSchema,
    mutates: true,
    scopes: ["rag:write"],
    handler: async (ctx, input) => {
      try {
        const ingestion = new DocumentIngestionService();

        // Create document record (requires projectId)
        if (!input.projectId) {
          throw new Error("projectId is required to index a document");
        }

        const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const document = await prisma.document.create({
          data: {
            id: documentId,
            projectId: input.projectId,
            title: input.title,
            source: input.type || "manual",
            content: input.content,
            updatedAt: new Date(),
            metadata: {
              ...input.metadata,
              uploadedBy: ctx.userId,
            },
          },
        });

        // Index for RAG
        const indexed = await ingestion.ingestDocument(
          input.projectId!,
          (input.type as any) || "manual",
          input.title,
          input.content,
          document.id,
          undefined, // url
          {
            ...input.metadata,
            documentId: document.id,
            userId: ctx.userId,
          }
        );

        return {
          success: true,
          documentId: document.id,
          message: `Document "${input.title}" indexed successfully`,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || "Failed to index document",
        };
      }
    },
  },
];
