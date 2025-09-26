import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's integration credentials
    const credentials = await prisma.integrationCredential.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        type: true,
        createdAt: true,
        data: true,
      },
    });

    // Transform to check if they have valid tokens (not dummy)
    const integrations = credentials.map((cred) => {
      const data = cred.data as any;

      // Check for valid tokens based on integration type
      let hasValidToken = false;
      if (cred.type === "google_drive") {
        // Google Drive uses accessToken
        hasValidToken = !!(
          data?.accessToken && data.accessToken !== "dummy-google-token"
        );
      } else {
        // Slack and others use token
        hasValidToken =
          data?.token &&
          data.token !== "dummy-google-token" &&
          data.token !== "dummy-slack-token" &&
          !data.token.startsWith("dummy");
      }

      return {
        id: cred.id,
        type: cred.type,
        connected: hasValidToken,
        connectedAt: hasValidToken ? cred.createdAt.toISOString() : null,
      };
    });

    return NextResponse.json({ integrations });
  } catch (error) {
    console.error("Failed to fetch integrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch integrations" },
      { status: 500 }
    );
  }
}
