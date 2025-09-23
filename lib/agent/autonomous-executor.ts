import { prisma } from "@/lib/prisma";

/**
 * Safely execute Prisma operations for the autonomous agent
 * This provides a controlled environment for database operations
 */

// Define allowed operations whitelist
const ALLOWED_OPERATIONS = {
  project: ["findMany", "findUnique", "findFirst", "count"],
  task: ["findMany", "findUnique", "findFirst", "count"],
  user: ["findMany", "findUnique", "count"],
  update: ["findMany", "findFirst", "count"],
  // Explicitly block all mutations in production
  // Uncomment specific operations only after security review
  // project: ['create', 'update'],
  // task: ['create', 'update'],
};

// Dangerous operations that should never be allowed
const BLOCKED_OPERATIONS = [
  "delete",
  "deleteMany",
  "updateMany",
  "createMany",
  "$executeRaw",
  "$executeRawUnsafe",
  "$queryRaw",
  "$queryRawUnsafe",
  "$transaction",
  "upsert",
];

export interface ExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  operation?: string;
  duration?: number;
}

/**
 * Parse and validate the operation string
 */
function parseOperation(operation: string): {
  model?: string;
  method?: string;
  args?: any;
  isValid: boolean;
} {
  try {
    // Match patterns like: prisma.project.create({...})
    const match = operation.match(/prisma\.(\w+)\.(\w+)\((.*)\)/s);

    if (!match) {
      return { isValid: false };
    }

    const [, model, method, argsStr] = match;

    // Parse the arguments (they should be valid JSON)
    let args;
    try {
      // Convert JavaScript object notation to JSON
      const jsonStr = argsStr
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":') // Quote keys
        .replace(/'/g, '"') // Replace single quotes with double
        .replace(/undefined/g, "null") // Replace undefined with null
        .replace(/new Date\(\)/g, `"${new Date().toISOString()}"`) // Replace new Date()
        .replace(/new Date\("([^"]+)"\)/g, '"$1"'); // Replace new Date("...")

      args = JSON.parse(jsonStr);
    } catch (e) {
      // If JSON parsing fails, try to evaluate it safely
      args = {};
    }

    return {
      model,
      method,
      args,
      isValid: true,
    };
  } catch (error) {
    return { isValid: false };
  }
}

/**
 * Execute a single Prisma operation
 */
export async function executePrismaOperation(
  operation: string,
  reasoning?: string
): Promise<ExecutionResult> {
  const startTime = Date.now();

  try {
    // Parse the operation
    const parsed = parseOperation(operation);

    if (!parsed.isValid || !parsed.model || !parsed.method) {
      return {
        success: false,
        error: "Invalid operation format",
        operation,
      };
    }

    // Security check: Validate against whitelist
    const allowedMethods = (ALLOWED_OPERATIONS as any)[parsed.model];
    if (!allowedMethods) {
      return {
        success: false,
        error: `Model '${parsed.model}' is not allowed for autonomous operations`,
        operation,
      };
    }

    if (!allowedMethods.includes(parsed.method)) {
      return {
        success: false,
        error: `Method '${parsed.method}' is not allowed on model '${parsed.model}'. Only read operations are permitted.`,
        operation,
      };
    }

    // Additional check for blocked operations
    if (BLOCKED_OPERATIONS.includes(parsed.method)) {
      return {
        success: false,
        error: `Method '${parsed.method}' is explicitly blocked for security reasons`,
        operation,
      };
    }

    // Validate the model exists
    const model = (prisma as any)[parsed.model];
    if (!model) {
      return {
        success: false,
        error: `Model '${parsed.model}' not found`,
        operation,
      };
    }

    // Validate the method exists
    const method = model[parsed.method];
    if (!method || typeof method !== "function") {
      return {
        success: false,
        error: `Method '${parsed.method}' not found on model '${parsed.model}'`,
        operation,
      };
    }

    // Execute the operation
    const result = await method.call(model, parsed.args);

    return {
      success: true,
      data: result,
      operation,
      duration: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Execution failed",
      operation,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Execute multiple operations, optionally in a transaction
 */
export async function executeMultipleOperations(
  operations: Array<{ operation: string; reasoning: string }>,
  useTransaction = false
): Promise<ExecutionResult[]> {
  if (useTransaction) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        const txResults: ExecutionResult[] = [];

        for (const op of operations) {
          const parsed = parseOperation(op.operation);

          if (!parsed.isValid || !parsed.model || !parsed.method) {
            throw new Error(`Invalid operation: ${op.operation}`);
          }

          // Use transaction client
          const model = (tx as any)[parsed.model];
          const result = await model[parsed.method](parsed.args);

          txResults.push({
            success: true,
            data: result,
            operation: op.operation,
          });
        }

        return txResults;
      });

      return results;
    } catch (error: any) {
      return [
        {
          success: false,
          error: `Transaction failed: ${error.message}`,
          operation: "transaction",
        },
      ];
    }
  } else {
    // Execute sequentially without transaction
    const results: ExecutionResult[] = [];

    for (const op of operations) {
      const result = await executePrismaOperation(op.operation, op.reasoning);
      results.push(result);

      // Stop if an operation fails
      if (!result.success && !useTransaction) {
        break;
      }
    }

    return results;
  }
}

/**
 * Common operation templates for the agent to use
 */
export const operationTemplates = {
  // Project operations
  createProject: (data: any) =>
    `prisma.project.create({ data: ${JSON.stringify(data)} })`,

  updateProject: (id: string, data: any) =>
    `prisma.project.update({ where: { id: "${id}" }, data: ${JSON.stringify(data)} })`,

  getProject: (id: string) =>
    `prisma.project.findUnique({ where: { id: "${id}" }, include: { tasks: true, pm: true, developers: true } })`,

  // Task operations
  createTask: (data: any) =>
    `prisma.task.create({ data: ${JSON.stringify(data)} })`,

  updateTask: (id: string, data: any) =>
    `prisma.task.update({ where: { id: "${id}" }, data: ${JSON.stringify(data)} })`,

  // User operations
  findAvailablePM: () =>
    `prisma.user.findFirst({ where: { role: { in: ["admin", "manager"] } }, orderBy: { tasks: { _count: "asc" } } })`,

  // Complex queries
  getProjectStats: (projectId: string) =>
    `prisma.project.findUnique({
      where: { id: "${projectId}" },
      include: {
        tasks: { select: { status: true, estimatedHours: true, actualHours: true } },
        _count: { select: { tasks: true, updates: true } }
      }
    })`,
};

/**
 * Validate if an operation is safe to execute
 */
export function isOperationSafe(operation: string): boolean {
  // Block certain dangerous operations
  const dangerousPatterns = [
    /prisma\.\$executeRaw/i,
    /prisma\.\$queryRaw/i,
    /delete\s*from/i,
    /drop\s+table/i,
    /truncate/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(operation)) {
      return false;
    }
  }

  return true;
}
