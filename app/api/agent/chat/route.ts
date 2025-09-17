import { NextResponse } from "next/server";
import { auth } from "@/auth";
import OpenAI from "openai";

// Edge Runtime compatible
export const runtime = "edge";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// Simple in-memory conversation storage (resets on deployment)
// In production, consider using a database or external storage
const conversationStore = new Map<string, any[]>();

export async function POST(request: Request) {
  try {
    const { message, projectId } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Get authenticated user from session (optional for public chat)
    const session = await auth();

    let user;
    if (session?.user?.email) {
      // Create user object from session for Edge Runtime
      user = {
        id: session.user.id || `user-${Date.now()}`,
        email: session.user.email,
        name: session.user.name || session.user.email.split("@")[0],
        role: "DEVELOPER" as any,
      };
    } else {
      // Allow anonymous access with a guest user
      user = {
        id: "guest-" + Date.now(),
        email: "guest@example.com",
        name: "Guest User",
        role: "GUEST" as any,
      };
    }

    const conversationId = user.id.startsWith("guest-")
      ? "guest-conversation"
      : `user-${user.id}-conversation`;

    // Get or create conversation history
    let messages = conversationStore.get(conversationId) || [];

    // Keep only last 10 messages to prevent context overflow
    if (messages.length > 20) {
      messages = messages.slice(-20);
    }

    // Build the system prompt
    const systemPrompt = `You are an AI assistant for a project management platform.
    
Current user:
- Name: ${user.name}
- Email: ${user.email}
- Role: ${user.role}
${projectId ? `- Current Project: ${projectId}` : ""}

You help users with:
- Managing projects and tasks
- Answering questions about project progress
- Providing insights and suggestions
- General assistance with the platform

Be helpful, concise, and professional. If you don't have specific information about projects or tasks, suggest that the user can ask specific questions or navigate to the relevant sections of the app.

For detailed project and task information, users should use the chat panel which has access to real-time data through the enhanced chat-v2 endpoint.`;

    // Add user message to history
    messages.push({
      role: "user",
      content: message,
    });

    // Create the completion
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.7,
      max_tokens: 500,
    });

    const assistantMessage = completion.choices[0].message;

    // Add assistant response to history
    messages.push(assistantMessage);

    // Store updated conversation
    conversationStore.set(conversationId, messages);

    return NextResponse.json({
      response: assistantMessage.content,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
