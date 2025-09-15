export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { authOptions } from "@/lib/auth";
import { GoogleDriveService } from "@/lib/google-drive";
import { prisma } from "@/lib/prisma";

// Get storage quota information
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
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
      return NextResponse.json(
        { error: "Google Drive not connected" },
        { status: 400 }
      );
    }

    // Get storage quota
    const googleDrive = GoogleDriveService.getInstance();
    const quota = await googleDrive.getStorageQuota(session.user.id);

    // Convert bytes to human-readable format
    const formatBytes = (bytes: string) => {
      const size = parseInt(bytes);
      if (size === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(size) / Math.log(k));
      return parseFloat((size / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return NextResponse.json({
      quota: {
        limit: formatBytes(quota.limit),
        usage: formatBytes(quota.usage),
        usageInDrive: formatBytes(quota.usageInDrive),
        usageInTrash: formatBytes(quota.usageInTrash),
        percentageUsed:
          quota.limit !== "0"
            ? ((parseInt(quota.usage) / parseInt(quota.limit)) * 100).toFixed(2)
            : "0",
      },
      raw: quota,
    });
  } catch (error: any) {
    console.error("Failed to get storage quota:", error);
    return NextResponse.json(
      { error: "Failed to get storage quota" },
      { status: 500 }
    );
  }
}
