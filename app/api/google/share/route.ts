export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { authOptions } from "@/lib/auth";
import { GoogleDriveService } from "@/lib/google-drive";
import { prisma } from "@/lib/prisma";
import { AuditLogger } from "@/lib/audit";

// Share a file or folder
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { fileId, email, role = "reader" } = body;

    if (!fileId || !email) {
      return NextResponse.json(
        { error: "File ID and email are required" },
        { status: 400 }
      );
    }

    // Validate role
    if (!["reader", "writer", "commenter"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if user has Google Drive integration
    const integration = await prisma.integrationCredential.findFirst({
      where: {
        userId: session.user.id,
        type: "google_drive",
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: "Google Drive not connected" },
        { status: 400 }
      );
    }

    // Share the file
    const googleDrive = GoogleDriveService.getInstance();
    await googleDrive.shareFile(
      session.user.id,
      fileId,
      email,
      role as "reader" | "writer" | "commenter"
    );

    // Log the action
    await AuditLogger.logSuccess(
      session.user.id,
      "share_document",
      "document",
      fileId,
      {
        email,
        role,
      }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to share file:", error);

    await AuditLogger.logFailure(
      session?.user?.id || "system",
      "share_document",
      "document",
      error.message
    );

    return NextResponse.json(
      { error: "Failed to share file" },
      { status: 500 }
    );
  }
}
