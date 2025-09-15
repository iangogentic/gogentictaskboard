export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { authOptions } from "@/lib/auth";
import { GoogleDriveService } from "@/lib/google-drive";
import { prisma } from "@/lib/prisma";
import { canUserModifyProject } from "@/lib/rbac";

// Create a folder in Google Drive
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { folderName, parentFolderId, projectId } = body;

    if (!folderName) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      );
    }

    // If linking to a project, check permissions
    if (projectId) {
      const canModify = await canUserModifyProject(session.user.id, projectId);
      if (!canModify) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
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

    // Create the folder
    const googleDrive = GoogleDriveService.getInstance();

    if (projectId) {
      // Create full project folder structure
      const result = await googleDrive.createProjectFolderStructure(
        session.user.id,
        projectId,
        folderName
      );

      return NextResponse.json({
        success: true,
        folder: result.rootFolder,
        subFolders: result.subFolders,
      });
    } else {
      // Create single folder
      const folder = await googleDrive.createFolder(
        session.user.id,
        folderName,
        parentFolderId
      );

      return NextResponse.json({
        success: true,
        folder,
      });
    }
  } catch (error: any) {
    console.error("Failed to create folder:", error);
    return NextResponse.json(
      { error: "Failed to create folder" },
      { status: 500 }
    );
  }
}

// List files and folders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId") || undefined;
    const mimeType = searchParams.get("mimeType") || undefined;
    const projectId = searchParams.get("projectId");

    // If listing project files, get the folder ID from integration
    let targetFolderId = folderId;
    if (projectId && !folderId) {
      const integration = await prisma.projectIntegration.findUnique({
        where: {
          projectId_key: {
            projectId,
            key: "gdriveFolderId",
          },
        },
      });

      if (integration) {
        targetFolderId = integration.value;
      }
    }

    // Check if user has Google Drive integration
    const userIntegration = await prisma.integrationCredential.findFirst({
      where: {
        userId: session.user.id,
        type: "google_drive",
      },
    });

    if (!userIntegration) {
      return NextResponse.json(
        { error: "Google Drive not connected" },
        { status: 400 }
      );
    }

    // List files
    const googleDrive = GoogleDriveService.getInstance();
    const files = await googleDrive.listFiles(
      session.user.id,
      targetFolderId,
      mimeType
    );

    return NextResponse.json({ files });
  } catch (error: any) {
    console.error("Failed to list files:", error);
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    );
  }
}
