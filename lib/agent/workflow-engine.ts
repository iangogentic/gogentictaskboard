import { prisma } from "@/lib/prisma";
import { Workflow, WorkflowExecution } from "@prisma/client";
import { toolRegistry } from "./tool-registry";
import { AgentContext } from "./types";
import { logAction } from "@/lib/audit";
import { v4 as uuidv4 } from "uuid";

export interface WorkflowStep {
  id: string;
  name: string;
  tool: string;
  parameters: any;
  condition?: {
    type: "if" | "unless" | "while";
    expression: string;
  };
  onSuccess?: string; // Next step ID
  onFailure?: string; // Error handler step ID
  retries?: number;
  timeout?: number;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  variables?: Record<string, any>;
  triggers?: {
    type: "manual" | "schedule" | "event" | "webhook";
    config: any;
  }[];
}

export class WorkflowEngine {
  private context: AgentContext;

  constructor(context: AgentContext) {
    this.context = context;
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(
    name: string,
    description: string,
    steps: WorkflowStep[],
    triggers?: any[],
    projectId?: string
  ): Promise<Workflow> {
    const workflow = await prisma.workflow.create({
      data: {
        id: uuidv4(),
        name,
        description,
        steps: steps as any,
        triggers: triggers as any,
        createdBy: this.context.user.id,
        projectId,
        updatedAt: new Date(),
      },
    });

    await logAction({
      actorId: this.context.user.id,
      actorType: "user",
      action: "create_workflow",
      targetType: "workflow",
      targetId: workflow.id,
      payload: { name, stepsCount: steps.length },
      status: "executed",
    });

    return workflow;
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflowId: string,
    initialContext?: Record<string, any>
  ): Promise<WorkflowExecution> {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    const definition = workflow.steps as unknown as WorkflowStep[];

    // Create execution record
    const execution = await prisma.workflowExecution.create({
      data: {
        id: uuidv4(),
        workflowId,
        status: "running",
        context: {
          variables: initialContext || {},
          results: {},
        },
      },
    });

    try {
      const result = await this.runWorkflowSteps(
        definition,
        execution.id,
        initialContext || {}
      );

      // Update execution as completed
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: "completed",
          result: result as any,
          completedAt: new Date(),
        },
      });

      await logAction({
        actorId: this.context.user.id,
        actorType: "user",
        action: "execute_workflow",
        targetType: "workflow",
        targetId: workflowId,
        payload: { executionId: execution.id, success: true },
        status: "executed",
      });

