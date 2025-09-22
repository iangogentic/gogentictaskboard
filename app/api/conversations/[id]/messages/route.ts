import { NextRequest, NextResponse } from "next/server";
import { conversationManager } from "@/lib/agent/conversation";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;

    // Get conversation history
    const messages = await conversationManager.getConversationHistory(
      conversationId,
      50 // Get last 50 messages
    );

    // Transform messages for the UI
    const formattedMessages = messages.reverse().map((msg) => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.createdAt,
    }));

    return NextResponse.json({
      success: true,
      messages: formattedMessages,
      conversationId,
    });
  } catch (error: any) {
    console.error("Error fetching conversation history:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation history" },
      { status: 500 }
    );
  }
}
