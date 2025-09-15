import { AgentPlan, PlanStep, AgentContext } from "./types";
import { getAllTools } from "./tools";
import { agentMemory } from "./memory";
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
      // Get available tools
      const tools = getAllTools();
      const toolDescriptions = tools
        .map((t) => `- ${t.name}: ${t.description}`)
        .join("\n");

      // Retrieve relevant memory/context
      const memory = await agentMemory.retrieveMemory(
        request,
        this.context.project?.id,
        this.context.user.id
      );
      const memoryContext = agentMemory.buildContextString(memory);

      // Generate plan using AI
      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `You are an AI agent planner for a project management system. 
            Create a step-by-step plan to fulfill the user's request.
            
            Available tools:
            ${toolDescriptions}
            
            Context:
            - User: ${this.context.user.name} (${this.context.user.role})
            ${this.context.project ? `- Project: ${this.context.project.title}` : ""}
            - Integrations: Slack=${this.context.integrations.slack}, Drive=${this.context.integrations.googleDrive}
            
            ${memoryContext ? `Relevant Information from Memory:\n${memoryContext}\n` : ""}
            
            Return a JSON object with:
            {
              "title": "Brief title of the plan",
              "description": "Detailed description of what will be done",
              "steps": [
                {
                  "title": "Step title",
                  "description": "What this step does",
                  "tool": "tool_name",
                  "parameters": { ... },
                  "order": 1
                }
              ],
              "estimatedDuration": estimated minutes,
              "risks": ["potential risks"],
              "dependencies": ["required conditions"]
            }`,
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

      // Create plan object
      const plan: AgentPlan = {
        id: uuidv4(),
        title: planData.title || "Untitled Plan",
        description: planData.description || request,
        steps: (planData.steps || []).map((s: any, index: number) => ({
          id: uuidv4(),
          order: s.order || index + 1,
          title: s.title || `Step ${index + 1}`,
          description: s.description || "",
          tool: s.tool || "search",
          parameters: s.parameters || {},
          status: "pending" as const,
        })),
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
          parameters: { query: request.slice(0, 50) },
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

    // Validate each step
    plan.steps.forEach((step, index) => {
      // Check tool exists
      const tools = getAllTools();
      if (!tools.find((t) => t.name === step.tool)) {
        errors.push(`Step ${index + 1}: Unknown tool '${step.tool}'`);
      }

      // Check required parameters
      if (!step.parameters || Object.keys(step.parameters).length === 0) {
        if (step.tool !== "search") {
          // Search can work with minimal params
          errors.push(
            `Step ${index + 1}: Missing parameters for tool '${step.tool}'`
          );
        }
      }
    });

    // Check integrations if needed
    const needsSlack = plan.steps.some((s) => s.tool.includes("slack"));
    const needsDrive = plan.steps.some((s) => s.tool.includes("drive"));

    if (needsSlack && !this.context.integrations.slack) {
      errors.push("Plan requires Slack integration but it's not connected");
    }

    if (needsDrive && !this.context.integrations.googleDrive) {
      errors.push(
        "Plan requires Google Drive integration but it's not connected"
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
