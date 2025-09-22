import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // Get the actual user from session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try to create a test conversation
    const { randomUUID } = require("crypto");
    const testId = randomUUID();

    console.log("[DEBUG] Attempting to create conversation with ID:", testId);
    console.log("[DEBUG] User ID:", session.user.id);
    console.log("[DEBUG] DATABASE_URL exists:", !!process.env.DATABASE_URL);
    console.log(
      "[DEBUG] DATABASE_URL starts with:",
      process.env.DATABASE_URL?.substring(0, 30)
    );

    try {
      const conversation = await prisma.conversation.create({
        data: {
          id: testId,
          userId: session.user.id,
          title: `Test Conversation ${new Date().toISOString()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log("[DEBUG] Successfully created conversation:", conversation);

      // Try to retrieve it
      const retrieved = await prisma.conversation.findUnique({
        where: { id: testId },
      });

      console.log("[DEBUG] Retrieved conversation:", retrieved);

      // Count all conversations
      const count = await prisma.conversation.count();
      console.log("[DEBUG] Total conversations in database:", count);

      return NextResponse.json({
        success: true,
        created: conversation,
        retrieved,
        totalCount: count,
        databaseUrl: process.env.DATABASE_URL?.substring(0, 30) + "...",
      });
    } catch (dbError: any) {
      console.error("[DEBUG] Database error:", dbError);
      return NextResponse.json({
        success: false,
        error: dbError.message,
        code: dbError.code,
        databaseUrl: process.env.DATABASE_URL?.substring(0, 30) + "...",
      });
    }
  } catch (error: any) {
    console.error("[DEBUG] General error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
