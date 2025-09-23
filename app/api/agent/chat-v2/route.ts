import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { AgentService } from "@/lib/agent/service";
import { conversationManager } from "@/lib/agent/conversation";
import {
  ConversationAnalyzer,
  ConversationState,
} from "@/lib/agent/conversation-analyzer";

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
    const {
      message,
      projectId,
      history = [],
      conversationId,
      conversationState,
    } = body;

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

    // Get agent session for context
    const agentSession = await agentService.getSessionStatus(agentSessionId);
    if (!agentSession) {
      throw new Error("Agent session not found");
    }

    // Initialize conversation analyzer
    const analyzer = new ConversationAnalyzer(agentSession.context, history);

    // Check conversation state
    const currentState: ConversationState = conversationState || {
      phase: "clarifying",
      clarificationCount: 0,
    };

    // Handle confirmation/rejection for proposals
    if (
      currentState.phase === "proposing" &&
      currentState.pendingConfirmation
    ) {
      if (analyzer.isConfirmation(message)) {
        // User confirmed - execute the plan
        const plan = currentState.pendingConfirmation.plan;

        // Store the plan in the session
        await agentService.approvePlan(agentSessionId, session.user.id);

        // Execute the plan
        const result = await agentService.executePlan(agentSessionId);

        let response = "";
        if (result.success) {
          response = `✅ ${result.summary || "Action completed successfully!"}`;
          if (result.steps && result.steps.length > 0) {
            const completedSteps = result.steps.filter(
              (s) => s.status === "completed"
            );
            if (completedSteps.length > 0) {
              response += "\n\nWhat I did:";
              completedSteps.forEach((step, idx) => {
                response += `\n${idx + 1}. ${step.tool}`;
              });
            }
          }
        } else {
          response = `❌ I encountered an issue: ${
            result.summary || "Unknown error"
          }`;
        }

        await conversationManager.addMessage(
          conversationContext.conversation.id,
          "assistant",
          response,
          { phase: "completed", executed: true }
        );

        return NextResponse.json({
          response,
          conversationId: conversationContext.conversation.id,
          sessionId: agentSessionId,
          conversationState: { phase: "completed" },
          functionCalled: true,
        });
      } else if (analyzer.isRejection(message)) {
        // User rejected - go back to clarifying
        const response =
          "No problem! What would you like me to help you with instead?";

        await conversationManager.addMessage(
          conversationContext.conversation.id,
          "assistant",
          response,
          { phase: "clarifying" }
        );

        return NextResponse.json({
          response,
          conversationId: conversationContext.conversation.id,
          sessionId: agentSessionId,
          conversationState: { phase: "clarifying", clarificationCount: 0 },
          functionCalled: false,
        });
      }
    }

    // Analyze user intent
    const analysis = await analyzer.analyzeIntent(message);

    // If we need clarification
    if (analysis.needsClarification && currentState.clarificationCount < 3) {
      const response = await analyzer.generateClarifyingResponse(analysis);

      await conversationManager.addMessage(
        conversationContext.conversation.id,
        "assistant",
        response,
        { phase: "clarifying", analysis }
      );

      return NextResponse.json({
        response,
        conversationId: conversationContext.conversation.id,
        sessionId: agentSessionId,
        conversationState: {
          phase: "clarifying",
          clarificationCount: currentState.clarificationCount + 1,
          intent: analysis.suggestedIntent,
          entities: analysis.extractedEntities,
        },
        functionCalled: false,
      });
    }

    // Generate plan if we have enough clarity
    const plan = await agentService.generatePlan(agentSessionId, message);

    // Check if this should be auto-executed or proposed
    const isReadOnly = plan.steps.every((step) => {
      const tool = agentService.getToolByName(step.tool);
      return tool && !tool.mutates;
    });

    // For now, always propose the plan first (even for read-only)
    // to give users control and understanding
    const proposal = await analyzer.generateProposal(plan);

    await conversationManager.addMessage(
      conversationContext.conversation.id,
      "assistant",
      proposal,
      { phase: "proposing", plan }
    );

    return NextResponse.json({
      response: proposal,
      conversationId: conversationContext.conversation.id,
      sessionId: agentSessionId,
      conversationState: {
        phase: "proposing",
        pendingConfirmation: { plan, description: plan.description },
      },
      functionCalled: false,
      requiresConfirmation: true,
    });

    // OLD CODE - keeping for reference (will be removed)
    /*
    let response: string;
    let functionCalled = true;

    if (isReadOnly) {
      // Auto-execute read-only operations
      const result = await agentService.executePlan(agentSessionId);

      if (result.success) {
        // Format response based on the tool used
        if (result.steps && result.steps.length > 0) {
          const step = result.steps[0];

          if (step.tool === "get_projects" && step.output) {
            // Format project overview
            const projects = step.output as any[];
            response = `## Site Overview\n\n`;
            response += `**Total Projects:** ${projects.length}\n\n`;

            // Group by status
            const activeProjects = projects.filter((p: any) =>
              p.status === "ACTIVE" || p.status === "In Progress"
            );
            const blockedProjects = projects.filter((p: any) => p.status === "Blocked");
            const notStarted = projects.filter((p: any) => p.status === "Not Started");

            response += `**Status Breakdown:**\n`;
            response += `- Active/In Progress: ${activeProjects.length}\n`;
            response += `- Blocked: ${blockedProjects.length}\n`;
            response += `- Not Started: ${notStarted.length}\n\n`;

            response += `**Projects by Branch:**\n`;
            const branches = [...new Set(projects.map((p: any) => p.branch))];
            branches.forEach(branch => {
              const branchProjects = projects.filter((p: any) => p.branch === branch);
              response += `- ${branch}: ${branchProjects.length} projects\n`;
            });

            response += `\n**Recent Projects:**\n`;
            projects.slice(0, 5).forEach((p: any) => {
              response += `- **${p.title}** (${p.branch})\n`;
              response += `  Status: ${p.status}, Tasks: ${p._count?.tasks || 0}\n`;
            });

            response += `\n**Task Distribution:**\n`;
            const totalTasks = projects.reduce((sum: number, p: any) =>
              sum + (p._count?.tasks || 0), 0
            );
            response += `Total tasks across all projects: ${totalTasks}`;
          } else {
            // Default formatting for other tools
            response = result.summary || "Operation completed successfully.";

            if (step.output) {
              const outputs = result.steps
                .filter((s) => s.status === "completed" && s.output)
                .map((s) => {
                  if (typeof s.output === "object") {
                    // Provide a summary instead of raw JSON
                    if (Array.isArray(s.output)) {
                      return `Retrieved ${s.output.length} items`;
                    }
                    return `Operation completed with result`;
                  }
                  return s.output;
                });

              if (outputs.length > 0) {
                response += "\n\n" + outputs.join("\n");
              }
            }
          }
        } else {
          response = result.summary || "Operation completed successfully.";
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
                // For project creation, just show the created project
                if (s.tool === "create_project" && s.output.id) {
                  return `Created project:\n- ID: ${s.output.id}\n- Title: ${s.output.title}\n- Status: ${s.output.status}`;
                }
                // For get_projects, summarize instead of showing all
                if (s.tool === "get_projects" && Array.isArray(s.output)) {
                  return `Found ${s.output.length} projects in the system.`;
                }
                // Default: show compact JSON
                return JSON.stringify(s.output, null, 2).substring(0, 500);
              }
              return s.output;
            });

          if (outputs.length > 0) {
            response += `\n\n**Results:**\n${outputs.join("\n\n")}`;
          }
        }
      } else {
        response = `❌ Operation failed: ${result.summary || "Unknown error"}\n`;
        // Check for errors in individual steps
        const failedSteps = result.steps.filter(
          (s) => s.status === "failed" && s.error
        );
        if (failedSteps.length > 0) {
          response += `\n**Error details:**\n`;
          failedSteps.forEach((step) => {
            response += `- ${step.tool}: ${step.error}\n`;
          });
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
    */
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
