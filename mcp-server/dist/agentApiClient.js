import axios from "axios";
import { env } from "./config";
export class AgentApiClient {
    constructor(oauthManager) {
        this.currentSession = null;
        this.oauthManager = oauthManager;
        this.axiosInstance = axios.create({
            baseURL: env.baseUrl,
        });
    }
    async getSession() {
        const session = this.currentSession ?? (await this.oauthManager.ensureSession());
        this.currentSession = session;
        return session;
    }
    async ensureConnected() {
        const session = await this.oauthManager.ensureSession();
        this.currentSession = session;
        return session;
    }
    disconnect() {
        this.oauthManager.disconnect();
        this.currentSession = null;
    }
    async request(config) {
        const session = await this.getSession();
        const response = await this.axiosInstance.request({
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
    async createAgentSession(projectId) {
        return this.request({
            method: "post",
            url: "/api/agent/sessions",
            data: { projectId },
        });
    }
    async listAgentSessions(limit = 10) {
        return this.request({
            method: "get",
            url: "/api/agent/sessions",
            params: { limit },
        });
    }
    async generatePlan(sessionId, requestText) {
        return this.request({
            method: "post",
            url: "/api/agent/plan",
            data: { sessionId, request: requestText },
        });
    }
    async approvePlan(sessionId, planId) {
        return this.request({
            method: "post",
            url: "/api/agent/approve",
            data: { sessionId, planId, approved: true },
        });
    }
    async executePlan(sessionId) {
        return this.request({
            method: "post",
            url: "/api/agent/execute",
            data: { sessionId },
        });
    }
    async dryRunPlan(sessionId, planId) {
        return this.request({
            method: "put",
            url: "/api/agent/approve",
            data: { sessionId, planId },
        });
    }
    async listProjects() {
        return this.request({ method: "get", url: "/api/projects" });
    }
    async searchKnowledge(query, projectId, limit, threshold) {
        return this.request({
            method: "post",
            url: "/api/rag/search",
            data: { query, projectId, limit, threshold },
        });
    }
}