      return (await prisma.workflowExecution.findUnique({
        where: { id: execution.id },
      })) as WorkflowExecution;
    } catch (error: any) {
      // Update execution as failed
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: "failed",
          error: error.message,
          completedAt: new Date(),
        },
      });

      await logAction({
        actorId: this.context.user.id,
        actorType: "user",
        action: "execute_workflow",
        targetType: "workflow",
        targetId: workflowId,
        payload: {
          executionId: execution.id,
          success: false,
          error: error.message,
        },
        status: "failed",
      });

      throw error;
    }
  }

  /**
   * Run workflow steps
   */
  private async runWorkflowSteps(
    steps: WorkflowStep[],
    executionId: string,
    context: Record<string, any>
  ): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    const stepMap = new Map(steps.map((s) => [s.id, s]));
    let currentStepId: string | null = steps[0]?.id || null;
    let stepIndex = 0;

    while (currentStepId && stepIndex < steps.length * 2) {
      // Prevent infinite loops
      stepIndex++;

      const step = stepMap.get(currentStepId);
      if (!step) {
        throw new Error(`Step ${currentStepId} not found`);
      }

      // Update current step in execution
      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          currentStep: stepIndex,
          context: {
            ...context,
            currentStepId,
            results,
          } as any,
        },
      });

      // Check condition if present
      if (step.condition) {
        const conditionMet = await this.evaluateCondition(
          step.condition,
          context,
          results
        );

        if (!conditionMet) {
          // Skip to next step
          currentStepId =
            step.onSuccess || this.getNextStepId(steps, currentStepId);
          continue;
        }
      }

      try {
        // Execute step with retries
        const result = await this.executeStep(step, context, results);
        results[step.id] = result;

        // Determine next step
        currentStepId =
          step.onSuccess || this.getNextStepId(steps, currentStepId);
      } catch (error: any) {
        if (step.onFailure) {
          // Go to error handler step
          currentStepId = step.onFailure;
          results[step.id] = { error: error.message };
        } else {
          throw error;
        }
      }
    }

    return results;
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    step: WorkflowStep,
    context: Record<string, any>,
    results: Record<string, any>
  ): Promise<any> {
    const tool = toolRegistry.get(step.tool);
    if (!tool) {
      throw new Error(`Tool ${step.tool} not found`);
    }

    // Resolve parameters with context variables
    const resolvedParams = this.resolveParameters(
      step.parameters,
      context,
      results
    );

    let lastError: any;
    const maxRetries = step.retries || 1;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Use toolRegistry.execute with proper ToolContext
        const result = await toolRegistry.execute(
          step.tool,
          {
            userId: this.context.user.id,
            projectId: this.context.project?.id,
            session: this.context.session,
            permissions: this.context.permissions,
            traceId: `workflow_${step.id}_${attempt}`,
            user: this.context.user, // Already has full user object
          },
          resolvedParams
        );

        return result;
      } catch (error) {
        lastError = error;
      }

      if (attempt < maxRetries - 1) {
        // Wait before retry
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (attempt + 1))
        );
      }
    }

    throw lastError;
  }

  /**
   * Evaluate a condition
   */
  private async evaluateCondition(
    condition: { type: string; expression: string },
    context: Record<string, any>,
    results: Record<string, any>
  ): Promise<boolean> {
    // Simple expression evaluation
    // In production, use a proper expression evaluator
    const expression = condition.expression
      .replace(/\$\{(\w+)\}/g, (_, key) => context[key])
      .replace(/\$results\.(\w+)/g, (_, key) => JSON.stringify(results[key]));

    try {
      // WARNING: eval is dangerous, use a proper expression parser in production
      const result = eval(expression);
      return condition.type === "unless" ? !result : result;
    } catch (error) {
      console.error("Condition evaluation error:", error);
      return false;
    }
  }

  /**
   * Resolve parameters with context
   */
  private resolveParameters(
    parameters: any,
    context: Record<string, any>,
    results: Record<string, any>
  ): any {
    if (typeof parameters === "string") {
      return parameters
        .replace(/\$\{(\w+)\}/g, (_, key) => context[key])
        .replace(/\$results\.(\w+)\.?(\w*)/g, (_, stepId, prop) => {
          const stepResult = results[stepId];
          return prop ? stepResult?.[prop] : stepResult;
        });
    }

    if (Array.isArray(parameters)) {
      return parameters.map((p) => this.resolveParameters(p, context, results));
    }

    if (typeof parameters === "object" && parameters !== null) {
      const resolved: any = {};
      for (const [key, value] of Object.entries(parameters)) {
        resolved[key] = this.resolveParameters(value, context, results);
      }
      return resolved;
    }

    return parameters;
  }

  /**
   * Get next step ID in sequence
   */
  private getNextStepId(
    steps: WorkflowStep[],
    currentId: string
  ): string | null {
    const currentIndex = steps.findIndex((s) => s.id === currentId);
    if (currentIndex >= 0 && currentIndex < steps.length - 1) {
      return steps[currentIndex + 1].id;
    }
    return null;
  }

  /**
   * Get workflow templates
   */
  async getWorkflowTemplates(): Promise<Workflow[]> {
    return await prisma.workflow.findMany({
      where: {
        isTemplate: true,
        isActive: true,
      },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Clone a workflow from template
   */
  async cloneWorkflow(
    templateId: string,
    name: string,
    projectId?: string
  ): Promise<Workflow> {
    const template = await prisma.workflow.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new Error("Template not found");
    }

    return await this.createWorkflow(
      name,
      template.description || `Cloned from ${template.name}`,
      template.steps as unknown as WorkflowStep[],
      template.triggers as unknown as any[],
      projectId
    );
  }

  /**
   * Get workflow execution history
   */
  async getWorkflowExecutions(
    workflowId?: string,
    limit: number = 10
  ): Promise<WorkflowExecution[]> {
    const where: any = {};
    if (workflowId) {
      where.workflowId = workflowId;
    }

    return await prisma.workflowExecution.findMany({
      where,
      orderBy: { startedAt: "desc" },
      take: limit,
      include: {
        Workflow: true,
      },
    });
  }

  /**
   * Cancel a running workflow
   */
  async cancelWorkflow(executionId: string): Promise<void> {
    await prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        status: "cancelled",
        completedAt: new Date(),
      },
    });
  }
}

// Workflow templates
export const WORKFLOW_TEMPLATES = {
  dailyStandup: {
    name: "Daily Standup Report",
    description: "Collect and send daily standup reports",
    steps: [
      {
        id: "collect-updates",
        name: "Collect Updates",
        tool: "list_updates",
        parameters: {
          projectId: "${projectId}",
          since: "${yesterday}",
        },
      },
      {
        id: "collect-tasks",
        name: "Collect Tasks",
        tool: "list_tasks",
        parameters: {
          projectId: "${projectId}",
          status: "Done",
        },
      },
      {
        id: "generate-report",
        name: "Generate Report",
        tool: "generate",
        parameters: {
          prompt: "Create a daily standup report from the updates and tasks",
          context: "$results.collect-updates",
        },
      },
      {
        id: "send-slack",
        name: "Send to Slack",
        tool: "send_slack_message",
        parameters: {
          channel: "${channelId}",
          message: "$results.generate-report",
        },
      },
    ],
  },
  weeklySync: {
    name: "Weekly Project Sync",
    description: "Sync all project data and generate weekly report",
    steps: [
      {
        id: "sync-docs",
        name: "Sync Documents",
        tool: "sync_documents",
        parameters: {
          projectId: "${projectId}",
          sources: ["project", "slack", "gdrive"],
        },
      },
      {
        id: "analyze-progress",
        name: "Analyze Progress",
        tool: "analyze",
        parameters: {
          projectId: "${projectId}",
          type: "progress",
        },
      },
      {
        id: "create-report",
        name: "Create Report",
        tool: "generate",
        parameters: {
          prompt: "Create weekly progress report",
          context: "$results.analyze-progress",
        },
      },
      {
        id: "save-update",
        name: "Save Update",
        tool: "create_update",
        parameters: {
          projectId: "${projectId}",
          body: "$results.create-report",
        },
      },
    ],
  },
};
