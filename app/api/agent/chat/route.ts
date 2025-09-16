import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { AgentTools } from "@/lib/agent/tools";
import { conversationManager } from "@/lib/agent/conversation";
import OpenAI from "openai";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// GPT-4o System Prompt for Operations Agent
const SYSTEM_PROMPT = `You are an advanced Operations Agent powered by GPT-4o with access to Sprint 1-6 features:

Sprint 1 - RBAC: Role-based access control for tasks and permissions
Sprint 2 - Slack: Send messages and create channels  
Sprint 3 - Google Drive: Search and upload files
Sprint 4 - RAG Memory: Semantic search and context awareness
Sprint 5 - Workflows: Automation and process orchestration
Sprint 6 - Scheduling: Cron jobs and task scheduling

You have access to these tools:
- listTasks: View tasks filtered by role
- createTask: Create new tasks
- analyzeProject: Get project health metrics
- sendSlackMessage: Send to Slack
- searchGoogleDrive: Search files
- getUserPermissions: Check access rights

Respond naturally to any input. Be conversational, helpful, and proactive.
When users say things like "yo" or "hey", respond casually and offer help.
Understand context and intent, not just keywords.`;

export async function POST(req: Request) {
  try {
    const { message, projectId, conversationId } = await req.json();

    // Log environment info for debugging
    console.log("[Agent] Environment check:", {
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      keyLength: process.env.OPENAI_API_KEY?.length,
      keyPrefix: process.env.OPENAI_API_KEY?.substring(0, 7),
      nodeEnv: process.env.NODE_ENV,
    });

    // Get authenticated user from session (optional for public chat)
    const session = await auth();

    let user;
    if (session?.user?.email) {
      // Get authenticated user
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (!user) {
        // Create user if doesn't exist (first time login)
        user = await prisma.user.create({
          data: {
            email: session.user.email,
            name: session.user.name || session.user.email.split("@")[0],
            role: "DEVELOPER",
          },
        });
      }
    } else {
      // Allow anonymous access with a guest user
      user = {
        id: "guest-" + Date.now(),
        email: "guest@example.com",
        name: "Guest User",
        role: "GUEST" as any,
      };
    }

    console.log(
      `Agent request from ${user.name} (${user.email}): "${message}"`
    );

    // Get or create conversation (skip for guest users)
    let conversationContext;
    if (user.id.startsWith("guest-")) {
      conversationContext = {
        conversation: { id: "guest-conversation-" + Date.now() },
        messages: [],
      };
    } else {
      conversationContext = await conversationManager.getOrCreateConversation(
        user.id,
        projectId,
        conversationId
      );
    }

    // Add user message to conversation (skip for guest users)
    if (!user.id.startsWith("guest-")) {
      await conversationManager.addMessage(
        conversationContext.conversation.id,
        "user",
        message
      );
    }

    // Build conversation history for context
    const conversationHistory = conversationManager.buildContextFromHistory(
      conversationContext.messages,
      1500 // Use last 1500 tokens of history
    );

    // Initialize agent tools
    const tools = new AgentTools();

    try {
      // Check if OpenAI API key is configured
      const hasOpenAI =
        process.env.OPENAI_API_KEY &&
        process.env.OPENAI_API_KEY !== "sk-demo" &&
        process.env.OPENAI_API_KEY !== "sk-demo-key-replace-with-real-key" &&
        process.env.OPENAI_API_KEY.startsWith("sk-");

      console.log("[Agent] OpenAI check:", {
        hasOpenAI,
        keySet: !!process.env.OPENAI_API_KEY,
        keyValid: process.env.OPENAI_API_KEY?.startsWith("sk-"),
      });

      if (hasOpenAI) {
        try {
          // Use GPT-4o for natural language understanding
          const completion = await openai.chat.completions.create({
            model: "gpt-4o", // Using GPT-4o for advanced capabilities
            messages: [
              {
                role: "system",
                content: SYSTEM_PROMPT,
              },
              {
                role: "user",
                content: `${conversationHistory ? `Previous conversation:\n${conversationHistory}\n\n` : ""}User message: "${message}"
              
Context: 
- User Name: ${user.name}
- User Role: ${user.role}
- Project ID: ${projectId || "none"}

Respond naturally and conversationally. Remember our previous conversation if any. If the user greets you, respond with a personalized greeting using their name and offer help. Do NOT include any analysis steps or debug information in your response - just give a direct, friendly answer.`,
              },
            ],
            temperature: 0.7,
            max_tokens: 1000,
          });

          const aiResponse = completion.choices[0].message?.content || "";

          // Parse AI response to determine actions
          const response = await processAIResponse(
            aiResponse,
            message,
            tools,
            user,
            projectId
          );

          // Save assistant response to conversation (skip for guest users)
          if (!user.id.startsWith("guest-")) {
            await conversationManager.addMessage(
              conversationContext.conversation.id,
              "assistant",
              response
            );
          }

          return NextResponse.json({
            response,
            conversationId: conversationContext.conversation.id, // Return actual conversation ID
            toolsUsed: ["gpt-4o"],
            model: "gpt-4o", // GPT-4o model
            modelVersion: "Latest",
            apiKeyDetected: true,
            usingGPT4o: true, // Confirm we're using GPT-4o
            hasMemory: true, // Confirm conversation memory is active
          });
        } catch (gpt5Error: any) {
          console.error("[Agent] GPT-4o API error:", {
            message: gpt5Error?.message,
            error: gpt5Error?.error?.message || gpt5Error?.message,
            code: gpt5Error?.error?.code || gpt5Error?.code,
            status: gpt5Error?.status,
            type: gpt5Error?.error?.type,
          });

          // If OpenAI fails, fall back to pattern matching
          console.log("Falling back to pattern matching due to OpenAI error");
          const fallbackResponse = await processNaturalLanguage(
            message,
            tools,
            user,
            projectId
          );

          // Save assistant response to conversation
          await conversationManager.addMessage(
            conversationContext.conversation.id,
            "assistant",
            fallbackResponse
          );

          return NextResponse.json({
            response: fallbackResponse,
            conversationId: conversationContext.conversation.id,
            toolsUsed: ["pattern-matching-fallback"],
            model: "fallback",
            error: "OpenAI API unavailable, using fallback",
            apiKeyDetected: true,
            hasMemory: true,
          });
        }
      } else {
        // Fallback to enhanced pattern matching with better natural language
        console.log("[Agent] Using fallback pattern matching (no OpenAI key)");
        const response = await processNaturalLanguage(
          message,
          tools,
          user,
          projectId
        );

        // Save assistant response to conversation
        await conversationManager.addMessage(
          conversationContext.conversation.id,
          "assistant",
          response
        );

        return NextResponse.json({
          response,
          conversationId: conversationContext.conversation.id,
          toolsUsed: ["pattern-matching"],
          model: "local",
          hasMemory: true,
        });
      }
    } catch (aiError) {
      console.error("AI processing error:", aiError);
      // Fallback to pattern matching
      const response = await processNaturalLanguage(
        message,
        tools,
        user,
        projectId
      );

      return NextResponse.json({
        response,
        conversationId: "fallback-" + Date.now(),
        toolsUsed: ["fallback"],
      });
    }
  } catch (error: any) {
    console.error("[Agent] Fatal error:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });

    // More specific error messages
    let errorMessage = "Failed to process your message.";

    if (error.message?.includes("auth") || error.message?.includes("session")) {
      errorMessage = "Please log in to use the agent.";
    } else if (
      error.message?.includes("database") ||
      error.message?.includes("prisma")
    ) {
      errorMessage =
        "Having trouble connecting to the database. Please try again in a moment.";
    } else if (
      error.message?.includes("GPT") ||
      error.message?.includes("OpenAI")
    ) {
      errorMessage = "AI service temporarily unavailable. Please try again.";
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// Process AI response and execute tools
async function processAIResponse(
  aiResponse: string,
  originalMessage: string,
  tools: AgentTools,
  user: any,
  projectId?: string
): Promise<string> {
  const messageLower = originalMessage.toLowerCase();

  // Check if asking to analyze project
  if (
    (messageLower.includes("analyze") ||
      messageLower.includes("health") ||
      messageLower.includes("status")) &&
    (messageLower.includes("project") || messageLower.includes("progress"))
  ) {
    // If no projectId provided, get the user's most recent project
    if (!projectId) {
      try {
        const projects = await prisma.project.findMany({
          where:
            user.role === "ADMIN"
              ? {}
              : {
                  OR: [
                    { pmId: user.id },
                    { developers: { some: { id: user.id } } },
                  ],
                },
          orderBy: { lastUpdatedAt: "desc" },
          take: 1,
        });

        if (projects.length > 0) {
          projectId = projects[0].id;
          const analysis = await tools.analyzeProject(projectId);
          if (analysis) {
            const m = analysis.metrics;
            return (
              `📊 **Analysis for "${analysis.project.title}":**\n\n` +
              `Health: ${
                analysis.project.health === "Green"
                  ? "🟢 Healthy"
                  : analysis.project.health === "Yellow"
                    ? "🟡 Needs Attention"
                    : analysis.project.health === "Red"
                      ? "🔴 Critical"
                      : "⚪ Unknown"
              }\n` +
              `Progress: ${"█".repeat(Math.floor(m.completionRate / 10))}${"░".repeat(10 - Math.floor(m.completionRate / 10))} ${m.completionRate.toFixed(0)}%\n` +
              `Tasks: ${m.completedTasks}/${m.totalTasks} complete\n` +
              `In Progress: ${m.inProgressTasks} tasks\n` +
              `Blocked: ${m.blockedTasks} tasks\n\n` +
              `Would you like me to help with any specific tasks?`
            );
          }
        } else {
          return `📂 I couldn't find any projects assigned to you. Would you like me to help you create a new project?`;
        }
      } catch (error) {
        console.error("Error analyzing project:", error);
        return `I encountered an error while analyzing the project. Please try again.`;
      }
    } else {
      // Use provided projectId
      try {
        const analysis = await tools.analyzeProject(projectId);
        if (analysis) {
          const m = analysis.metrics;
          return (
            `📊 **Analysis for "${analysis.project.title}":**\n\n` +
            `Health: ${
              analysis.project.health === "Green"
                ? "🟢 Healthy"
                : analysis.project.health === "Yellow"
                  ? "🟡 Needs Attention"
                  : analysis.project.health === "Red"
                    ? "🔴 Critical"
                    : "⚪ Unknown"
            }\n` +
            `Progress: ${"█".repeat(Math.floor(m.completionRate / 10))}${"░".repeat(10 - Math.floor(m.completionRate / 10))} ${m.completionRate.toFixed(0)}%\n` +
            `Tasks: ${m.completedTasks}/${m.totalTasks} complete\n` +
            `In Progress: ${m.inProgressTasks} tasks\n` +
            `Blocked: ${m.blockedTasks} tasks\n\n` +
            `Would you like me to help with any specific tasks?`
          );
        }
      } catch (error) {
        console.error("Error analyzing project:", error);
        return `I couldn't analyze that project. It might not exist or you might not have access to it.`;
      }
    }
  }

  // Check if AI suggests creating a task
  if (aiResponse.includes("create") && aiResponse.includes("task")) {
    // Extract task details from the message
    const taskMatch = originalMessage.match(
      /(?:create|add|new)\s+(?:a\s+)?task\s+(?:to\s+)?(.+)/i
    );
    if (taskMatch) {
      if (!projectId) {
        // Get user's most recent project for task creation
        try {
          const projects = await prisma.project.findMany({
            where:
              user.role === "ADMIN"
                ? {}
                : {
                    OR: [
                      { pmId: user.id },
                      { developers: { some: { id: user.id } } },
                    ],
                  },
            orderBy: { lastUpdatedAt: "desc" },
            take: 1,
          });

          if (projects.length > 0) {
            projectId = projects[0].id;
          } else {
            return `📂 I need a project to create tasks. You don't have any projects yet. Would you like me to help you create one?`;
          }
        } catch (error) {
          console.error("Error finding project:", error);
          return `I couldn't find a project to add the task to. Please open a project first.`;
        }
      }

      try {
        const task = await tools.createTask({
          projectId,
          title: taskMatch[1].trim(),
          status: "To Do",
          assigneeId: user.id,
        });
        return `✅ Created task: "${task.title}"\n\nAnything else I can help with?`;
      } catch (error) {
        console.error("Error creating task:", error);
        return `I tried to create the task but encountered an error. ${aiResponse}`;
      }
    }
  }

  // Check if asking to update project
  if (messageLower.includes("update") && messageLower.includes("project")) {
    return `To update a project, I need more specific details. You can say things like:\n• "Set project health to yellow"\n• "Update project status to in progress"\n• "Change project name to [new name]"`;
  }

  // Default: return AI response as-is
  return aiResponse;
}

// Enhanced natural language processing without GPT-5
async function processNaturalLanguage(
  message: string,
  tools: AgentTools,
  user: any,
  projectId?: string
): Promise<string> {
  const messageLower = message.toLowerCase();

  // Handle casual greetings naturally - personalized with user's name
  if (
    ["yo", "hey", "sup", "hello", "hi", "howdy", "hola"].some((greeting) =>
      messageLower.includes(greeting)
    )
  ) {
    const firstName = user.name?.split(" ")[0] || "there";
    const greetings = [
      `Hey ${firstName}! 👋 I'm your Operations Agent with full Sprint 1-6 capabilities. What can I help you with today?`,
      `Yo ${firstName}! 🚀 Ready to help with tasks, Slack, Google Drive, or project analysis. What's up?`,
      `Hey ${firstName}! I'm here to help. Need to manage tasks, send a Slack message, or analyze a project?`,
      `Hi ${firstName}! I can help you with:\n• Managing tasks\n• Slack messaging\n• Google Drive files\n• Project analysis\n\nWhat would you like to do?`,
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // Handle questions about capabilities
  if (
    messageLower.includes("what can you do") ||
    messageLower.includes("help")
  ) {
    return (
      `I'm your Operations Agent with these superpowers:\n\n` +
      `🎯 **Task Management** - Create, list, and manage tasks\n` +
      `💬 **Slack Integration** - Send messages and create channels\n` +
      `📁 **Google Drive** - Search and upload files\n` +
      `📊 **Project Analysis** - Health metrics and progress tracking\n` +
      `🔐 **RBAC** - Role-based permissions and access control\n` +
      `🧠 **RAG Memory** - Semantic search and context awareness\n\n` +
      `Just tell me what you need in natural language!`
    );
  }

  // Handle project queries
  if (
    messageLower.includes("project") ||
    messageLower.includes("what do we have")
  ) {
    return `📂 To view your projects, please check the projects page in the sidebar. I can help you with:\n\n• Creating tasks\n• Project analysis\n• Sending Slack messages\n• Searching Google Drive\n\nWhat would you like to do?`;
  }

  // Handle frustration or confusion
  if (
    messageLower.includes("not working") ||
    messageLower.includes("broken") ||
    messageLower.includes("fix")
  ) {
    return (
      `I hear you're having trouble! 🔧 Let me help:\n\n` +
      `To use my features, try saying things like:\n` +
      `• "Show me my tasks"\n` +
      `• "Create a task to fix the login bug"\n` +
      `• "Send a message to Slack"\n` +
      `• "Search Drive for quarterly reports"\n` +
      `• "Analyze the current project"\n\n` +
      `What would you like me to help with?`
    );
  }

  // Task management with natural language
  if (messageLower.includes("task") || messageLower.includes("todo")) {
    if (
      messageLower.includes("list") ||
      messageLower.includes("show") ||
      messageLower.includes("what")
    ) {
      return `📋 To view your tasks, please open a project from the sidebar first. Then I can show you all tasks for that project.`;
    }

    if (
      messageLower.includes("create") ||
      messageLower.includes("add") ||
      messageLower.includes("new")
    ) {
      return `⚠️ Please open a project first to create tasks. You can click on any project in the sidebar.`;
    }
  }

  // Update project health or status
  if (
    messageLower.includes("set") ||
    messageLower.includes("change") ||
    messageLower.includes("update")
  ) {
    if (messageLower.includes("health") || messageLower.includes("status")) {
      return `🔧 To update project health or status, please open the specific project from the sidebar first, then I can help you make changes.`;
    }
  }

  // Project analysis
  if (
    messageLower.includes("analyze") ||
    messageLower.includes("health") ||
    messageLower.includes("status") ||
    messageLower.includes("progress")
  ) {
    return `📊 To analyze a project, please open a specific project first from the sidebar, then ask me again.\n\nI can provide:\n• Health metrics\n• Task progress\n• Team performance\n• Bottleneck analysis`;
  }

  // Default friendly response
  return (
    `I understand you said: "${message}"\n\n` +
    `I'm still learning to understand everything naturally! Try:\n` +
    `• "Show my tasks"\n` +
    `• "Analyze project"\n` +
    `• "Send to Slack: [message]"\n` +
    `• "Search Drive for [query]"\n` +
    `• Or just say "help" to see all features!`
  );
} // Trigger recompile
