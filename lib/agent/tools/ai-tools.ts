import { AgentTool, ToolResult } from "../types";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const analyzeTool: AgentTool = {
  name: "analyze",
  description:
    "Analyze content using AI to extract insights, patterns, or summaries",
  parameters: {
    content: { type: "string", required: true },
    analysisType: {
      type: "string",
      required: false,
      enum: ["sentiment", "summary", "key_points", "risks", "opportunities"],
      default: "summary",
    },
    context: { type: "string", required: false },
  },
  execute: async (params: any): Promise<ToolResult> => {
    try {
      const prompts: Record<string, string> = {
        sentiment:
          "Analyze the sentiment of the following content and provide a brief assessment:",
        summary: "Provide a concise summary of the following content:",
        key_points:
          "Extract the key points from the following content as a bulleted list:",
        risks: "Identify potential risks or concerns in the following content:",
        opportunities:
          "Identify opportunities or positive aspects in the following content:",
      };

      const systemPrompt = params.context
        ? `You are analyzing content in the context of: ${params.context}`
        : "You are a helpful assistant analyzing content for a project management system.";

      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `${prompts[params.analysisType || "summary"]}\n\n${params.content}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const analysis =
        response.choices[0]?.message?.content || "No analysis generated";

      return {
        success: true,
        data: {
          analysis,
          type: params.analysisType || "summary",
        },
        metadata: {
          model: "gpt-4-turbo-preview",
          tokens: response.usage?.total_tokens,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

export const summarizeTool: AgentTool = {
  name: "summarize",
  description: "Generate a summary of project data, tasks, or updates",
  parameters: {
    data: { type: "object", required: true },
    format: {
      type: "string",
      required: false,
      enum: ["brief", "detailed", "executive", "technical"],
      default: "brief",
    },
    focusAreas: { type: "array", required: false },
  },
  execute: async (params: any): Promise<ToolResult> => {
    try {
      const formatInstructions: Record<string, string> = {
        brief: "Provide a brief 2-3 sentence summary",
        detailed: "Provide a detailed summary with all important information",
        executive: "Provide an executive summary suitable for stakeholders",
        technical: "Provide a technical summary with implementation details",
      };

      const focusInstruction = params.focusAreas?.length
        ? `Focus particularly on: ${params.focusAreas.join(", ")}`
        : "";

      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content:
              "You are a project management assistant creating summaries for team members.",
          },
          {
            role: "user",
            content: `${formatInstructions[params.format || "brief"]} of the following data. ${focusInstruction}\n\nData: ${JSON.stringify(params.data, null, 2)}`,
          },
        ],
        temperature: 0.5,
        max_tokens: 800,
      });

      const summary =
        response.choices[0]?.message?.content || "No summary generated";

      return {
        success: true,
        data: {
          summary,
          format: params.format || "brief",
        },
        metadata: {
          model: "gpt-4-turbo-preview",
          tokens: response.usage?.total_tokens,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

export const generateTool: AgentTool = {
  name: "generate",
  description:
    "Generate content such as task descriptions, update drafts, or documentation",
  parameters: {
    type: {
      type: "string",
      required: true,
      enum: [
        "task_description",
        "update_draft",
        "documentation",
        "email",
        "meeting_notes",
      ],
    },
    context: { type: "object", required: true },
    tone: {
      type: "string",
      required: false,
      enum: ["formal", "casual", "technical", "executive"],
      default: "formal",
    },
    length: {
      type: "string",
      required: false,
      enum: ["short", "medium", "long"],
      default: "medium",
    },
  },
  execute: async (params: any): Promise<ToolResult> => {
    try {
      const typePrompts: Record<string, string> = {
        task_description: "Generate a clear task description",
        update_draft: "Draft a project update",
        documentation: "Create documentation",
        email: "Draft an email",
        meeting_notes: "Generate meeting notes",
      };

      const lengthTokens: Record<string, number> = {
        short: 150,
        medium: 300,
        long: 600,
      };

      const toneInstructions: Record<string, string> = {
        formal: "Use a formal, professional tone",
        casual: "Use a casual, friendly tone",
        technical: "Use technical language and be precise",
        executive:
          "Use executive-level language, focusing on impact and outcomes",
      };

      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `You are a project management assistant. ${toneInstructions[params.tone || "formal"]}.`,
          },
          {
            role: "user",
            content: `${typePrompts[params.type]} based on the following context:\n\n${JSON.stringify(params.context, null, 2)}`,
          },
        ],
        temperature: 0.8,
        max_tokens: lengthTokens[params.length || "medium"],
      });

      const generated =
        response.choices[0]?.message?.content || "No content generated";

      return {
        success: true,
        data: {
          content: generated,
          type: params.type,
          tone: params.tone || "formal",
        },
        metadata: {
          model: "gpt-4-turbo-preview",
          tokens: response.usage?.total_tokens,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};
