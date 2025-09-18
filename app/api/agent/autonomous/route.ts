import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import {
  executePrismaOperation,
  executeMultipleOperations,
  isOperationSafe,
  operationTemplates,
} from "@/lib/agent/autonomous-executor";

// Use Node.js runtime for better performance and features
export const runtime = "nodejs";

// Lazy initialize OpenAI client to prevent build-time errors
let openai: OpenAI | null = null;

function getOpenAIClient() {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

// Store assistant ID (in production, use env variable)
let ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

/**
 * Get example operations for context
 */
function getExampleOperations() {
  return `
Example operations you can use:

// Creating a project
prisma.project.create({
  data: {
    title: "New Website",
    clientName: "Acme Corp",
    status: "active",
    pmId: "user-id-here",
    startDate: new Date(),
    health: "green"
  }
})

// Finding users
prisma.user.findMany({
  where: { role: "developer" },
  include: { tasks: true }
})

// Updating tasks
prisma.task.update({
  where: { id: "task-id" },
  data: { status: "completed", actualHours: 5 }
})

// Complex queries with relations
prisma.project.findMany({
  where: { status: "active" },
  include: {
    tasks: { where: { status: "in-progress" } },
    pm: true,
    developers: true
  }
})

// Transactions for multiple operations
Use execute_complex_operation with useTransaction: true
`;
}

/**
 * Initialize or get the autonomous assistant
 */
async function getOrCreateAssistant() {
  if (ASSISTANT_ID) {
    try {
      const assistant =
        await getOpenAIClient().beta.assistants.retrieve(ASSISTANT_ID);
      return assistant;
    } catch (error) {
      console.log("Assistant not found, creating new one...");
    }
  }

  // Get schema information from the database
  const tableInfo = (await prisma.$queryRaw`
    SELECT table_name, column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `) as any[];

  const schemaInfo = tableInfo.reduce(
    (acc, col) => {
      if (!acc[col.table_name]) {
        acc[col.table_name] = [];
      }
      acc[col.table_name].push(`${col.column_name} (${col.data_type})`);
      return acc;
    },
    {} as Record<string, string[]>
  );

  const schemaDescription = Object.entries(schemaInfo)
    .map(([table, columns]) => `${table}: ${(columns as string[]).join(", ")}`)
    .join("\n");

  // Create the assistant with full autonomous capabilities
  const assistant = await getOpenAIClient().beta.assistants.create({
    name: "GoGentic Autonomous Project Manager",
    instructions: `You are an autonomous project management AI with FULL direct database access through Prisma.

## Your Capabilities:
- FULL READ/WRITE access to ALL tables in the database
- Execute any Prisma query: create, read, update, delete, findMany, aggregate, etc.
- Make autonomous decisions without asking for permission
- Handle complex multi-step operations
- Remember context through persistent threads

## Database Tables Available:
${schemaDescription}

## How to Execute Operations:

Use execute_database_operation for single operations:
- Write complete Prisma operations like: prisma.project.create({ data: {...} })
- Include 'where', 'include', 'select', 'orderBy' clauses as needed
- Use proper field types (dates as ISO strings, numbers, booleans, etc.)

Use execute_complex_operation for multiple related operations:
- Provide array of operations
- Set useTransaction: true for atomic operations
- Each operation should have a reasoning

${getExampleOperations()}

## Your Approach:
1. Understand the user's full intent
2. Check existing data before creating duplicates
3. Execute operations autonomously
4. Be proactive - if creating a project, consider creating initial tasks too
5. Provide clear summaries of what was accomplished

## Key Guidelines:
- Always use proper Prisma syntax
- Include relations with 'include' when fetching data
- Use transactions for related operations
- Handle dates as ISO strings or new Date()
- Check for existing records before creating
- Be smart about defaults (e.g., set project health to 'green' initially)

You have FULL autonomy. Make intelligent decisions and execute them.`,
    model: "gpt-4-turbo-preview",
    tools: [
      {
        type: "function",
        function: {
          name: "execute_database_operation",
          description: "Execute any single Prisma database operation",
          parameters: {
            type: "object",
            properties: {
              operation: {
                type: "string",
                description:
                  "Complete Prisma operation, e.g., prisma.project.create({ data: {...} })",
              },
              reasoning: {
                type: "string",
                description: "Why this operation is needed",
              },
            },
            required: ["operation", "reasoning"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "execute_complex_operation",
          description: "Execute multiple related database operations",
          parameters: {
            type: "object",
            properties: {
              operations: {
                type: "array",
                description: "Array of operations to execute",
                items: {
                  type: "object",
                  properties: {
                    operation: {
                      type: "string",
                      description: "Prisma operation",
                    },
                    reasoning: {
                      type: "string",
                      description: "Why this operation is needed",
                    },
                  },
                  required: ["operation", "reasoning"],
                },
              },
              useTransaction: {
                type: "boolean",
                description: "Execute all operations in a single transaction",
              },
            },
            required: ["operations"],
          },
        },
      },
    ],
  });

  ASSISTANT_ID = assistant.id;

  // Store in database for persistence
  try {
    await prisma.agentSession.create({
      data: {
        id: `session_${Date.now()}`,
        userId: "autonomous_agent",
        state: "active",
        plan: {
          assistantId: assistant.id,
          model: "gpt-4-turbo-preview",
          capabilities: ["full_database_access", "autonomous_operations"],
        },
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.log("Could not store assistant session:", error);
  }

  console.log("Created new assistant:", assistant.id);
  return assistant;
}

/**
 * Get or create a thread for the conversation
 */
async function getOrCreateThread(userId: string, conversationId?: string) {
  if (conversationId) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { metadata: true },
    });

    const metadata = conversation?.metadata as any;
    if (metadata?.threadId) {
      try {
        const thread = await getOpenAIClient().beta.threads.retrieve(
          metadata.threadId
        );
        return thread;
      } catch (error) {
        console.log("Thread not found, creating new one...");
      }
    }
  }

  // Create a new thread
  const thread = await getOpenAIClient().beta.threads.create({
    metadata: {
      userId,
      conversationId: conversationId || "new",
      created: new Date().toISOString(),
    },
  });

  // Store thread ID
  if (conversationId) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        metadata: { threadId: thread.id },
      },
    });
  }

  return thread;
}

