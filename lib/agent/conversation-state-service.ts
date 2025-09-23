import { prisma } from "@/lib/prisma";
import { ConversationAnalyzer } from "./conversation-analyzer";
import { AgentContext } from "./types";

export interface PendingConfirmation {
  planId: string;
  description?: string;
  summary?: string;
  stepCount?: number;
  planSnapshot?: any;
}

export interface ConversationStateData {
  phase: "clarifying" | "proposing" | "executing" | "completed";
  entities: Record<string, any>;
  workingMemory: {
    partialIntent?: string;
    lastTopic?: string;
    accumulatedEntities?: Record<string, any>;
  };
  pendingConfirmation?: PendingConfirmation | null;
  confidence: number;
  clarificationCount: number;
  agentSessionId?: string;
}

export class ConversationStateService {
  private static analyzers = new Map<string, ConversationAnalyzer>();

  /**
   * Get or create conversation state from database
   */
  static async getOrCreateState(
    conversationId: string
  ): Promise<ConversationStateData> {
    try {
      // Try to get existing state from ConversationState table
      const existingState = await prisma.conversationState.findUnique({
        where: { conversationId },
      });

      if (existingState) {
        return {
          phase: existingState.phase as ConversationStateData["phase"],
          entities: (existingState.entities as Record<string, any>) || {},
          workingMemory: {
            ...((existingState.workingMemory as any) || {}),
            accumulatedEntities:
              (existingState.accumulatedEntities as Record<string, any>) || {},
          },
          confidence: existingState.confidence,
          clarificationCount: existingState.clarificationCount,
          agentSessionId: existingState.agentSessionId || undefined,
          pendingConfirmation:
            (existingState.pendingConfirmation as PendingConfirmation | null) ??
            null,
        };
      }

      // Create new state if doesn't exist
      await prisma.conversationState.create({
        data: {
          conversationId,
          phase: "clarifying",
          entities: {},
          workingMemory: { accumulatedEntities: {} },
          accumulatedEntities: {},
          confidence: 0.5,
          clarificationCount: 0,
        },
      });

      return {
        phase: "clarifying",
        entities: {},
        workingMemory: { accumulatedEntities: {} },
        confidence: 0.5,
        clarificationCount: 0,
        pendingConfirmation: null,
      };
    } catch (error) {
      // If ConversationState table doesn't exist yet, return default state
      // This is a temporary fallback until migration is complete
      console.warn(
        "ConversationState table not available, using default state"
      );
      return {
        phase: "clarifying",
        entities: {},
        workingMemory: { accumulatedEntities: {} },
        confidence: 0.5,
        clarificationCount: 0,
        pendingConfirmation: null,
      };
    }
  }

  /**
   * Update conversation state in database
   */
  static async updateState(
    conversationId: string,
    state: Partial<ConversationStateData>
  ): Promise<void> {
    try {
      const createData = {
        conversationId,
        phase: state.phase ?? "clarifying",
        entities: state.entities ?? {},
        workingMemory: state.workingMemory ?? {},
        accumulatedEntities: state.workingMemory?.accumulatedEntities ?? {},
        confidence: state.confidence ?? 0.5,
        clarificationCount: state.clarificationCount ?? 0,
        agentSessionId: state.agentSessionId,
        pendingConfirmation:
          state.pendingConfirmation === undefined
            ? null
            : (state.pendingConfirmation as PendingConfirmation | null),
      } as any;

      const updateData: Record<string, any> = {
        phase: state.phase,
        entities: state.entities,
        workingMemory: state.workingMemory,
        accumulatedEntities: state.workingMemory?.accumulatedEntities,
        confidence: state.confidence,
        clarificationCount: state.clarificationCount,
        agentSessionId: state.agentSessionId,
      };

      if (state.pendingConfirmation !== undefined) {
        updateData.pendingConfirmation =
          state.pendingConfirmation as PendingConfirmation | null;
      }

      await prisma.conversationState.upsert({
        where: { conversationId },
        create: createData,
        update: updateData,
      });
    } catch (error) {
      // If table doesn't exist, log but don't fail
      console.warn("Could not update ConversationState in database:", error);
    }
  }

  /**
   * Get or create a ConversationAnalyzer instance
   * This ensures the analyzer persists across requests for the same conversation
   */
  static getOrCreateAnalyzer(
    conversationId: string,
    context: AgentContext,
    history: Array<{ role: string; content: string }>
  ): ConversationAnalyzer {
    let analyzer = this.analyzers.get(conversationId);

    if (!analyzer) {
      analyzer = new ConversationAnalyzer(context, history);
      this.analyzers.set(conversationId, analyzer);

      // Clean up old analyzers after 1 hour
      setTimeout(
        () => {
          this.analyzers.delete(conversationId);
        },
        60 * 60 * 1000
      );
    } else {
      // Update history if provided
      if (history && history.length > 0) {
        history.forEach((msg) => {
          analyzer!.addToHistory(msg.role as "user" | "assistant", msg.content);
        });
      }
    }

    return analyzer;
  }

  /**
   * Clear analyzer cache for a conversation
   */
  static clearAnalyzer(conversationId: string): void {
    this.analyzers.delete(conversationId);
  }

  /**
   * Reset conversation state
   */
  static async resetState(conversationId: string): Promise<void> {
    try {
      await prisma.conversationState.delete({
        where: { conversationId },
      });
    } catch (error) {
      console.warn("Could not reset ConversationState:", error);
    }
    this.clearAnalyzer(conversationId);
  }
}
