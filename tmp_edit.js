const fs = require("fs");
const path = "lib/agent/conversation-state-service.ts";
let text = fs.readFileSync(path, "utf8");
const oldBlock = `export interface ConversationStateData {
  phase: "clarifying" | "proposing" | "executing" | "completed";
  entities: Record<string, any>;
  workingMemory: {
    partialIntent?: string;
    lastTopic?: string;
    accumulatedEntities?: Record<string, any>;
  };
  confidence: number;
  clarificationCount: number;
  agentSessionId?: string;
}

/**
 * Service for managing conversation state in the database
 * This ensures state persistence and security (no client control)
 */
export class ConversationStateService {`;
const newBlock = `export interface PendingConfirmation {
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

/**
 * Service for managing conversation state in the database
 * This ensures state persistence and security (no client control)
 */
export class ConversationStateService {`;
if (!text.includes(oldBlock)) {
  throw new Error("Original block not found");
}
text = text.replace(oldBlock, newBlock);
fs.writeFileSync(path, text, "utf8");
