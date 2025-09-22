/**
 * Retry utility for handling transient failures
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    "ECONNRESET",
    "ETIMEDOUT",
    "ENOTFOUND",
    "ECONNREFUSED",
    "EAI_AGAIN",
    "RATE_LIMIT",
    "TEMPORARY_FAILURE",
    "503",
    "504",
    "429",
  ],
};

/**
 * Determine if an error is retryable
 */
function isRetryableError(error: any, retryableErrors: string[]): boolean {
  const errorMessage = error.message || "";
  const errorCode = error.code || "";
  const statusCode = error.statusCode || error.status || "";

  return retryableErrors.some((retryable) =>
    [errorMessage, errorCode, statusCode.toString()].some((value) =>
      value.includes(retryable)
    )
  );
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number
): number {
  const exponentialDelay = initialDelay * Math.pow(multiplier, attempt - 1);
  const delayWithJitter = exponentialDelay * (0.5 + Math.random() * 0.5); // 50-100% of calculated delay
  return Math.min(delayWithJitter, maxDelay);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error = new Error("No attempts made");

  for (let attempt = 1; attempt <= opts.maxAttempts!; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Check if we should retry
      const isLastAttempt = attempt === opts.maxAttempts;
      const isRetryable = isRetryableError(error, opts.retryableErrors!);

      if (isLastAttempt || !isRetryable) {
        throw error;
      }

      // Calculate delay
      const delay = calculateDelay(
        attempt,
        opts.initialDelay!,
        opts.maxDelay!,
        opts.backoffMultiplier!
      );

      // Call retry callback if provided
      if (opts.onRetry) {
        opts.onRetry(attempt, error);
      }

      // Log retry attempt
      console.log(
        `Retry attempt ${attempt}/${opts.maxAttempts} after ${delay}ms. Error: ${error.message}`
      );

      // Wait before retrying
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Decorator for adding retry logic to async functions
 */
export function Retryable(options?: RetryOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return withRetry(() => originalMethod.apply(this, args), options);
    };

    return descriptor;
  };
}

/**
 * Retry logic specifically for network requests
 */
export async function retryNetworkRequest<T>(
  request: () => Promise<T>,
  options?: Partial<RetryOptions>
): Promise<T> {
  const networkOptions: RetryOptions = {
    maxAttempts: 5,
    initialDelay: 500,
    maxDelay: 15000,
    backoffMultiplier: 1.5,
    retryableErrors: [
      ...DEFAULT_OPTIONS.retryableErrors!,
      "NETWORK_ERROR",
      "FETCH_ERROR",
      "GATEWAY_TIMEOUT",
    ],
    ...options,
  };

  return withRetry(request, networkOptions);
}

/**
 * Retry logic for database operations
 */
export async function retryDatabaseOperation<T>(
  operation: () => Promise<T>,
  options?: Partial<RetryOptions>
): Promise<T> {
  const dbOptions: RetryOptions = {
    maxAttempts: 3,
    initialDelay: 100,
    maxDelay: 2000,
    backoffMultiplier: 2,
    retryableErrors: [
      "P1001", // Can't reach database server
      "P1002", // Database server timeout
      "P2024", // Too many connections
      "SQLITE_BUSY",
      "DEADLOCK",
      "LOCK_TIMEOUT",
    ],
    ...options,
  };

  return withRetry(operation, dbOptions);
}
