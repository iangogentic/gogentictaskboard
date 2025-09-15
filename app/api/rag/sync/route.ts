import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { documentIngestionService } from "@/lib/document-ingestion";
import { checkPermissions } from "@/lib/rbac";
import { logAction } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { projectId, sources = ["project"] } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Check permissions
    const hasAccess = await checkPermissions(
      session.user.id,
      "project",
      projectId,
      "write"
    );

    if (!hasAccess) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Validate sources
    const validSources = ["slack", "gdrive", "project"];
    const requestedSources = sources.filter((s: string) =>
      validSources.includes(s)
    );

    if (requestedSources.length === 0) {
      return NextResponse.json(
        { error: "No valid sources specified" },
        { status: 400 }
      );
    }

    // Perform sync
    const results = await documentIngestionService.syncProject(
      projectId,
      session.user.id,
      requestedSources
    );

    // Log the sync action
    await logAction({
      actorId: session.user.id,
      actorType: "user",
      action: "sync_documents",
      targetType: "project",
      targetId: projectId,
      payload: {
        sources: requestedSources,
        results,
      },
      status: "executed",
    });

    return NextResponse.json({
      projectId,
      sources: requestedSources,
      results,
      message: `Successfully synced ${results.total} documents`,
    });
  } catch (error) {
    console.error("Document sync error:", error);

    // Log failed action
    if (session) {
      await logAction({
        actorId: session.user.id,
        actorType: "user",
        action: "sync_documents",
        targetType: "project",
        targetId: body.projectId,
        payload: body,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    return NextResponse.json(
      { error: "Failed to sync documents" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Check permissions
    const hasAccess = await checkPermissions(
      session.user.id,
      "project",
      projectId,
      "admin"
    );

    if (!hasAccess) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Delete all documents
    await documentIngestionService.deleteProjectDocuments(projectId);

    // Log the action
    await logAction({
      actorId: session.user.id,
      actorType: "user",
      action: "delete_documents",
      targetType: "project",
      targetId: projectId,
      payload: {},
      status: "executed",
    });

    return NextResponse.json({
      projectId,
      message: "All documents deleted successfully",
    });
  } catch (error) {
    console.error("Document deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete documents" },
      { status: 500 }
    );
  }
}
