import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Use Node.js runtime to avoid Edge Function size limits
export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Define available functions for the AI
const functions = [
  {
    name: "get_projects",
    description:
      "Get all projects in the system with their details, progress, and team information",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          description: "Filter by project status",
          enum: ["active", "completed", "on-hold", "cancelled"],
        },
        limit: {
          type: "number",
          description: "Maximum number of projects to return",
        },
      },
    },
  },
  {
    name: "get_site_overview",
    description:
      "Get a comprehensive overview of the entire site including project statistics, task metrics, portfolios, and recent activity",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_tasks",
    description: "Get tasks with filtering options",
    parameters: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "Filter tasks by project ID",
        },
        status: {
          type: "string",
          description: "Filter by task status",
          enum: ["todo", "in-progress", "completed", "blocked"],
        },
        assigneeId: {
          type: "string",
          description: "Filter by assigned user ID",
        },
        limit: {
          type: "number",
          description: "Maximum number of tasks to return",
        },
      },
    },
  },
  {
    name: "search_content",
    description:
      "Search across all content including projects, tasks, documents, and knowledge base using both semantic search and database queries",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query",
        },
        projectId: {
          type: "string",
          description: "Optional project ID to scope the search",
        },
        type: {
          type: "string",
          description: "Type of search: all, rag, or database",
          enum: ["all", "rag", "database"],
        },
      },
      required: ["query"],
    },
  },
];

// Function to call our data APIs
async function callFunction(name: string, args: any) {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

  try {
    let url = "";
    let params = new URLSearchParams();

    switch (name) {
      case "get_projects":
        url = `${baseUrl}/api/agent/data/projects`;
        if (args.status) params.append("status", args.status);
        if (args.limit) params.append("limit", args.limit.toString());
        break;

      case "get_site_overview":
        url = `${baseUrl}/api/agent/data/overview`;
        break;

      case "get_tasks":
        url = `${baseUrl}/api/agent/data/tasks`;
        if (args.projectId) params.append("projectId", args.projectId);
        if (args.status) params.append("status", args.status);
        if (args.assigneeId) params.append("assigneeId", args.assigneeId);
        if (args.limit) params.append("limit", args.limit.toString());
        break;

      case "search_content":
        url = `${baseUrl}/api/agent/data/search`;
        params.append("query", args.query);
        if (args.projectId) params.append("projectId", args.projectId);
        if (args.type) params.append("type", args.type);
        break;

      default:
        throw new Error(`Unknown function: ${name}`);
    }

    const fullUrl = params.toString() ? `${url}?${params.toString()}` : url;
    const response = await fetch(fullUrl);

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    const data = await response.json();
    return JSON.stringify(data);
  } catch (error: any) {
    return JSON.stringify({ error: error.message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, projectId, history = [] } = body;

    // Build messages array with system prompt
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are an AI assistant for a project management system. You have access to real-time data about projects, tasks, documents, and team members.
        
You can:
- Retrieve and analyze project information
- Search through project documentation and knowledge base
- Provide insights about project status and progress
- Help with task management and team coordination
- Answer questions about the system's data

Always provide helpful, accurate information based on the actual data you retrieve. When searching or retrieving information, use the available functions to get real-time data rather than making assumptions.

If asked about specific projects or tasks, always fetch the latest data first before responding.`,
      },
      ...history,
      { role: "user", content: message },
    ];

    // Initial API call with functions
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages,
      functions,
      function_call: "auto",
      temperature: 0.7,
      max_tokens: 1000,
    });

    let responseMessage = completion.choices[0].message;

    // Handle function calls
    if (responseMessage.function_call) {
      const functionName = responseMessage.function_call.name;
      const functionArgs = JSON.parse(responseMessage.function_call.arguments);

      // Call the function
      const functionResult = await callFunction(functionName, functionArgs);

      // Add function result to messages
      messages.push(responseMessage);
      messages.push({
        role: "function",
        name: functionName,
        content: functionResult,
      });

      // Get final response
      const secondCompletion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      responseMessage = secondCompletion.choices[0].message;
    }

    return NextResponse.json({
      response: responseMessage.content || "I couldn't generate a response.",
      functionCalled: responseMessage.function_call ? true : false,
    });
  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json(
      {
        response:
          "I encountered an error while processing your request. Please try again.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
