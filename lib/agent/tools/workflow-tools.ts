import { z } from "zod";
import { ToolDefinition } from "../tool-registry";
import { WorkflowEngine, WORKFLOW_TEMPLATES } from "../workflow-engine";
import { prisma } from "@/lib/prisma";
import { AgentContext } from "../types";

// Schemas for Workflow tools
const createWorkflowSchema = z.object({
  name: z.string().describe("Workflow name"),
  description: z.string().optional().describe("Workflow description"),
  templateId: z.string().optional().describe("Template ID to use as base"),
  projectId: z.string().optional().describe("Associated project ID"),
  trigger: z.object({
    type: z.enum(["manual", "schedule", "event"]),
    config: z.record(z.any()).optional(),
  }),
  steps: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      config: z.record(z.any()),
      dependencies: z.array(z.string()).optional(),
    })
  ),
});

const executeWorkflowSchema = z.object({
  workflowId: z.string().describe("Workflow ID to execute"),
  input: z.record(z.any()).optional().describe("Input data for workflow"),
  dryRun: z
    .boolean()
    .optional()
    .default(false)
    .describe("Execute in dry-run mode"),
});

const scheduleWorkflowSchema = z.object({
  workflowId: z.string().describe("Workflow ID to schedule"),
  cron: z
    .string()
    .describe("Cron expression (e.g., '0 9 * * 1' for every Monday at 9 AM)"),
  enabled: z.boolean().optional().default(true),
});

const listWorkflowsSchema = z.object({
  projectId: z.string().optional().describe("Filter by project ID"),
  status: z.enum(["active", "paused", "completed", "failed"]).optional(),
});

