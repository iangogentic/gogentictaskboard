from pathlib import Path
path = Path('lib/agent/conversation-state-service.ts')
text = path.read_text()
old = "export interface ConversationStateData {\n  phase: \"clarifying\" | \"proposing\" | \"executing\" | \"completed\";\n  entities: Record<string, any>;\n  workingMemory: {\n    partialIntent?: string;\n    lastTopic?: string;\n    accumulatedEntities?: Record<string, any>;\n  };\n  confidence: number;\n  clarificationCount: number;\n  agentSessionId?: string;\n}\n\n/**\n * Service for managing conversation state in the database\n * This ensures state persistence and security (no client control)\n */\nexport class ConversationStateService {"
new = "export interface PendingConfirmation {\n  planId: string;\n  description?: string;\n  summary?: string;\n  stepCount?: number;\n  planSnapshot?: any;\n}\n\nexport interface ConversationStateData {\n  phase: \"clarifying\" | \"proposing\" | \"executing\" | \"completed\";\n  entities: Record<string, any>;\n  workingMemory: {\n    partialIntent?: string;\n    lastTopic?: string;\n    accumulatedEntities?: Record<string, any>;\n  };\n  pendingConfirmation?: PendingConfirmation | null;\n  confidence: number;\n  clarificationCount: number;\n  agentSessionId?: string;\n}\n\n/**\n * Service for managing conversation state in the database\n * This ensures state persistence and security (no client control)\n */\nexport class ConversationStateService {"
if old not in text:
    raise SystemExit('Original block not found')
text = text.replace(old, new, 1)
path.write_text(text)
