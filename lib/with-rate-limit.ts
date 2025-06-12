import { type NextRequest, NextResponse } from "next/server"
import { checkRateLimit, rateLimiters } from "./rate-limit"
import { supabase } from "./supabase-server"

type RateLimitType = keyof typeof rateLimiters

interface RateLimitOptions {
  type: RateLimitType
  skipAuth?: boolean
  customIdentifier?: (req: NextRequest) => string
}

export function withRateLimit(handler: (req: NextRequest) => Promise<NextResponse>, options: RateLimitOptions) {
  return async (req: NextRequest) => {
    try {
      // Get identifier (user ID or IP)
      let identifier: string

      if (options.customIdentifier) {
        identifier = options.customIdentifier(req)
      } else if (!options.skipAuth) {
        // Try to get user ID from auth
        const supabaseClient = supabase()
        const {
          data: { user },
        } = await supabaseClient.auth.getUser()
        identifier = user?.id || getClientIP(req)
      } else {
        identifier = getClientIP(req)
      }

      // Check rate limit
      const rateLimitResult = await checkRateLimit(
        rateLimiters[options.type],
        identifier,
        `${req.method} ${req.nextUrl.pathname}`,
      )

      if (!rateLimitResult.success) {
        // Log rate limit violation
        await supabase().rpc("log_event", {
          p_level: "WARNING",
          p_message: `Rate limit exceeded: ${req.method} ${req.nextUrl.pathname}`,
          p_metadata: {
            identifier,
            ip: getClientIP(req),
            userAgent: req.headers.get("user-agent"),
            path: req.nextUrl.pathname,
            method: req.method,
          },
        })

        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          {
            status: 429,
            headers: rateLimitResult.headers,
          },
        )
      }

      // Execute the handler
      const response = await handler(req)

      // Add rate limit headers to response
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value)
      })

      return response
    } catch (error) {
      console.error("Rate limit middleware error:", error)

      // Log the error
      await supabase().rpc("log_event", {
        p_level: "ERROR",
        p_message: `Rate limit middleware error: ${error}`,
        p_metadata: {
          error: error instanceof Error ? error.message : String(error),
          path: req.nextUrl.pathname,
          method: req.method,
        },
      })

      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  }
}

function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for")
  const realIP = req.headers.get("x-real-ip")

  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }

  if (realIP) {
    return realIP
  }

  return req.ip || "unknown"
}
