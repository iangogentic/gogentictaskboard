import {
  AgentSession,
  AgentPlan,
  PlanStep,
  AgentState,
  ToolStatus,
  AgentResult,
  StepResult,
  ExecutionMetrics,
  AgentContext,
} from "./types";
import { toolRegistry } from "./tool-registry";
import { prisma } from "@/lib/prisma";
import { AuditLogger } from "@/lib/audit";
import { checkPermissions } from "@/lib/rbac";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { withRetry, retryNetworkRequest } from "./retry-utils";

export class AgentEngine {
  private session: AgentSession;
  private abortController: AbortController;

  constructor(session: AgentSession) {
    this.session = session;
    this.abortController = new AbortController();
  }

  // Execute a plan
  async execute(): Promise<AgentResult> {
    if (!this.session.plan) {
      throw new Error("No plan to execute");
    }

    const startTime = Date.now();
    const stepResults: StepResult[] = [];
    const toolsUsed = new Set<string>();
    let successfulSteps = 0;
    let failedSteps = 0;
    let totalRetries = 0;

    try {
      // Update session state
      await this.updateSessionState("executing");

      // Execute each step in order
      for (const step of this.session.plan.steps) {
        if (this.abortController.signal.aborted) {
          break;
        }

        const stepResult = await this.executeStep(step);
        stepResults.push(stepResult);
        toolsUsed.add(step.tool);

        if (stepResult.status === "completed") {
          successfulSteps++;
        } else if (stepResult.status === "failed") {
          failedSteps++;

          // Retry logic
          if (step.retryCount && step.retryCount < 3) {
            step.retryCount++;
            totalRetries++;
            const retryResult = await this.executeStep(step);
            stepResults.push(retryResult);

            if (retryResult.status === "completed") {
              successfulSteps++;
              failedSteps--;
            }
          }
        }

        // Track current step locally (not persisted to DB)
        await this.saveSession();
      }

      // Calculate metrics
      const metrics: ExecutionMetrics = {
        totalDuration: Date.now() - startTime,
        successfulSteps,
        failedSteps,
        retries: totalRetries,
        toolsUsed: Array.from(toolsUsed),
      };

      // Generate summary
      const summary = await this.generateExecutionSummary(stepResults, metrics);

      const result: AgentResult = {
        success: failedSteps === 0,
        summary,
        steps: stepResults,
        metrics,
      };

      // Update session with result
      this.session.result = result;
      this.session.state = result.success ? "completed" : "failed";
      await this.saveSession();

      // Log execution
      await AuditLogger.logSuccess(
        this.session.userId,
        "agent_execution",
        "agent",
        this.session.id,
        {
          planId: this.session.plan.id,
          metrics,
        }
      );

      return result;
    } catch (error: any) {
      await AuditLogger.logFailure(
        this.session.userId,
        "agent_execution",
        "agent",
        error.message,
        this.session.id
      );

      await this.updateSessionState("failed", error.message);

      throw error;
    }
  }

