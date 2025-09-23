import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { AgentService } from "@/lib/agent/service";
import { conversationManager } from "@/lib/agent/conversation";

// Use Node.js runtime for full functionality
export const runtime = "nodejs";

const agentService = AgentService.getInstance();

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { message, projectId, history = [], conversationId } = body;

    // Get or create conversation
    const conversationContext =
      await conversationManager.getOrCreateConversation(
        session.user.id,
        projectId,
        conversationId
      );

    // Store user message
    await conversationManager.addMessage(
      conversationContext.conversation.id,
      "user",
      message,
      { projectId }
    );

    // Create or get agent session
    let agentSessionId = (conversationContext.conversation.metadata as any)
      ?.agentSessionId as string;

    if (!agentSessionId) {
      const agentSession = await agentService.createSession(
        session.user.id,
        projectId
      );
      agentSessionId = agentSession.id;

      // Store session ID in conversation metadata
      await conversationManager.updateConversationMetadata(
        conversationContext.conversation.id,
        { agentSessionId }
      );
    }

    // Generate plan using the full agent system
    const plan = await agentService.generatePlan(agentSessionId, message);

    // Auto-approve and execute simple read operations
    const isReadOnly = plan.steps.every((step) => {
      const tool = agentService.getToolByName(step.tool);
      return tool && !tool.mutates;
    });

    let response: string;
    let functionCalled = true;

    if (isReadOnly) {
      // Auto-execute read-only operations
      const result = await agentService.executePlan(agentSessionId);

      if (result.success) {
        response = result.summary || "Operation completed successfully.";

        // Add detailed results if available
        if (result.steps && result.steps.length > 0) {
          const outputs = result.steps
            .filter((s) => s.status === "completed" && s.output)
            .map((s) => {
              if (typeof s.output === "object") {
                return JSON.stringify(s.output, null, 2);
              }
              return s.output;
            });

          if (outputs.length > 0) {
            response += "\n\nResults:\n" + outputs.join("\n");
          }
        }
      } else {
        response = `Operation failed: ${result.summary || "Unknown error"}`;
      }
    } else {
      // For mutations, auto-approve and execute with user consent implied
      await agentService.approvePlan(agentSessionId, session.user.id);

      // Execute the approved plan
      const result = await agentService.executePlan(agentSessionId);

      if (result.success) {
        response = `✅ ${result.summary || "Operation completed successfully."}\n\n`;

        // Add detailed results if available
        if (result.steps && result.steps.length > 0) {
          response += `**Completed steps:**\n`;
          result.steps.forEach((step, index) => {
            if (step.status === "completed") {
              response += `${index + 1}. ✓ ${step.tool}\n`;
            }
          });

          const outputs = result.steps
            .filter((s) => s.status === "completed" && s.output)
            .map((s) => {
              if (typeof s.output === "object") {
                return JSON.stringify(s.output, null, 2);
              }
              return s.output;
            });

          if (outputs.length > 0) {
            response += `\n**Results:**\n${outputs.join("\n")}`;
          }
        }
      } else {
        response = `❌ Operation failed: ${result.summary || "Unknown error"}\n`;
        if (result.error) {
          response += `\nError details: ${result.error}`;
        }
      }
    }

    // Store assistant response
    await conversationManager.addMessage(
      conversationContext.conversation.id,
      "assistant",
      response,
      {
        functionCalled,
        planId: plan.id,
        isReadOnly,
        executed: isReadOnly,
      }
    );

    // Update conversation title if needed
    if (conversationContext.messages.length === 0) {
      const title =
        message.length > 50 ? message.substring(0, 50) + "..." : message;
      await conversationManager.updateConversationTitle(
        conversationContext.conversation.id,
        title
      );
    }

    return NextResponse.json({
      response,
      functionCalled,
      conversationId: conversationContext.conversation.id,
      sessionId: agentSessionId,
      planId: plan.id,
      requiresApproval: !isReadOnly,
    });
  } catch (error: any) {
    console.error("Chat error:", error);

    // Try to provide helpful error messages
    let errorMessage = "I encountered an error while processing your request.";

    if (error.message?.includes("No project manager available")) {
      errorMessage =
        "I couldn't create the project because no project manager is available. Please specify a project manager or ensure you have the right permissions.";
    } else if (error.message?.includes("Unauthorized")) {
      errorMessage = "You don't have permission to perform this action.";
    } else if (error.message?.includes("tool_not_found")) {
      errorMessage = "I don't have the capability to perform that action yet.";
    }

    return NextResponse.json(
      {
        response: errorMessage,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
