import { OpenAI } from "openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { prisma } from "@/lib/prisma";
import { Document, Embedding } from "@prisma/client";
import pgvector from "pgvector/utils";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "text-embedding-3-small", // Cheaper and faster
  dimensions: 1536,
});

export class EmbeddingService {
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor() {
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
  }

  /**
   * Generate embeddings for text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    return response.data[0].embedding;
  }

  /**
   * Process and store document embeddings
   */
  async processDocument(
    documentId: string,
    content: string
  ): Promise<Embedding[]> {
    // Split document into chunks
    const chunks = await this.textSplitter.createDocuments([content]);

    const embeddings: Embedding[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkText = chunk.pageContent;

      // Generate embedding for chunk
      const vector = await this.generateEmbedding(chunkText);

      // Store in database with raw SQL for pgvector
      const embedding = await prisma.$executeRaw`
        INSERT INTO "Embedding" (
          id, 
          "documentId", 
          "chunkIndex", 
          "chunkText", 
          vector, 
          metadata, 
          "createdAt"
        )
        VALUES (
          ${`emb_${Date.now()}_${i}`},
          ${documentId},
          ${i},
          ${chunkText},
          ${pgvector.toSql(vector)}::vector,
          ${JSON.stringify(chunk.metadata || {})}::jsonb,
          NOW()
        )
        ON CONFLICT ("documentId", "chunkIndex") 
        DO UPDATE SET
          "chunkText" = EXCLUDED."chunkText",
          vector = EXCLUDED.vector,
          metadata = EXCLUDED.metadata
        RETURNING id, "documentId", "chunkIndex", "chunkText", metadata, "createdAt"
      `;

      embeddings.push(embedding as unknown as Embedding);
    }

    return embeddings;
  }

  /**
   * Semantic search using vector similarity
   */
  async search(
    query: string,
    projectId?: string,
    limit: number = 10,
    threshold: number = 0.7
  ): Promise<
    Array<{
      document: Document;
      chunk: string;
      similarity: number;
      metadata: any;
    }>
  > {
    // Generate query embedding
    const queryVector = await this.generateEmbedding(query);

    // Search using cosine similarity
    let results;

    if (projectId) {
      results = await prisma.$queryRaw`
        SELECT 
          e.id,
          e."documentId",
          e."chunkIndex",
          e."chunkText",
          e.metadata,
          d.id as doc_id,
          d."projectId",
          d.title,
          d.source,
          d."sourceId",
          d.url,
          d.content,
          d.metadata as doc_metadata,
          1 - (e.vector <=> ${pgvector.toSql(queryVector)}::vector) as similarity
        FROM "Embedding" e
        JOIN "Document" d ON e."documentId" = d.id
        WHERE 
          d."projectId" = ${projectId} AND
          1 - (e.vector <=> ${pgvector.toSql(queryVector)}::vector) > ${threshold}
        ORDER BY similarity DESC
        LIMIT ${limit}
      `;
    } else {
      results = await prisma.$queryRaw`
        SELECT 
          e.id,
          e."documentId",
          e."chunkIndex",
          e."chunkText",
          e.metadata,
          d.id as doc_id,
          d."projectId",
          d.title,
          d.source,
          d."sourceId",
          d.url,
          d.content,
          d.metadata as doc_metadata,
          1 - (e.vector <=> ${pgvector.toSql(queryVector)}::vector) as similarity
        FROM "Embedding" e
        JOIN "Document" d ON e."documentId" = d.id
        WHERE 
          1 - (e.vector <=> ${pgvector.toSql(queryVector)}::vector) > ${threshold}
        ORDER BY similarity DESC
        LIMIT ${limit}
      `;
    }

    return (results as any[]).map((r) => ({
      document: {
        id: r.doc_id,
        projectId: r.projectId,
        title: r.title,
        source: r.source,
        sourceId: r.sourceId,
        url: r.url,
        content: r.content,
        metadata: r.doc_metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Document,
      chunk: r.chunkText,
      similarity: r.similarity,
      metadata: r.metadata,
    }));
  }

  /**
   * Find similar documents
   */
  async findSimilar(
    documentId: string,
    limit: number = 5
  ): Promise<Document[]> {
    // Get document's average embedding
    const avgVector = await prisma.$queryRaw`
      SELECT AVG(vector) as avg_vector
      FROM "Embedding"
      WHERE "documentId" = ${documentId}
    `;

    if (!avgVector || !(avgVector as any[])[0]?.avg_vector) {
      return [];
    }

    const vector = (avgVector as any[])[0].avg_vector;

    // Find similar documents
    const results = await prisma.$queryRaw`
      SELECT DISTINCT
        d.id,
        d."projectId",
        d.title,
        d.source,
        d."sourceId",
        d.url,
        d.content,
        d.metadata,
        d."createdAt",
        d."updatedAt",
        1 - (AVG(e.vector) <=> ${pgvector.toSql(vector)}::vector) as similarity
      FROM "Document" d
      JOIN "Embedding" e ON e."documentId" = d.id
      WHERE d.id != ${documentId}
      GROUP BY d.id
      ORDER BY similarity DESC
      LIMIT ${limit}
    `;

    return results as Document[];
  }

  /**
   * Delete embeddings for a document
   */
  async deleteDocumentEmbeddings(documentId: string): Promise<void> {
    await prisma.embedding.deleteMany({
      where: { documentId },
    });
  }

  /**
   * Get document context for AI
   */
  async getContextForQuery(
    query: string,
    projectId?: string,
    maxTokens: number = 2000
  ): Promise<string> {
    const results = await this.search(query, projectId, 10, 0.6);

    let context = "";
    let tokenCount = 0;

    for (const result of results) {
      const chunk = `[${result.document.title}] ${result.chunk}\n\n`;
      const estimatedTokens = chunk.length / 4; // Rough estimate

      if (tokenCount + estimatedTokens > maxTokens) {
        break;
      }

      context += chunk;
      tokenCount += estimatedTokens;
    }

    return context.trim();
  }
}

export const embeddingService = new EmbeddingService();
