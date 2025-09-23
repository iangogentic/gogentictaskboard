import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { AgentService } from "@/lib/agent/service";
import { conversationManager } from "@/lib/agent/conversation";
import { ConversationAnalyzer } from "@/lib/agent/conversation-analyzer";
import { ConversationStateService } from "@/lib/agent/conversation-state-service";

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
      // SECURITY: Never accept conversationState from client!
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

    // Get server-side state (never trust client!)
    const currentState = await ConversationStateService.getOrCreateState(
      conversationContext.conversation.id
    );

    // Create or get agent session
    let agentSessionId = currentState.agentSessionId;

    if (!agentSessionId) {
      const agentSession = await agentService.createSession(
        session.user.id,
        projectId
      );
      agentSessionId = agentSession.id;
      console.log("Created new agent session:", agentSessionId);

      // Store session ID in state
      currentState.agentSessionId = agentSessionId;
      await ConversationStateService.updateState(
        conversationContext.conversation.id,
        { agentSessionId }
      );

      // Store session ID in conversation metadata for backward compatibility
      await conversationManager.updateConversationMetadata(
        conversationContext.conversation.id,
        { agentSessionId }
      );
    } else {
      console.log("Reusing existing agent session:", agentSessionId);
    }

    // Get agent session for context
    const agentSession = await agentService.getSessionStatus(agentSessionId);
    if (!agentSession) {
      throw new Error("Agent session not found");
    }

    // Get or create analyzer with persistent state
    const analyzer = ConversationStateService.getOrCreateAnalyzer(
      conversationContext.conversation.id,
      agentSession.context,
      history
    );

    // Restore accumulated entities from database state
    if (currentState.workingMemory?.accumulatedEntities) {
      analyzer.setAccumulatedEntities(currentState.workingMemory.accumulatedEntities);
    }

    // Handle confirmation/rejection for proposals
    if (
      currentState.phase === "proposing" &&
      currentState.pendingConfirmation
    ) {
      if (analyzer.isConfirmation(message)) {
        // User confirmed - execute the plan
        console.log("User confirmed, executing plan from session:", agentSessionId);

        // Check if plan exists in the session
        const sessionCheck = await agentService.getSessionStatus(agentSessionId);
        console.log("Session has plan?", !!sessionCheck?.plan);

        // Approve the plan that's already in the session
        await agentService.approvePlan(agentSessionId, session.user.id);

        // Execute the approved plan
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

        // Update state to completed
        await ConversationStateService.updateState(
          conversationContext.conversation.id,
          { phase: "completed" }
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

        // Reset state to clarifying
        await ConversationStateService.updateState(
          conversationContext.conversation.id,
          {
            phase: "clarifying",
            clarificationCount: 0,
            pendingConfirmation: undefined
          }
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

    // Use confidence-based clarification (only clarify if confidence < 0.7)
    const confidence = analysis.confidence || 0.5;
    const shouldClarify = analysis.needsClarification &&
                          confidence < 0.7 &&
                          currentState.clarificationCount < 3;

    // If we need clarification
    if (shouldClarify) {
      const response = await analyzer.generateClarifyingResponse(analysis);

      await conversationManager.addMessage(
        conversationContext.conversation.id,
        "assistant",
        response,
        { phase: "clarifying", analysis }
      );

      // Update state in database
      const newState = {
        phase: "clarifying" as const,
        clarificationCount: currentState.clarificationCount + 1,
        entities: analysis.extractedEntities || {},
        confidence: analysis.confidence || 0.5,
        workingMemory: {
          partialIntent: analysis.suggestedIntent,
          accumulatedEntities: analyzer.getAccumulatedEntities(),
        },
      };

      await ConversationStateService.updateState(
        conversationContext.conversation.id,
        newState
      );

      return NextResponse.json({
        response,
        conversationId: conversationContext.conversation.id,
        sessionId: agentSessionId,
        conversationState: {
          phase: "clarifying",
          clarificationCount: newState.clarificationCount,
          intent: analysis.suggestedIntent,
          entities: analysis.extractedEntities,
          confidence: analysis.confidence,
        },
        functionCalled: false,
      });
    }

    // Generate plan if we have enough clarity
    console.log("Generating plan for session:", agentSessionId);
    const plan = await agentService.generatePlan(agentSessionId, message);
    console.log("Plan generated with ID:", plan.id);

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

    // Update state to proposing
    await ConversationStateService.updateState(
      conversationContext.conversation.id,
      {
        phase: "proposing",
        pendingConfirmation: {
          planId: plan.id,
          description: plan.description
        },
        workingMemory: {
          accumulatedEntities: analyzer.getAccumulatedEntities(),
        },
      }
    );

    return NextResponse.json({
      response: proposal,
      conversationId: conversationContext.conversation.id,
      sessionId: agentSessionId,
      conversationState: {
        phase: "proposing",
        pendingConfirmation: {
          planId: plan.id,
          description: plan.description
        },
      },
      functionCalled: false,
      requiresConfirmation: true,
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