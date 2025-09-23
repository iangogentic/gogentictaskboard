import { AgentPlan, PlanStep, AgentContext } from "./types";
import { toolRegistry } from "./tool-registry";
import { agentMemory } from "./memory";
import { embeddingService } from "@/lib/embeddings";
import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class AgentPlanner {
  private context: AgentContext;

  constructor(context: AgentContext) {
    this.context = context;
  }

  // Generate a plan based on user request
  async generatePlan(request: string): Promise<AgentPlan> {
    try {
      // Get available tools from registry
      const tools = toolRegistry.getAllTools();
      const toolDescriptions = tools
        .map(
          (tool: any) => `- **${tool.name}** (exact name): ${tool.description}`
        )
        .join("\n");

      // Retrieve relevant memory/context
      const memory = await agentMemory.retrieveMemory(
        request,
        this.context.project?.id,
        this.context.user.id
      );
      const memoryContext = agentMemory.buildContextString(memory);

      // PHASE 5: Fetch RAG context for better planning
      let ragContext = "";
      if (this.context.project?.id) {
        try {
          ragContext = await embeddingService.getContextForQuery(
            request,
            this.context.project.id,
            2000 // Max tokens for context
          );
        } catch (error) {
          console.error("Failed to fetch RAG context:", error);
          // Continue without RAG context if it fails
        }
      }

      // Generate plan using AI
      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `You are an AI agent planner for a project management system.
            Create a step-by-step plan to fulfill the user's request.

            IMPORTANT: You MUST only use tools from this exact list. Do NOT invent or hallucinate tool names.
            Available tools:
            ${toolDescriptions}

            Context:
            - User: ${this.context.user.name} (${this.context.user.role})
            ${this.context.project ? `- Project: ${this.context.project.title}` : ""}
            - Integrations: Slack=${this.context.integrations.slack}, Drive=${this.context.integrations.googleDrive}

            ${memoryContext ? `Relevant Information from Memory:\n${memoryContext}\n` : ""}

            ${ragContext ? `Relevant Project Documents:\n${ragContext}\n` : ""}

            Return a JSON object with:
            {
              "title": "Brief title of the plan",
              "description": "Detailed description of what will be done",
              "steps": [
                {
                  "title": "Step title",
                  "description": "What this step does",
                  "tool": "EXACT_TOOL_NAME_FROM_AVAILABLE_LIST",
                  "parameters": { ... },
                  "order": 1
                }
              ],
              "estimatedDuration": estimated minutes,
              "risks": ["potential risks"],
              "dependencies": ["required conditions"]
            }

            CRITICAL: Each step's "tool" field MUST be an EXACT tool name from the "Available tools" list above.
            Example actual tool names: search, create_project, create_task, update_task, list_tasks,
            sendSlackMessage, createDriveFolder, createWorkflow, listWorkflows, etc.
            Do NOT use made-up names like: user_input, ask_user, confirm, drive_create_folder, slack_send_dm.
            The tool name MUST exactly match one from the list above!`,
          },
          {
            role: "user",
            content: request,
          },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
        max_tokens: 2000,
      });

      const planData = JSON.parse(
        response.choices[0]?.message?.content || "{}"
      );

      // Only log in debug mode
      if (
        process.env.AGENT_DEBUG === "true" ||
        process.env.NODE_ENV === "development"
      ) {
        console.log(
          "Raw plan data from GPT:",
          JSON.stringify(planData, null, 2)
        );
      }

      // Check if we have steps at all
      if (
        !planData.steps ||
        !Array.isArray(planData.steps) ||
        planData.steps.length === 0
      ) {
        console.error("GPT returned plan without steps:", planData);
        // Return a simple fallback plan
        return this.createSimplePlan(request);
      }

      // Validate and fix tool names
      const validatedSteps = (planData.steps || []).map(
        (s: any, index: number) => {
          let toolName = s.tool;

          // Check if tool exists
          const tools = toolRegistry.getAllTools();
          const toolExists = tools.find((tool: any) => tool.name === toolName);

          if (!toolExists) {
            console.warn(
              `Invalid tool '${toolName}' in plan. Attempting to fix...`
            );

            // Try to map common mistakes to actual tools
            if (
              toolName === "user_input" ||
              toolName === "ask_user" ||
              toolName === "confirm"
            ) {
              // These are not real tools - the plan should use actual action tools
              // Default to search tool as a safe fallback
              toolName = "search";
              // Ensure search has basic parameters
              if (!s.parameters || Object.keys(s.parameters).length === 0) {
                s.parameters = { query: request.slice(0, 100) };
              }
            } else if (
              toolName?.includes("create") &&
              toolName?.includes("project")
            ) {
              toolName = "createProject";
            } else if (
              toolName?.includes("create") &&
              toolName?.includes("task")
            ) {
              toolName = "createTask";
            } else if (
              toolName?.includes("update") &&
              toolName?.includes("task")
            ) {
              toolName = "updateTask";
            } else if (
              toolName === "slack_send_dm" ||
              toolName === "send_slack_message"
            ) {
              toolName = "sendSlackMessage";
            } else if (
              toolName === "drive_create_folder" ||
              toolName === "create_drive_folder"
            ) {
              toolName = "createDriveFolder";
            } else if (toolName === "get_users" || toolName === "list_users") {
              toolName = "get_users"; // This one is correct
            } else if (
              toolName?.includes("workflow") &&
              toolName?.includes("create")
            ) {
              toolName = "createWorkflow";
            } else if (
              toolName?.includes("search") ||
              toolName?.includes("get")
            ) {
              toolName = "search";
              // Ensure search has basic parameters
              if (!s.parameters || Object.keys(s.parameters).length === 0) {
                s.parameters = { query: request.slice(0, 100) };
              }
            } else {
              // Final fallback to search
              toolName = "search";
              if (!s.parameters || Object.keys(s.parameters).length === 0) {
                s.parameters = { query: request.slice(0, 100) };
              }
            }

            console.log(`Replaced invalid tool with '${toolName}'`);
          }

          return {
            id: uuidv4(),
            order: s.order || index + 1,
            title: s.title || `Step ${index + 1}`,
            description: s.description || "",
            tool: toolName,
            parameters: s.parameters || {},
            status: "pending" as const,
          };
        }
      );

      // Create plan object
      const plan: AgentPlan = {
        id: uuidv4(),
        title: planData.title || "Untitled Plan",
        description: planData.description || request,
        steps: validatedSteps,
        estimatedDuration: planData.estimatedDuration,
        risks: planData.risks || [],
        dependencies: planData.dependencies || [],
        createdAt: new Date(),
      };

      return plan;
    } catch (error: any) {
      console.error("Failed to generate plan:", error);

      // Fallback to simple plan
      return this.createSimplePlan(request);
    }
  }

  // Create a simple fallback plan
  private createSimplePlan(request: string): AgentPlan {
    const plan: AgentPlan = {
      id: uuidv4(),
      title: "Simple Execution Plan",
      description: request,
      steps: [
        {
          id: uuidv4(),
          order: 1,
          title: "Search for relevant information",
          description: "Search the system for relevant data",
          tool: "search",
          parameters: { query: request.slice(0, 100) },
          status: "pending",
        },
      ],
      estimatedDuration: 5,
      risks: ["Limited to basic search functionality"],
      dependencies: [],
      createdAt: new Date(),
    };

    return plan;
  }

  // Analyze a request to determine required tools
  async analyzeRequest(request: string): Promise<{
    intent: string;
    requiredTools: string[];
    suggestedParameters: Record<string, any>;
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `Analyze the user request and determine:
            1. The main intent
            2. Which tools would be needed
            3. Suggested parameters for those tools
            
            Return JSON with: { "intent": "...", "requiredTools": [...], "suggestedParameters": {...} }`,
          },
          {
            role: "user",
            content: request,
          },
        ],
        temperature: 0.5,
        response_format: { type: "json_object" },
        max_tokens: 500,
      });

      return JSON.parse(response.choices[0]?.message?.content || "{}");
    } catch (error) {
      return {
        intent: "general",
        requiredTools: ["search"],
        suggestedParameters: {},
      };
    }
  }

  // Optimize a plan by reordering steps or removing unnecessary ones
  async optimizePlan(plan: AgentPlan): Promise<AgentPlan> {
    // Sort steps by dependencies
    const optimizedSteps = [...plan.steps].sort((a, b) => {
      // Prioritize search and analysis tools first
      if (a.tool.includes("search") || a.tool.includes("analyze")) return -1;
      if (b.tool.includes("search") || b.tool.includes("analyze")) return 1;

      // Then creation tools
      if (a.tool.includes("create")) return -1;
      if (b.tool.includes("create")) return 1;

      // Then updates
      if (a.tool.includes("update")) return -1;
      if (b.tool.includes("update")) return 1;

      // Finally integrations
      return a.order - b.order;
    });

    // Update order numbers
    optimizedSteps.forEach((step, index) => {
      step.order = index + 1;
    });

    return {
      ...plan,
      steps: optimizedSteps,
    };
  }

  // Validate a plan to ensure it's executable
  validatePlan(plan: AgentPlan): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if plan has steps
    if (!plan.steps || plan.steps.length === 0) {
      errors.push("Plan has no steps");
    }

    // Fix and validate each step
    plan.steps.forEach((step, index) => {
      // Auto-fix invalid tool names (for plans stored before the fix)
      if (step.tool === "get_projects" || step.tool === "rag_search") {
        console.log(`Auto-fixing invalid tool name: ${step.tool} -> search`);
        step.tool = "search";
        if (!step.parameters || Object.keys(step.parameters).length === 0) {
          step.parameters = { query: "projects" };
        }
      }

      // Check tool exists
      const tools = toolRegistry.getAllTools();
      if (!tools.find((tool: any) => tool.name === step.tool)) {
        errors.push(`Step ${index + 1}: Unknown tool '${step.tool}'`);
      }

      // Only check required parameters for tools that actually need them
      // Most tools have defaults or can work without parameters
      const toolsThatNeedParams = [
        "create_project",
        "create_task",
        "update_task",
      ];
      if (toolsThatNeedParams.includes(step.tool)) {
        if (!step.parameters || Object.keys(step.parameters).length === 0) {
          errors.push(
            `Step ${index + 1}: Missing required parameters for tool '${step.tool}'`
          );
        }
      }
    });

    // Check integrations if needed
    // Commented out for now - let the tools handle their own validation
    // const needsSlack = plan.steps.some((s) => s.tool.includes("slack"));
    // const needsDrive = plan.steps.some((s) => s.tool.includes("drive"));

    // if (needsSlack && !this.context.integrations.slack) {
    //   errors.push("Plan requires Slack integration but it's not connected");
    // }

    // if (needsDrive && !this.context.integrations.googleDrive) {
    //   errors.push(
    //     "Plan requires Google Drive integration but it's not connected"
    //   );
    // }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
