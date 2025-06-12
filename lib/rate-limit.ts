import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Create Redis instance
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Create rate limiter instances for different use cases
export const rateLimiters = {
  // General API rate limiting
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "10 s"),
    analytics: true,
    prefix: "auratask:api",
  }),

  // AI processing rate limiting (more restrictive)
  ai: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "60 s"),
    analytics: true,
    prefix: "auratask:ai",
  }),

  // Authentication rate limiting
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "300 s"), // 5 attempts per 5 minutes
    analytics: true,
    prefix: "auratask:auth",
  }),

  // Admin actions rate limiting
  admin: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    analytics: true,
    prefix: "auratask:admin",
  }),
}

export async function checkRateLimit(limiter: Ratelimit, identifier: string, action = "request") {
  try {
    const { success, limit, reset, remaining } = await limiter.limit(identifier)

    if (!success) {
      // Log rate limit violation
      console.warn(`Rate limit exceeded for ${identifier} on ${action}`)

      return {
        success: false,
        error: "Rate limit exceeded",
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": new Date(reset).toISOString(),
        },
      }
    }

    return {
      success: true,
      headers: {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": new Date(reset).toISOString(),
      },
    }
  } catch (error) {
    console.error("Rate limiting error:", error)
    // Allow request if rate limiting fails
    return { success: true, headers: {} }
  }
}
