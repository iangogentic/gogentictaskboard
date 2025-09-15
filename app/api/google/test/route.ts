export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleDriveService } from "@/lib/google-drive";
import { prisma } from "@/lib/prisma";

// Test Google Drive connection
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has Google Drive integration
    const integration = await prisma.integrationCredential.findFirst({
      where: {
        userId: session.user.id,
        type: "google_drive",
      },
    });

    if (!integration) {
      return NextResponse.json({
        connected: false,
        message: "Google Drive not connected",
      });
    }

    // Test the connection
    const googleDrive = GoogleDriveService.getInstance();
    const isConnected = await googleDrive.testConnection(session.user.id);

    if (isConnected) {
      return NextResponse.json({
        connected: true,
        message: "Google Drive connection successful",
        metadata: integration.metadata,
      });
    } else {
      return NextResponse.json({
        connected: false,
        message: "Google Drive connection failed - tokens may be expired",
      });
    }
  } catch (error: any) {
    console.error("Google Drive connection test error:", error);
    return NextResponse.json(
      {
        connected: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