/**
 * Main POST handler
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, userId, conversationId, createNewThread = false } = body;

    const effectiveUserId = userId || "autonomous-user";

    // Get or create the assistant
    const assistant = await getOrCreateAssistant();

    // Get or create conversation
    let conversation = conversationId
      ? await prisma.conversation.findUnique({ where: { id: conversationId } })
      : null;

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          id: `conv_${Date.now()}`,
          userId: effectiveUserId,
          title: message.substring(0, 100),
          updatedAt: new Date(),
        },
      });
    }

    // Get or create thread
    const thread = createNewThread
      ? await getOrCreateThread(effectiveUserId)
      : await getOrCreateThread(effectiveUserId, conversation.id);

    // Store user message
    await prisma.message.create({
      data: {
        id: `msg_${Date.now()}_user`,
        conversationId: conversation.id,
        content: message,
        role: "user",
      },
    });

    // Add message to thread
    await getOpenAIClient().beta.threads.messages.create(thread.id, {
      role: "user",
      content: message,
    });

    // Run the assistant
    const run = await getOpenAIClient().beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id,
    });

    // Poll for completion with timeout
    let runStatus = await getOpenAIClient().beta.threads.runs.retrieve(
      thread.id,
      run.id as any
    );
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds timeout

    while (
      runStatus.status !== "completed" &&
      runStatus.status !== "failed" &&
      attempts < maxAttempts
    ) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runStatus = await getOpenAIClient().beta.threads.runs.retrieve(
        thread.id,
        run.id as any
      );
      attempts++;

      // Handle function calls
      if (runStatus.status === "requires_action" && runStatus.required_action) {
        const toolCalls =
          runStatus.required_action.submit_tool_outputs.tool_calls;
        const toolOutputs = [];

        for (const toolCall of toolCalls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);

          let output;

          if (functionName === "execute_database_operation") {
            // Validate operation safety
            if (!isOperationSafe(functionArgs.operation)) {
              output = JSON.stringify({
                success: false,
                error: "Operation blocked for safety reasons",
              });
            } else {
              const result = await executePrismaOperation(
                functionArgs.operation,
                functionArgs.reasoning
              );
              output = JSON.stringify(result);
            }
          } else if (functionName === "execute_complex_operation") {
            // Validate all operations
            const unsafeOps = functionArgs.operations.filter(
              (op: any) => !isOperationSafe(op.operation)
            );

            if (unsafeOps.length > 0) {
              output = JSON.stringify({
                success: false,
                error: "Some operations blocked for safety reasons",
              });
            } else {
              const results = await executeMultipleOperations(
                functionArgs.operations,
                functionArgs.useTransaction || false
              );
              output = JSON.stringify({ results });
            }
          } else {
            output = JSON.stringify({
              error: `Unknown function: ${functionName}`,
            });
          }

          toolOutputs.push({
            tool_call_id: toolCall.id,
            output,
          });
        }

        // Submit tool outputs
        await getOpenAIClient().beta.threads.runs.submitToolOutputs(
          thread.id,
          run.id as any,
          {
            tool_outputs: toolOutputs,
          } as any
        );
      }
    }

    // Check for timeout
    if (attempts >= maxAttempts) {
      return NextResponse.json(
        {
          response: "Request timed out. Please try again.",
          conversationId: conversation.id,
          threadId: thread.id,
          error: "Timeout",
        },
        { status: 408 }
      );
    }

    // Get messages
    const messages = await getOpenAIClient().beta.threads.messages.list(
      thread.id
    );
    const lastMessage = messages.data[0];

    // Store and return assistant response
    if (lastMessage.role === "assistant") {
      const content = lastMessage.content[0];
      if (content.type === "text") {
        await prisma.message.create({
          data: {
            id: `msg_${Date.now()}_assistant`,
            conversationId: conversation.id,
            content: content.text.value,
            role: "assistant",
          },
        });

        await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            updatedAt: new Date(),
            metadata: {
              threadId: thread.id,
              lastRunId: run.id,
            },
          },
        });

        return NextResponse.json({
          response: content.text.value,
          conversationId: conversation.id,
          threadId: thread.id,
          autonomous: true,
        });
      }
    }

    // Handle failed run
    if (runStatus.status === "failed") {
      return NextResponse.json(
        {
          response: "The operation failed. Please try again.",
          error: runStatus.last_error?.message || "Unknown error",
          conversationId: conversation.id,
          threadId: thread.id,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      response: "Request processed but no response generated.",
      conversationId: conversation.id,
      threadId: thread.id,
    });
  } catch (error: any) {
    console.error("Autonomous agent error:", error);
    return NextResponse.json(
      {
        response: "An error occurred while processing your request.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler for conversation history
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId");
  const userId = searchParams.get("userId");

  if (!conversationId) {
    const conversations = await prisma.conversation.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: {
        Message: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });
    return NextResponse.json({ conversations });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      Message: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return NextResponse.json({ conversation });
}
