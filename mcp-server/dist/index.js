import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { OAuthManager } from "./oauthManager";
import { AgentApiClient } from "./agentApiClient";
import { TokenStore } from "./tokenStore";
const oauthManager = new OAuthManager();
const apiClient = new AgentApiClient(oauthManager);
const tokenStore = new TokenStore();
const server = new McpServer({
    name: "gogentic-agent",
    version: "0.1.0",
});
server.registerTool("connect_google", {
    title: "Connect Google Account",
    description: "Authenticate with Google to link your Gogentic account",
}, async () => {
    const session = await apiClient.ensureConnected();
    return {
        content: [
            {
                type: "text",
                text: `Connected as ${session.user.email}\nToken expires at ${session.tokenExpiresAt}`,
            },
        ],
    };
});
server.registerTool("disconnect", {
    title: "Disconnect Google Account",
    description: "Remove stored credentials from the MCP server",
}, async () => {
    tokenStore.clear();
    oauthManager.disconnect();
    return {
        content: [{ type: "text", text: "Disconnected" }],
    };
});
server.registerTool("create_agent_session", {
    title: "Create Agent Session",
    description: "Create a new Gogentic agent session",
    inputSchema: {
        projectId: z.string().optional(),
    },
}, async ({ projectId }) => {
    const { session } = await apiClient.createAgentSession(projectId);
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(session, null, 2),
            },
        ],
    };
});
server.registerTool("list_agent_sessions", {
    title: "List Agent Sessions",
    description: "List recent agent sessions for the current user",
    inputSchema: {
        limit: z.number().int().min(1).max(50).optional(),
    },
}, async ({ limit }) => {
    const { sessions } = await apiClient.listAgentSessions(limit ?? 10);
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(sessions, null, 2),
            },
        ],
    };
});
server.registerTool("generate_plan", {
    title: "Generate Plan",
    description: "Generate a plan for a request in an existing session",
    inputSchema: {
        sessionId: z.string(),
        request: z.string(),
    },
}, async ({ sessionId, request }) => {
    const { plan } = await apiClient.generatePlan(sessionId, request);
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(plan, null, 2),
            },
        ],
    };
});
server.registerTool("approve_and_execute_plan", {
    title: "Approve and Execute Plan",
    description: "Approve a plan and run it",
    inputSchema: {
        sessionId: z.string(),
        planId: z.string(),
    },
}, async ({ sessionId, planId }) => {
    await apiClient.approvePlan(sessionId, planId);
    const { result } = await apiClient.executePlan(sessionId);
    return {
        content: [
            {
                type: "text",
                text: result.summary ?? JSON.stringify(result, null, 2),
            },
        ],
    };
});
server.registerTool("dry_run_plan", {
    title: "Dry Run Plan",
    description: "Preview plan execution without mutations",
    inputSchema: {
        sessionId: z.string(),
        planId: z.string(),
    },
}, async ({ sessionId, planId }) => {
    const { dryRunResults } = await apiClient.dryRunPlan(sessionId, planId);
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(dryRunResults, null, 2),
            },
        ],
    };
});
server.registerTool("search_documents", {
    title: "Search Knowledge Base",
    description: "Semantic search across project documents",
    inputSchema: {
        query: z.string(),
        projectId: z.string().optional(),
        limit: z.number().int().min(1).max(20).optional(),
        threshold: z.number().min(0).max(1).optional(),
    },
}, async ({ query, projectId, limit, threshold }) => {
    const { results } = await apiClient.searchKnowledge(query, projectId, limit, threshold);
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(results, null, 2),
            },
        ],
    };
});
server.registerResource("projects", "gogentic://projects", {
    title: "Gogentic Projects",
    description: "List of projects accessible to the current user",
    mimeType: "application/json",
}, async () => {
    const projects = await apiClient.listProjects();
    return {
        contents: [
            {
                uri: "gogentic://projects",
                text: JSON.stringify(projects, null, 2),
            },
        ],
    };
});
server.registerResource("project", new ResourceTemplate("gogentic://projects/{projectId}", {
    list: async () => {
        const projects = await apiClient.listProjects();
        return {
            resources: projects.map((p) => ({
                uri: `gogentic://projects/${p.id}`,
                name: p.title,
                description: p.status ? `Status: ${p.status}` : undefined,
            })),
        };
    },
}), {
    title: "Gogentic Project",
    description: "Detailed project data",
    mimeType: "application/json",
}, async (uri, { projectId }) => {
    const projects = await apiClient.listProjects();
    const project = projects.find((p) => p.id === projectId);
    if (!project) {
        return {
            contents: [
                {
                    uri: uri.href,
                    text: JSON.stringify({ error: "Project not found" }),
                },
            ],
        };
    }
    return {
        contents: [
            {
                uri: uri.href,
                text: JSON.stringify(project, null, 2),
            },
        ],
    };
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("GoGentic MCP server connected and ready.");
}
main().catch((error) => {
    console.error("Failed to start MCP server", error);
    process.exit(1);
});
