import { NextRequest, NextResponse } from "next/server";
import {
  ragSearchTool,
  getMemoryContextTool,
} from "@/lib/agent/tools/rag-tools";
import { searchTool } from "@/lib/agent/tools/search-tools";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("query");
    const projectId = searchParams.get("projectId");
    const searchType = searchParams.get("type") || "all"; // all, rag, database

    if (!query) {
      return NextResponse.json(
        { success: false, error: "Query parameter is required" },
        { status: 400 }
      );
    }

    const results: any = {
      semantic: null,
      database: null,
      memory: null,
    };

    // Perform semantic search using RAG
    if (searchType === "all" || searchType === "rag") {
      const ragResult = await ragSearchTool.execute({
        query,
        projectId,
        limit: 5,
      });

      if (ragResult.success) {
        results.semantic = ragResult.data;
      }
    }

    // Perform database search
    if (searchType === "all" || searchType === "database") {
      const dbResult = await searchTool.execute({
        query,
        projectId,
        types: ["projects", "tasks", "updates", "documents"],
        limit: 10,
      });

      if (dbResult.success) {
        results.database = dbResult.data;
      }
    }

    // Get memory context
    if (searchType === "all" || searchType === "rag") {
      const memoryResult = await getMemoryContextTool.execute({
        query,
        projectId,
      });

      if (memoryResult.success) {
        results.memory = memoryResult.data;
      }
    }

    // Combine and format results
    const formattedResults = {
      query,
      projectId,
      searchType,
      results: {
        semantic: results.semantic?.results || [],
        database: results.database || {},
        memory: results.memory?.memory || null,
      },
      summary: generateSearchSummary(results),
    };

    return NextResponse.json({
      success: true,
      data: formattedResults,
    });
  } catch (error: any) {
    console.error("Error performing search:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function generateSearchSummary(results: any): string {
  const parts = [];

  if (results.semantic?.results?.length > 0) {
    parts.push(
      `Found ${results.semantic.results.length} relevant documents in knowledge base`
    );
  }

  if (results.database) {
    const total = Object.values(results.database).reduce(
      (sum: number, items: any) =>
        sum + (Array.isArray(items) ? items.length : 0),
      0
    );
    if (total > 0) {
      parts.push(`Found ${total} matching items in database`);
    }
  }

  if (results.memory?.memory) {
    parts.push("Retrieved relevant context from memory");
  }

  return parts.length > 0 ? parts.join(", ") : "No results found";
}
