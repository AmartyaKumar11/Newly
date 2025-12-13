// Basic AI operation logging
// In production, integrate with proper logging service (e.g., Sentry, DataDog)

interface AILogEntry {
  timestamp: Date;
  userId: string;
  userEmail: string;
  operation: string;
  prompt?: string;
  duration: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}

const logs: AILogEntry[] = [];
const MAX_LOG_SIZE = 1000; // Keep last 1000 entries in memory

export function logAIOperation(entry: Omit<AILogEntry, "timestamp">) {
  const logEntry: AILogEntry = {
    ...entry,
    timestamp: new Date(),
  };

  logs.push(logEntry);

  // Keep log size manageable
  if (logs.length > MAX_LOG_SIZE) {
    logs.shift();
  }

  // Console logging for development
  if (entry.success) {
    console.log(`[AI Log] ${entry.operation} - User: ${entry.userEmail}, Duration: ${entry.duration}ms`);
  } else {
    console.error(`[AI Log] ${entry.operation} - User: ${entry.userEmail}, Error: ${entry.error}`);
  }

  // In production, send to logging service here
  // await sendToLoggingService(logEntry);
}

export function getAILogs(userId?: string, limit: number = 100): AILogEntry[] {
  let filtered = logs;
  
  if (userId) {
    filtered = logs.filter((log) => log.userId === userId);
  }

  return filtered.slice(-limit).reverse(); // Most recent first
}

export function getAIUsageStats(userId: string, windowMs: number = 3600000): {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalDuration: number;
  averageDuration: number;
} {
  const windowStart = Date.now() - windowMs;
  const userLogs = logs.filter(
    (log) => log.userId === userId && log.timestamp.getTime() > windowStart
  );

  const successful = userLogs.filter((log) => log.success);
  const failed = userLogs.filter((log) => !log.success);
  const totalDuration = userLogs.reduce((sum, log) => sum + log.duration, 0);

  return {
    totalRequests: userLogs.length,
    successfulRequests: successful.length,
    failedRequests: failed.length,
    totalDuration,
    averageDuration: userLogs.length > 0 ? totalDuration / userLogs.length : 0,
  };
}
