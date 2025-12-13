// Simple in-memory rate limiter for AI endpoints
// In production, use Redis-based solution like @upstash/ratelimit

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

const store: RateLimitStore = {};

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  maxTokens?: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 10, // 10 requests
  windowMs: 60000, // per minute
  maxTokens: 10000, // max tokens per request
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  reason?: string;
}

export function checkRateLimit(
  userId: string,
  config: Partial<RateLimitConfig> = {}
): RateLimitResult {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const now = Date.now();
  const key = userId;
  
  const record = store[key];
  
  // Reset if window expired
  if (!record || record.resetAt < now) {
    store[key] = {
      count: 1,
      resetAt: now + finalConfig.windowMs,
    };
    return {
      allowed: true,
      remaining: finalConfig.maxRequests - 1,
      resetAt: now + finalConfig.windowMs,
    };
  }
  
  // Check if limit exceeded
  if (record.count >= finalConfig.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
      reason: `Rate limit exceeded: ${finalConfig.maxRequests} requests per ${finalConfig.windowMs}ms`,
    };
  }
  
  // Increment and allow
  record.count += 1;
  return {
    allowed: true,
    remaining: finalConfig.maxRequests - record.count,
    resetAt: record.resetAt,
  };
}

export function validateTokenLimit(tokens: number, maxTokens: number = DEFAULT_CONFIG.maxTokens!): boolean {
  return tokens <= maxTokens;
}

// Cleanup expired entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    Object.keys(store).forEach((key) => {
      if (store[key].resetAt < now) {
        delete store[key];
      }
    });
  }, 60000); // Clean every minute
}
