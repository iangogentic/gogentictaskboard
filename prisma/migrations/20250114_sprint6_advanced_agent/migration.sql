-- Sprint 6: Advanced Agent Features

-- Create Conversation table
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "title" TEXT,
    "summary" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- Create Message table
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- Create Workflow table
CREATE TABLE "Workflow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "steps" JSONB NOT NULL,
    "triggers" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- Create WorkflowExecution table
CREATE TABLE "WorkflowExecution" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "context" JSONB NOT NULL,
    "result" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "WorkflowExecution_pkey" PRIMARY KEY ("id")
);

-- Create ScheduledTask table
CREATE TABLE "ScheduledTask" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT,
    "name" TEXT NOT NULL,
    "cron" TEXT NOT NULL,
    "nextRun" TIMESTAMP(3) NOT NULL,
    "lastRun" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "metadata" JSONB,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledTask_pkey" PRIMARY KEY ("id")
);

-- Create AgentAnalytics table
CREATE TABLE "AgentAnalytics" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "action" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "toolsUsed" JSONB,
    "tokensUsed" INTEGER,
    "cost" DOUBLE PRECISION,
    "success" BOOLEAN NOT NULL,
    "errorType" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentAnalytics_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "Conversation_userId_idx" ON "Conversation"("userId");
CREATE INDEX "Conversation_projectId_idx" ON "Conversation"("projectId");
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");
CREATE INDEX "Workflow_createdBy_idx" ON "Workflow"("createdBy");
CREATE INDEX "Workflow_projectId_idx" ON "Workflow"("projectId");
CREATE INDEX "WorkflowExecution_workflowId_idx" ON "WorkflowExecution"("workflowId");
CREATE INDEX "WorkflowExecution_status_idx" ON "WorkflowExecution"("status");
CREATE INDEX "ScheduledTask_status_idx" ON "ScheduledTask"("status");
CREATE INDEX "ScheduledTask_nextRun_idx" ON "ScheduledTask"("nextRun");
CREATE INDEX "AgentAnalytics_userId_idx" ON "AgentAnalytics"("userId");
CREATE INDEX "AgentAnalytics_projectId_idx" ON "AgentAnalytics"("projectId");
CREATE INDEX "AgentAnalytics_createdAt_idx" ON "AgentAnalytics"("createdAt");

-- Add foreign keys
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" 
    FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkflowExecution" ADD CONSTRAINT "WorkflowExecution_workflowId_fkey" 
    FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ScheduledTask" ADD CONSTRAINT "ScheduledTask_workflowId_fkey" 
    FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;