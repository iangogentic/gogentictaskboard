export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { authOptions } from "@/lib/auth";
import { GoogleDriveService } from "@/lib/google-drive";
import { prisma } from "@/lib/prisma";
import { AuditLogger } from "@/lib/audit";

// Upload a file to Google Drive
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folderId = formData.get("folderId") as string | null;
    const projectId = formData.get("projectId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
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

    // If uploading to project, get the folder ID
    let targetFolderId = folderId;
    if (projectId && !folderId) {
      const projectIntegration = await prisma.projectIntegration.findUnique({
        where: {
          projectId_key: {
            projectId,
            key: "gdriveFolderId",
          },
        },
      });

      if (projectIntegration) {
        targetFolderId = projectIntegration.value;
      }
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Google Drive
    const googleDrive = GoogleDriveService.getInstance();
    const uploadedFile = await googleDrive.uploadFile(
      session.user.id,
      file.name,
      file.type,
      buffer,
      targetFolderId || undefined
    );

    // Store document reference in database if linked to project
    if (projectId) {
      const { randomUUID } = require("crypto");
      await prisma.document.create({
        data: {
          id: randomUUID(),
          projectId,
          title: file.name,
          source: "gdrive",
          content: uploadedFile.webViewLink,
          metadata: {
            driveFileId: uploadedFile.id,
            mimeType: uploadedFile.mimeType,
            size: uploadedFile.size,
            webContentLink: uploadedFile.webContentLink,
          },
          updatedAt: new Date(),
        },
      });

      await AuditLogger.logSuccess(
        session.user.id,
        "upload_document",
        "document",
        uploadedFile.id,
        {
          projectId,
          fileName: file.name,
          source: "gdrive",
        }
      );
    }

    return NextResponse.json({
      success: true,
      file: uploadedFile,
    });
  } catch (error: any) {
    console.error("Failed to upload file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

// Download a file from Google Drive
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
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

    // Download from Google Drive
    const googleDrive = GoogleDriveService.getInstance();
    const { data, metadata } = await googleDrive.downloadFile(
      session.user.id,
      fileId
    );

    // Return file as response
    return new NextResponse(data as any, {
      headers: {
        "Content-Type": metadata.mimeType,
        "Content-Disposition": `attachment; filename="${metadata.name}"`,
        "Content-Length": metadata.size || "0",
      },
    });
  } catch (error: any) {
    console.error("Failed to download file:", error);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
  }
}

// Delete a file from Google Drive
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
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

    // Delete from Google Drive
    const googleDrive = GoogleDriveService.getInstance();
    await googleDrive.deleteFile(session.user.id, fileId);

    // Remove document reference if exists
    await prisma.document.deleteMany({
      where: {
        metadata: {
          path: ["$.driveFileId"],
          equals: fileId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
