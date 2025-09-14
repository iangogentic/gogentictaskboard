import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { embeddingService } from "@/lib/embeddings";
import { checkPermissions } from "@/lib/rbac";
import { logAction } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { query, projectId, limit = 10, threshold = 0.7 } = body;

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Check permissions if searching within a project
    if (projectId) {
      const hasAccess = await checkPermissions(
        session.user.id,
        "project",
        projectId,
        "read"
      );

      if (!hasAccess) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }

    // Perform semantic search
    const results = await embeddingService.search(
      query,
      projectId,
      limit,
      threshold
    );

    // Log the search action
    await logAction({
      actorId: session.user.id,
      actorType: "user",
      action: "semantic_search",
      targetType: projectId ? "project" : "global",
      targetId: projectId,
      payload: {
        query,
        resultsCount: results.length,
      },
      status: "executed",
    });

    return NextResponse.json({
      query,
      results: results.map((r) => ({
        documentId: r.document.id,
        documentTitle: r.document.title,
        source: r.document.source,
        url: r.document.url,
        chunk: r.chunk,
        similarity: r.similarity,
        metadata: r.metadata,
      })),
      count: results.length,
    });
  } catch (error) {
    console.error("Semantic search error:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const projectId = searchParams.get("projectId");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter q is required" },
        { status: 400 }
      );
    }

    // Check permissions if searching within a project
    if (projectId) {
      const hasAccess = await checkPermissions(
        session.user.id,
        "project",
        projectId,
        "read"
      );

      if (!hasAccess) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }

    // Get context for the query
    const context = await embeddingService.getContextForQuery(
      query,
      projectId || undefined,
      2000
    );

    return NextResponse.json({
      query,
      context,
      projectId,
    });
  } catch (error) {
    console.error("Context retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve context" },
      { status: 500 }
    );
  }
}
