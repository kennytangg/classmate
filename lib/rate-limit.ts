import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// AI endpoints — expensive per call (BINUS Ollama)
export const aiLimiter = new RateLimiterMemory({ points: 20, duration: 3600 })

// Moderation endpoint — public-facing; higher burst allowed
export const moderationLimiter = new RateLimiterMemory({ points: 60, duration: 60 })

// Auth endpoints — brute-force / credential stuffing protection
export const authLimiter = new RateLimiterMemory({ points: 10, duration: 900 })

// Write endpoints — POST/PATCH/DELETE mutations
export const writeLimiter = new RateLimiterMemory({ points: 30, duration: 60 })

// General authenticated endpoints
export const generalLimiter = new RateLimiterMemory({ points: 100, duration: 60 })

/**
 * Extract the client IP from a NextRequest.
 * Prefers Cloudflare's CF-Connecting-IP (set by our trusted proxy); falls back
 * to x-forwarded-for / x-real-ip, which can be spoofed if requests bypass the proxy.
 */
export function getClientIp(req: NextRequest): string | null {
  const cfIp = req.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp.trim()

  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]
    if (first) return first.trim()
  }
  return req.headers.get('x-real-ip')
}

/**
 * Consume one point from the given limiter for `identifier`.
 * Returns null when the request is allowed.
 * Returns a 429 NextResponse when the limit is exceeded.
 */
export async function checkRateLimit(
  identifier: string | null,
  limiter: RateLimiterMemory
): Promise<NextResponse | null> {
  try {
    await limiter.consume(identifier ?? 'unknown')
    return null
  } catch (err) {
    if (err instanceof RateLimiterRes) {
      const retryAfter = Math.ceil(err.msBeforeNext / 1000)
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfter) },
        }
      )
    }
    // Unexpected error — fail open (don't block the request)
    console.error('[rate-limit] Unexpected error:', err)
    return null
  }
}
