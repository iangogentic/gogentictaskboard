import axios, { AxiosInstance } from "axios";
import { env } from "./config";
import { OAuthManager } from "./oauthManager";
import { StoredSession } from "./tokenStore";

export class AgentApiClient {
  private readonly oauthManager: OAuthManager;
  private axiosInstance: AxiosInstance;
  private currentSession: StoredSession | null = null;

  constructor(oauthManager: OAuthManager) {
    this.oauthManager = oauthManager;
    this.axiosInstance = axios.create({
      baseURL: env.baseUrl,
    });
  }

  private async getSession(): Promise<StoredSession> {
    const session =
      this.currentSession ?? (await this.oauthManager.ensureSession());
    this.currentSession = session;
    return session;
  }

  async ensureConnected(): Promise<StoredSession> {
    const session = await this.oauthManager.ensureSession();
    this.currentSession = session;
    return session;
  }

  disconnect() {
    this.oauthManager.disconnect();
    this.currentSession = null;
  }

  private async request<T>(config: {
    method: "get" | "post" | "put" | "patch" | "delete";
    url: string;
    data?: any;
    params?: Record<string, any>;
  }): Promise<T> {
    const session = await this.getSession();
    const response = await this.axiosInstance.request<T>({
      method: config.method,
      url: config.url,
      data: config.data,
      params: config.params,
      headers: {
        Authorization: `Bearer ${session.mcpToken}`,
      },
    });
    return response.data;
  }

  async createAgentSession(projectId?: string) {
    return this.request<{ session: any }>({
      method: "post",
      url: "/api/agent/sessions",
      data: { projectId },
    });
  }

  async listAgentSessions(limit = 10) {
    return this.request<{ sessions: any[] }>({
      method: "get",
      url: "/api/agent/sessions",
      params: { limit },
    });
  }

  async generatePlan(sessionId: string, requestText: string) {
    return this.request<{ plan: any }>({
      method: "post",
      url: "/api/agent/plan",
      data: { sessionId, request: requestText },
    });
  }

  async approvePlan(sessionId: string, planId: string) {
    return this.request<{ success: boolean; plan: any }>({
      method: "post",
      url: "/api/agent/approve",
      data: { sessionId, planId, approved: true },
    });
  }

  async executePlan(sessionId: string) {
    return this.request<{ result: any }>({
      method: "post",
      url: "/api/agent/execute",
      data: { sessionId },
    });
  }

  async dryRunPlan(sessionId: string, planId: string) {
    return this.request<{ dryRunResults: any[] }>({
      method: "put",
      url: "/api/agent/approve",
      data: { sessionId, planId },
    });
  }

  async listProjects() {
    return this.request<any[]>({ method: "get", url: "/api/projects" });
  }

  async searchKnowledge(
    query: string,
    projectId?: string,
    limit?: number,
    threshold?: number
  ) {
    return this.request<{ results: any[] }>({
      method: "post",
      url: "/api/rag/search",
      data: { query, projectId, limit, threshold },
    });
  }
}
