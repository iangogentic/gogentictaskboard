import { NextResponse } from "next/server";
import { auth } from "@/auth";
import OpenAI from "openai";

// Edge Runtime compatible
export const runtime = "edge";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// Define available functions the AI can call
const functions = [
  {
    name: "get_projects",
    description: "Get all projects in the system with their details",
    parameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["ACTIVE", "COMPLETED", "ARCHIVED", "ALL"],
          description: "Filter by project status",
        },
        portfolio: {
          type: "string",
          description: "Filter by portfolio name",
        },
      },
    },
  },
  {
    name: "get_tasks",
    description: "Get tasks for a specific project or user",
    parameters: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "Project ID to get tasks for",
        },
        userId: {
          type: "string",
          description: "User ID to get tasks for",
        },
        status: {
          type: "string",
          enum: ["TODO", "IN_PROGRESS", "COMPLETED", "ALL"],
          description: "Filter by task status",
        },
      },
    },
  },
  {
    name: "get_site_overview",
    description:
      "Get an overview of the entire site including stats and metrics",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "search_content",
    description: "Search for any content across the site",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query",
        },
        type: {
          type: "string",
          enum: ["projects", "tasks", "users", "all"],
          description: "Type of content to search",
        },
      },
      required: ["query"],
    },
  },
];

// Function to execute the actual API calls
async function executeFunction(name: string, args: any) {
  const baseUrl =
    process.env.NEXTAUTH_URL || "https://gogentic-portal-real.vercel.app";

  switch (name) {
    case "get_projects":
      const projectsRes = await fetch(`${baseUrl}/api/agent/data/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      });
      return await projectsRes.json();

    case "get_tasks":
      const tasksRes = await fetch(`${baseUrl}/api/agent/data/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      });
      return await tasksRes.json();

    case "get_site_overview":
      const overviewRes = await fetch(`${baseUrl}/api/agent/data/overview`, {
        method: "GET",
      });
      return await overviewRes.json();

    case "search_content":
      const searchRes = await fetch(`${baseUrl}/api/agent/data/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      });
      return await searchRes.json();

    default:
      return { error: "Function not found" };
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message } = await request.json();
    const user = session.user;

    // Initial messages with system context
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are an AI assistant for the Gogentic Portal project management system.
        
You have access to real-time data about projects, tasks, and the overall system through function calls.
When users ask about what's on the site, current projects, tasks, or any data, use the appropriate functions to fetch that information.

User context:
- Name: ${user.name}
- Email: ${user.email}
- Role: ${user.role || "USER"}

Be helpful, concise, and accurate. Always fetch real data instead of making assumptions.`,
      },
      {
        role: "user",
        content: message,
      },
    ];

    // First API call to determine what functions to call
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      functions,
      function_call: "auto",
      temperature: 0.7,
    });

    const responseMessage = completion.choices[0].message;

    // Check if the model wants to call a function
    if (responseMessage.function_call) {
      const functionName = responseMessage.function_call.name;
      const functionArgs = JSON.parse(responseMessage.function_call.arguments);

      // Execute the function
      const functionResult = await executeFunction(functionName, functionArgs);

      // Add the function result to the conversation
      messages.push(responseMessage);
      messages.push({
        role: "function",
        name: functionName,
        content: JSON.stringify(functionResult),
      });

      // Get the final response from the model
      const secondCompletion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        temperature: 0.7,
      });

      return NextResponse.json({
        response: secondCompletion.choices[0].message.content,
        functionsUsed: [functionName],
        model: "gpt-4o",
      });
    }

    // If no function call, return the direct response
    return NextResponse.json({
      response: responseMessage.content,
      functionsUsed: [],
      model: "gpt-4o",
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
