import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type } = params;

    // Find and delete the integration credential
    const deleted = await prisma.integrationCredential.deleteMany({
      where: {
        userId: session.user.id,
        type: type,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    console.log(`Disconnected ${type} integration for user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      message: `Successfully disconnected ${type}`,
    });
  } catch (error) {
    console.error("Failed to disconnect integration:", error);
    return NextResponse.json(
      { error: "Failed to disconnect integration" },
      { status: 500 }
    );
  }
}
