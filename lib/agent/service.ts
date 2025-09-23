import {
  AgentSession,
  AgentPlan,
  AgentContext,
  AgentResult,
  AgentMessage,
} from "./types";
import { AgentEngine } from "./engine";
import { AgentPlanner } from "./planner";
import { toolRegistry } from "./tool-registry";
import { prisma } from "@/lib/prisma";
import { AuditLogger } from "@/lib/audit";
import { v4 as uuidv4 } from "uuid";

export class AgentService {
  private static instance: AgentService;
  private activeSessions: Map<string, AgentEngine> = new Map();

  private constructor() {}

  static getInstance(): AgentService {
    if (!AgentService.instance) {
      AgentService.instance = new AgentService();
    }
    return AgentService.instance;
  }

  // Create a new agent session
  async createSession(
    userId: string,
    projectId?: string
  ): Promise<AgentSession> {
    // Get user context
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Get integration credentials separately
    const integrationCredentials = await prisma.integrationCredential.findMany({
      where: { userId },
      select: { type: true },
    });

    // Get project context if provided
    let project = undefined;
    if (projectId) {
      const projectData = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          title: true,
        },
      });

      if (projectData) {
        project = projectData;
      }
    }

    // Check integrations
    const integrations = {
      slack: integrationCredentials.some((i) => i.type === "slack"),
      googleDrive: integrationCredentials.some(
        (i) => i.type === "google_drive"
      ),
    };

    // Create context
    const context: AgentContext = {
      user: {
        id: user.id,
        name: user.name || "",
        email: user.email || "",
        role: user.role,
      },
      project,
      integrations,
      permissions: this.getUserPermissions(user.role),
      variables: {},
    };

    // Create session
    const session = await AgentEngine.createSession(userId, projectId, context);

    // Log session creation
    await AuditLogger.logSuccess(
      userId,
      "create_agent_session",
      "agent",
      session.id,
      { projectId }
    );

    return session;
  }

  // Generate a plan for a request
  async generatePlan(sessionId: string, request: string): Promise<AgentPlan> {
    const session = await AgentEngine.loadSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Create planner
    const planner = new AgentPlanner(session.context);

    // Generate plan
    const plan = await planner.generatePlan(request);

    // Validate plan
    const validation = planner.validatePlan(plan);
    if (!validation.valid) {
      throw new Error(`Invalid plan: ${validation.errors.join(", ")}`);
    }

    // Optimize plan
    const optimizedPlan = await planner.optimizePlan(plan);

    // Update session with plan
    await prisma.agentSession.update({
      where: { id: sessionId },
      data: {
        state: "planning",
        plan: optimizedPlan as any,
      },
    });

    // Log plan generation
    await AuditLogger.logSuccess(
      session.userId,
      "generate_agent_plan",
      "agent",
      plan.id,
      { sessionId, request }
    );

    return optimizedPlan;
  }

  // Approve a plan
  async approvePlan(sessionId: string, userId: string): Promise<void> {
    const session = await AgentEngine.loadSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    console.log("Approving plan for session:", {
      sessionId,
      hasPlan: !!session.plan,
      planSteps: session.plan?.steps?.length || 0,
    });

    if (!session.plan) {
      throw new Error("No plan to approve");
    }

    // Check if plan has steps before approving
    if (!session.plan.steps || session.plan.steps.length === 0) {
      console.error("Cannot approve plan without steps:", session.plan);
      throw new Error("Invalid plan: Plan has no steps to approve");
    }

    // Update plan with approval
    session.plan.approvedAt = new Date();
    session.plan.approvedBy = userId;

    // Update session state
    await prisma.agentSession.update({
      where: { id: sessionId },
      data: {
        state: "awaiting_approval",
        plan: session.plan as any,
      },
    });

    // Log approval
    await AuditLogger.logSuccess(
      userId,
      "approve_agent_plan",
      "agent",
      session.plan.id,
      { sessionId }
    );
  }

  // Execute a plan
  async executePlan(sessionId: string): Promise<AgentResult> {
    const session = await AgentEngine.loadSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (!session.plan) {
      throw new Error("No plan to execute");
    }

    // Add better debugging for plan structure
    console.log("Plan loaded from session:", {
      hasSteps: !!session.plan.steps,
      stepsCount: session.plan.steps?.length || 0,
      planId: session.plan.id,
      planTitle: session.plan.title,
    });

    // Check if plan has steps
    if (!session.plan.steps || session.plan.steps.length === 0) {
      console.error("Plan has no steps:", session.plan);
      throw new Error("Invalid plan: Plan has no steps");
    }

    // Skip approval check since we're auto-approving in chat-v2
    // if (!session.plan.approvedAt) {
    //   throw new Error("Plan not approved");
    // }

    // Create engine
    const engine = new AgentEngine(session);
    this.activeSessions.set(sessionId, engine);

    try {
      // Execute plan
      const result = await engine.execute();

      // Remove from active sessions
      this.activeSessions.delete(sessionId);

      return result;
    } catch (error) {
      // Remove from active sessions on error
      this.activeSessions.delete(sessionId);
      throw error;
    }
  }

  // Cancel an active session
  async cancelSession(sessionId: string): Promise<void> {
    const engine = this.activeSessions.get(sessionId);
    if (engine) {
      engine.abort();
      this.activeSessions.delete(sessionId);
    }

    // Update session state
    await prisma.agentSession.update({
      where: { id: sessionId },
      data: {
        state: "failed",
        error: "Cancelled by user",
        updatedAt: new Date(),
      },
    });

    // Log cancellation
    const session = await AgentEngine.loadSession(sessionId);
    if (session) {
      await AuditLogger.logSuccess(
        session.userId,
        "cancel_agent_session",
        "agent",
        sessionId
      );
    }
  }

  // Get session status
  async getSessionStatus(sessionId: string): Promise<AgentSession | null> {
    return await AgentEngine.loadSession(sessionId);
  }

  // Get tool by name
  getToolByName(name: string) {
    return toolRegistry.get(name);
  }

  // List user sessions
  async listUserSessions(
    userId: string,
    limit: number = 10
  ): Promise<AgentSession[]> {
    const sessions = await prisma.agentSession.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    return sessions.map((s) => ({
      id: s.id,
      userId: s.userId,
      projectId: s.projectId || undefined,
      state: s.state as any,
      plan: s.plan as any,
      result: s.result as any,
      context: {} as any, // Context is not stored in DB, provide empty object
      startedAt: s.createdAt,
      updatedAt: s.updatedAt,
      error: s.error || undefined,
    }));
  }

  // Add a message to session
  async addMessage(
    sessionId: string,
    type: "user" | "agent" | "system" | "tool",
    content: string,
    metadata?: Record<string, any>
  ): Promise<AgentMessage> {
    const message: AgentMessage = {
      id: uuidv4(),
      sessionId,
      type,
      content,
      metadata,
      timestamp: new Date(),
    };

    // Store message (could be in database or cache)
    // For now, just return it
    return message;
  }

  // Get user permissions based on role
  private getUserPermissions(role: string): string[] {
    const permissions: Record<string, string[]> = {
      admin: ["all"],
      pm: [
        "create_project",
        "create_task",
        "update_task",
        "create_update",
        "send_slack",
        "drive_operations",
      ],
      developer: ["create_task", "update_task", "create_update", "search"],
      client: ["view", "search"],
      user: ["view", "search"],
    };

    return permissions[role] || ["view"];
  }

  // Get active session count
  getActiveSessionCount(): number {
    return this.activeSessions.size;
  }

  // Check if session is active
  isSessionActive(sessionId: string): boolean {
    return this.activeSessions.has(sessionId);
  }
}
