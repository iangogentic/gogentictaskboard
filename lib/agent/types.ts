// Agent system types and interfaces

export type AgentActorType = "user" | "agent" | "system";
export type AgentState =
  | "idle"
  | "planning"
  | "awaiting_approval"
  | "executing"
  | "completed"
  | "failed";
export type ToolStatus = "pending" | "running" | "completed" | "failed";

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => Promise<ToolResult>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export interface AgentPlan {
  id: string;
  title: string;
  description: string;
  steps: PlanStep[];
  estimatedDuration?: number;
  risks?: string[];
  dependencies?: string[];
  createdAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
}

export interface PlanStep {
  id: string;
  order: number;
  title: string;
  description: string;
  tool: string;
  parameters: Record<string, any>;
  status: ToolStatus;
  result?: ToolResult;
  startedAt?: Date;
  completedAt?: Date;
  retryCount?: number;
}

export interface AgentSession {
  id: string;
  userId: string;
  projectId?: string;
  state: AgentState;
  plan?: AgentPlan;
  currentStep?: number;
  result?: AgentResult;
  context: AgentContext;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface AgentResult {
  success: boolean;
  summary: string;
  steps: StepResult[];
  artifacts?: Artifact[];
  metrics?: ExecutionMetrics;
}

export interface StepResult {
  stepId: string;
  tool: string;
  status: ToolStatus;
  output?: any;
  error?: string;
  duration?: number;
}

export interface Artifact {
  type: "file" | "folder" | "task" | "update" | "document";
  id: string;
  name: string;
  path?: string;
  url?: string;
  metadata?: Record<string, any>;
}

export interface ExecutionMetrics {
  totalDuration: number;
  successfulSteps: number;
  failedSteps: number;
  retries: number;
  toolsUsed: string[];
}

export interface AgentContext {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  project?: {
    id: string;
    title: string;
    description?: string;
  };
  integrations: {
    slack: boolean;
    googleDrive: boolean;
  };
  permissions: string[];
  variables: Record<string, any>;
}

export interface AgentMessage {
  id: string;
  sessionId: string;
  type: "user" | "agent" | "system" | "tool";
  content: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface ToolDefinition {
  name: string;
  description: string;
  category: "project" | "task" | "document" | "integration" | "utility";
  parameters: ToolParameter[];
  requiredPermissions?: string[];
  requiredIntegrations?: string[];
}

export interface ToolParameter {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  description: string;
  required: boolean;
  default?: any;
  enum?: any[];
  validation?: (value: any) => boolean;
}
