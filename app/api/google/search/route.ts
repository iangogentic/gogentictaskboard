export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { authOptions } from "@/lib/auth";
import { GoogleDriveService } from "@/lib/google-drive";
import { prisma } from "@/lib/prisma";

// Search files in Google Drive
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const mimeType = searchParams.get("mimeType") || undefined;

    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
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

    // Search files
    const googleDrive = GoogleDriveService.getInstance();
    const files = await googleDrive.searchFiles(
      session.user.id,
      query,
      mimeType
    );

    return NextResponse.json({ files });
  } catch (error: any) {
    console.error("Failed to search files:", error);
    return NextResponse.json(
      { error: "Failed to search files" },
      { status: 500 }
    );
  }
}