export const workflowTools: ToolDefinition[] = [
  {
    name: "createWorkflow",
    description: "Create a new automation workflow",
    schema: createWorkflowSchema,
    mutates: true,
    scopes: ["workflow:write"],
    handler: async (ctx, input) => {
      try {
        const context: AgentContext = {
          user: { id: ctx.userId, name: "", email: "", role: "user" },
          project: input.projectId
            ? { id: input.projectId, title: "", description: "" }
            : undefined,
          integrations: { slack: false, googleDrive: false },
          permissions: [],
          variables: {},
        };
        const engine = new WorkflowEngine(context);

        // If using a template, load it first
        let workflowData = {
          name: input.name,
          description: input.description,
          trigger: input.trigger,
          steps: input.steps,
          projectId: input.projectId,
          userId: ctx.userId,
        };

        if (input.templateId) {
          const template =
            WORKFLOW_TEMPLATES[
              input.templateId as keyof typeof WORKFLOW_TEMPLATES
            ];
          if (template) {
            workflowData = {
              ...template,
              ...workflowData,
              name: input.name, // Override template name
            };
          }
        }

        // Create workflow in database
        const workflow = await prisma.workflow.create({
          data: {
            id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdBy: ctx.userId,
            projectId: input.projectId,
            name: workflowData.name,
            description: workflowData.description,
            steps: workflowData.steps,
            triggers: workflowData.trigger,
            isActive: true,
            updatedAt: new Date(),
          },
        });

        // Schedule if it's a scheduled workflow
        if (
          workflowData.trigger.type === "schedule" &&
          workflowData.trigger.config?.cron
        ) {
          await prisma.scheduledTask.create({
            data: {
              id: `st_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              workflowId: workflow.id,
              name: `Schedule for ${workflow.name}`,
              createdBy: ctx.userId,
              cron: workflowData.trigger.config.cron,
              nextRun: new Date(), // Will be calculated by scheduler
              status: "active",
              updatedAt: new Date(),
            },
          });
        }

        return {
          success: true,
          workflowId: workflow.id,
          message: `Workflow "${input.name}" created successfully`,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || "Failed to create workflow",
        };
      }
    },
  },

  {
    name: "executeWorkflow",
    description: "Execute a workflow immediately",
    schema: executeWorkflowSchema,
    mutates: true,
    scopes: ["workflow:execute"],
    handler: async (ctx, input) => {
      try {
        const context: AgentContext = {
          user: { id: ctx.userId, name: "", email: "", role: "user" },
          project: input.projectId
            ? { id: input.projectId, title: "", description: "" }
            : undefined,
          integrations: { slack: false, googleDrive: false },
          permissions: [],
          variables: {},
        };
        const engine = new WorkflowEngine(context);

        // Get workflow
        const workflow = await prisma.workflow.findFirst({
          where: {
            id: input.workflowId,
            createdBy: ctx.userId,
          },
        });

        if (!workflow) {
          throw new Error("Workflow not found or access denied");
        }

        // Execute workflow
        const execution = await engine.executeWorkflow(
          workflow.id,
          input.input || {}
        );

        // Wait for completion if not dry run
        if (!input.dryRun) {
          // In real implementation, this would be async with webhooks
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        const executionRecord = await prisma.workflowExecution.findUnique({
          where: { id: execution.id },
        });

        return {
          success: true,
          executionId: execution.id,
          status: executionRecord?.status,
          result: executionRecord?.result,
          message: input.dryRun
            ? "Workflow dry run completed"
            : "Workflow execution started",
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || "Failed to execute workflow",
        };
      }
    },
  },

  {
    name: "scheduleWorkflow",
    description: "Schedule a workflow to run automatically",
    schema: scheduleWorkflowSchema,
    mutates: true,
    scopes: ["workflow:write"],
    handler: async (ctx, input) => {
      try {
        // Verify workflow exists and user has access
        const workflow = await prisma.workflow.findFirst({
          where: {
            id: input.workflowId,
            createdBy: ctx.userId,
          },
        });

        if (!workflow) {
          throw new Error("Workflow not found or access denied");
        }

        // Create scheduled task - ScheduledTask doesn't have a unique constraint for upsert
        // So we'll try to find existing and update, or create new
        const existingTask = await prisma.scheduledTask.findFirst({
          where: {
            workflowId: input.workflowId,
            createdBy: ctx.userId,
          },
        });

        let scheduledTask;
        if (existingTask) {
          scheduledTask = await prisma.scheduledTask.update({
            where: { id: existingTask.id },
            data: {
              cron: input.cron,
              status: input.enabled ? "active" : "paused",
              nextRun: new Date(),
              updatedAt: new Date(),
            },
          });
        } else {
          scheduledTask = await prisma.scheduledTask.create({
            data: {
              id: `st_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              workflowId: input.workflowId,
              name: `Schedule for workflow ${input.workflowId}`,
              createdBy: ctx.userId,
              cron: input.cron,
              nextRun: new Date(),
              status: input.enabled ? "active" : "paused",
              updatedAt: new Date(),
            },
          });
        }

        return {
          success: true,
          scheduledTaskId: scheduledTask.id,
          message: `Workflow scheduled: ${input.cron}`,
          nextRun: scheduledTask.nextRun,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || "Failed to schedule workflow",
        };
      }
    },
  },

  {
    name: "listWorkflows",
    description: "List available workflows",
    schema: listWorkflowsSchema,
    mutates: false,
    scopes: ["workflow:read"],
    handler: async (ctx, input) => {
      try {
        const whereClause: any = {
          createdBy: ctx.userId,
        };

        if (input.projectId) {
          whereClause.projectId = input.projectId;
        }

        const workflows = await prisma.workflow.findMany({
          where: whereClause,
          include: {
            _count: {
              select: { WorkflowExecution: true },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        return {
          success: true,
          workflows: workflows.map((w) => ({
            id: w.id,
            name: w.name,
            description: w.description,
            isActive: w.isActive,
            projectId: w.projectId,
            executionCount: w._count.WorkflowExecution,
            createdAt: w.createdAt,
          })),
          count: workflows.length,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || "Failed to list workflows",
        };
      }
    },
  },

  {
    name: "getWorkflowTemplates",
    description: "Get available workflow templates",
    schema: z.object({}),
    mutates: false,
    scopes: ["workflow:read"],
    handler: async (ctx, input) => {
      try {
        const templates = Object.entries(WORKFLOW_TEMPLATES).map(
          ([id, template]) => ({
            id,
            name: template.name,
            description: template.description,
            stepCount: template.steps.length,
          })
        );

        return {
          success: true,
          templates,
          count: templates.length,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || "Failed to get workflow templates",
        };
      }
    },
  },
];