  // Execute a single step with guardrails
  private async executeStep(step: PlanStep): Promise<StepResult> {
    const startTime = Date.now();

    try {
      // Update step status
      step.status = "running";
      step.startedAt = new Date();
      await this.saveSession();

      // Get the tool from registry
      const tool = toolRegistry.get(step.tool);
      if (!tool) {
        throw new Error(`Tool not found: ${step.tool}`);
      }

      // GUARDRAIL 1: Validate input schema
      let validatedParams;
      try {
        validatedParams = tool.schema.parse(step.parameters);
      } catch (validationError: any) {
        throw new Error(
          `Invalid parameters for ${step.tool}: ${validationError.message}`
        );
      }

      // GUARDRAIL 2: Check permissions
      const user = await prisma.user.findUnique({
        where: { id: this.session.userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const hasPermission = await checkPermissions(user, tool.scopes);
      if (!hasPermission) {
        throw new Error(
          `Insufficient permissions for tool ${step.tool}. Required scopes: ${tool.scopes.join(", ")}`
        );
      }

      // GUARDRAIL 3: Check if mutation requires approval
      if (tool.mutates && !this.session.plan?.approved) {
        throw new Error(
          `NEEDS_APPROVAL: Tool ${step.tool} requires plan approval before execution`
        );
      }

      // Build context for tool execution with full user object
      const toolContext = {
        userId: this.session.userId,
        projectId: this.session.projectId,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || "",
          role: user.role,
        },
        session: this.session,
        permissions: tool.scopes,
        traceId: `${this.session.id}_${step.id}`,
      };

      // Redact sensitive data for logging
      const redactedParams = this.redactSensitiveData(validatedParams);

      // Log tool call to audit (before execution)
      await AuditLogger.logSuccess(
        this.session.userId,
        "tool_execution_start",
        "tool",
        step.tool,
        {
          sessionId: this.session.id,
          stepId: step.id,
          parameters: redactedParams,
          scopes: tool.scopes,
          mutates: tool.mutates,
        }
      );

      // Execute the tool with error handling and retry logic
      let result;
      try {
        // Use retry logic for network-based tools
        const isNetworkTool =
          step.tool.includes("slack") ||
          step.tool.includes("drive") ||
          step.tool.includes("rag");

        if (isNetworkTool) {
          result = await retryNetworkRequest(
            () => toolRegistry.execute(step.tool, toolContext, validatedParams),
            {
              onRetry: (attempt, error) => {
                console.log(
                  `Retrying ${step.tool} (attempt ${attempt}): ${error.message}`
                );
                step.retryCount = (step.retryCount || 0) + 1;
              },
            }
          );
        } else {
          result = await toolRegistry.execute(
            step.tool,
            toolContext,
            validatedParams
          );
        }

        // Update step with result
        step.status = "completed";
        step.result = { success: true, data: result };
        step.completedAt = new Date();
      } catch (toolError: any) {
        // Handle tool execution failure
        step.status = "failed";
        step.result = {
          success: false,
          error: toolError.message || "Tool execution failed",
          details: toolError.stack,
        };
        step.completedAt = new Date();

        // Log the error
        await AuditLogger.logError(
          this.session.userId,
          "tool_execution_failed",
          "tool",
          step.tool,
          {
            sessionId: this.session.id,
            stepId: step.id,
            error: toolError.message,
            duration: Date.now() - startTime,
          }
        );

        // Re-throw for higher-level handling
        throw new Error(`Tool ${step.tool} failed: ${toolError.message}`);
      }

      await this.saveSession();

      // Log successful execution
      await AuditLogger.logSuccess(
        this.session.userId,
        "tool_execution_complete",
        "tool",
        step.tool,
        {
          sessionId: this.session.id,
          stepId: step.id,
          duration: Date.now() - startTime,
        }
      );

      return {
        stepId: step.id,
        tool: step.tool,
        status: "completed",
        output: result,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      step.status = "failed";
      step.completedAt = new Date();
      await this.saveSession();

      // Log failure
      await AuditLogger.logFailure(
        this.session.userId,
        "tool_execution_failed",
        "tool",
        error.message,
        step.tool,
        {
          sessionId: this.session.id,
          stepId: step.id,
          duration: Date.now() - startTime,
        }
      );

      return {
        stepId: step.id,
        tool: step.tool,
        status: "failed",
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }

  // Redact sensitive data from parameters
  private redactSensitiveData(params: any): any {
    const sensitiveKeys = [
      "password",
      "token",
      "apiKey",
      "secret",
      "credential",
      "auth",
    ];
    const redacted = { ...params };

    for (const key of Object.keys(redacted)) {
      if (
        sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))
      ) {
        redacted[key] = "[REDACTED]";
      } else if (typeof redacted[key] === "object" && redacted[key] !== null) {
        redacted[key] = this.redactSensitiveData(redacted[key]);
      }
    }

    return redacted;
  }

  // Generate execution summary
  private async generateExecutionSummary(
    steps: StepResult[],
    metrics: ExecutionMetrics
  ): Promise<string> {
    const successCount = steps.filter((s) => s.status === "completed").length;
    const failCount = steps.filter((s) => s.status === "failed").length;

    let summary = `Executed ${steps.length} steps in ${Math.round(metrics.totalDuration / 1000)}s. `;
    summary += `${successCount} succeeded, ${failCount} failed`;

    if (metrics.retries > 0) {
      summary += ` (${metrics.retries} retries)`;
    }

    summary += ". ";

    // Add key outcomes
    const keyOutcomes = steps
      .filter((s) => s.status === "completed" && s.output)
      .slice(0, 3)
      .map((s) => {
        if (s.output?.title) return s.output.title;
        if (s.output?.name) return s.output.name;
        if (s.output?.id) return `Created ${s.tool.replace("_", " ")}`;
        return `Completed ${s.tool.replace("_", " ")}`;
      });

    if (keyOutcomes.length > 0) {
      summary += "Key outcomes: " + keyOutcomes.join(", ") + ".";
    }

    return summary;
  }

  // Update session state
  private async updateSessionState(state: AgentState, error?: string) {
    this.session.state = state;
    if (error) {
      this.session.error = error;
    }
    await this.saveSession();
  }

  // Save session to database
  private async saveSession() {
    await prisma.agentSession.update({
      where: { id: this.session.id },
      data: {
        state: this.session.state,
        plan: this.session.plan as any,
        result: this.session.result as any,
        error: this.session.error,
        updatedAt: new Date(),
      },
    });
  }

  // Abort execution
  abort() {
    this.abortController.abort();
  }

  // Static method to create a new session
  static async createSession(
    userId: string,
    projectId?: string,
    context?: Partial<AgentContext>
  ): Promise<AgentSession> {
    const { randomUUID } = require("crypto");
    const session = await prisma.agentSession.create({
      data: {
        id: randomUUID(),
        userId,
        projectId,
        state: "idle",
        updatedAt: new Date(),
      },
    });

    return {
      id: session.id,
      userId: session.userId,
      projectId: session.projectId || undefined,
      state: session.state as AgentState,
      context: (context as AgentContext) || {},
      startedAt: session.createdAt,
    };
  }

  // Static method to load a session
  static async loadSession(sessionId: string): Promise<AgentSession | null> {
    const session = await prisma.agentSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) return null;

    // Manually load user
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) return null;

    // Manually load project if exists
    let project = undefined;
    if (session.projectId) {
      const projectData = await prisma.project.findUnique({
        where: { id: session.projectId },
      });
      if (projectData) {
        project = {
          id: projectData.id,
          title: projectData.title,
        };
      }
    }

    // Load user's integration credentials
    const integrations = await prisma.integrationCredential.findMany({
      where: { userId: session.userId },
    });

    const context: AgentContext = {
      user: {
        id: user.id,
        name: user.name || "Unknown",
        email: user.email || "",
        role: user.role || "user",
      },
      project,
      integrations: {
        slack: integrations.some((i) => i.type === "slack"),
        googleDrive: integrations.some((i) => i.type === "google-drive"),
      },
      permissions: [],
      traceId: `session_${sessionId}`,
      variables: {},
    };

    return {
      id: session.id,
      userId: session.userId,
      projectId: session.projectId || undefined,
      state: session.state as AgentState,
      plan: session.plan as any as AgentPlan | undefined,
      result: session.result as any as AgentResult | undefined,
      context,
      startedAt: session.createdAt,
      error: session.error || undefined,
    };
  }
}
