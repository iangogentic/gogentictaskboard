import OpenAI from "openai";
import { AgentContext } from "./types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface IntentAnalysis {
  confidence: number; // 0-1 score of how confident we are about the intent
  needsClarification: boolean;
  clarifyingQuestions?: string[];
  suggestedIntent?: string;
  extractedEntities?: Record<string, any>;
  conversationPhase: "clarifying" | "proposing" | "ready";
  suggestedTools?: string[];
}

export interface ConversationState {
  phase: "clarifying" | "proposing" | "executing" | "completed";
  intent?: string;
  entities?: Record<string, any>;
  pendingConfirmation?: {
    plan: any;
    description: string;
  };
  clarificationCount: number;
}

export class ConversationAnalyzer {
  private context: AgentContext;
  private conversationHistory: Array<{ role: string; content: string }>;

  constructor(
    context: AgentContext,
    history: Array<{ role: string; content: string }> = []
  ) {
    this.context = context;
    this.conversationHistory = history;
  }

  /**
   * Analyze user message to determine intent and if clarification is needed
   */
  async analyzeIntent(message: string): Promise<IntentAnalysis> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are analyzing a user's request to determine if it's clear enough to execute or needs clarification.

            Context:
            - User: ${this.context.user.name} (${this.context.user.role})
            - Current project: ${this.context.project?.title || "None selected"}
            - Available capabilities: project management, task creation, Slack messaging, file operations

            Analyze the message and return a JSON object with:
            {
              "confidence": 0.0-1.0, // How confident you are about understanding the intent
              "needsClarification": true/false, // If true, we should ask questions
              "clarifyingQuestions": [], // Questions to ask if unclear
              "suggestedIntent": "string", // What you think they want
              "extractedEntities": {}, // Any specific items mentioned (project names, task details, etc.)
              "conversationPhase": "clarifying" | "proposing" | "ready",
              "suggestedTools": [] // Tools that might be needed
            }

            Guidelines:
            - If the request mentions "project" but doesn't specify which one, ask for clarification
            - If asking to "create task" without details, ask for title and project
            - If request is vague like "help me", "overview", "status", ask what specifically they need
            - Confidence < 0.7 should trigger clarification
            - Be conversational in clarifying questions`,
          },
          {
            role: "user",
            content: `Previous conversation:
${this.conversationHistory
  .slice(-3)
  .map((m) => `${m.role}: ${m.content}`)
  .join("\n")}

Current message: ${message}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 500,
      });

      const analysis = JSON.parse(
        response.choices[0]?.message?.content || "{}"
      );

      // Ensure all required fields
      return {
        confidence: analysis.confidence || 0.5,
        needsClarification: analysis.needsClarification ?? true,
        clarifyingQuestions: analysis.clarifyingQuestions || [],
        suggestedIntent: analysis.suggestedIntent,
        extractedEntities: analysis.extractedEntities || {},
        conversationPhase: analysis.conversationPhase || "clarifying",
        suggestedTools: analysis.suggestedTools || [],
      };
    } catch (error) {
      console.error("Intent analysis error:", error);
      // Fallback to safe clarification
      return {
        confidence: 0.3,
        needsClarification: true,
        clarifyingQuestions: [
          "I want to make sure I understand correctly. Could you tell me more about what you'd like to do?",
        ],
        conversationPhase: "clarifying",
      };
    }
  }

  /**
   * Generate a conversational response for clarification
   */
  async generateClarifyingResponse(analysis: IntentAnalysis): Promise<string> {
    if (!analysis.needsClarification) {
      return "";
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant engaging in natural conversation to understand what the user needs.
            Be friendly, concise, and specific in your questions.

            Context about the user:
            - Name: ${this.context.user.name}
            - Role: ${this.context.user.role}
            - Current project: ${this.context.project?.title || "None selected"}

            Based on the analysis, ask clarifying questions naturally.
            If you detected partial intent, acknowledge what you understood.`,
          },
          {
            role: "user",
            content: `The user's intent analysis:
- Suggested intent: ${analysis.suggestedIntent || "unclear"}
- Confidence: ${(analysis.confidence * 100).toFixed(0)}%
- Extracted entities: ${JSON.stringify(analysis.extractedEntities)}
- Clarifying questions needed: ${analysis.clarifyingQuestions?.join(", ")}

Generate a natural, conversational response that asks for clarification.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      });

      return (
        response.choices[0]?.message?.content ||
        analysis.clarifyingQuestions?.join(" ") ||
        "Could you tell me more about what you'd like to do?"
      );
    } catch (error) {
      console.error("Clarifying response error:", error);
      return (
        analysis.clarifyingQuestions?.join(" ") ||
        "Could you tell me more about what you'd like to do?"
      );
    }
  }

  /**
   * Generate a proposal for user confirmation
   */
  async generateProposal(plan: any): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are presenting a plan to the user for confirmation.
            Be clear and concise about what actions will be taken.
            Format the response in a friendly, easy-to-understand way.`,
          },
          {
            role: "user",
            content: `Present this plan for user confirmation:
Title: ${plan.title}
Description: ${plan.description}
Steps: ${plan.steps
              .map((s: any) => `${s.order}. ${s.title} (using ${s.tool})`)
              .join("\n")}

Make it conversational and end with asking for confirmation.`,
          },
        ],
        temperature: 0.6,
        max_tokens: 300,
      });

      return (
        response.choices[0]?.message?.content ||
        `I'll ${plan.description}. Shall I proceed?`
      );
    } catch (error) {
      console.error("Proposal generation error:", error);
      return `I'll ${plan.description}. This will involve ${plan.steps.length} steps. Shall I proceed?`;
    }
  }

  /**
   * Check if a message is a confirmation
   */
  isConfirmation(message: string): boolean {
    const confirmations = [
      "yes",
      "yeah",
      "yep",
      "sure",
      "ok",
      "okay",
      "go ahead",
      "proceed",
      "do it",
      "sounds good",
      "perfect",
      "great",
      "confirm",
      "approved",
      "👍",
    ];

    const normalizedMessage = message.toLowerCase().trim();
    return confirmations.some((conf) => normalizedMessage.includes(conf));
  }

  /**
   * Check if a message is a rejection
   */
  isRejection(message: string): boolean {
    const rejections = [
      "no",
      "nope",
      "cancel",
      "stop",
      "don't",
      "wait",
      "hold",
      "nevermind",
      "forget it",
      "not now",
      "👎",
    ];

    const normalizedMessage = message.toLowerCase().trim();
    return rejections.some((rej) => normalizedMessage.includes(rej));
  }

  /**
   * Update conversation history
   */
  addToHistory(role: "user" | "assistant", content: string) {
    this.conversationHistory.push({ role, content });
    // Keep only last 10 messages for context
    if (this.conversationHistory.length > 10) {
      this.conversationHistory = this.conversationHistory.slice(-10);
    }
  }
}
