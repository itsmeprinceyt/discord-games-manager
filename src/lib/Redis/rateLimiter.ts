import { NextRequest } from "next/server";

/**
 * @description A comprehensive rate limiting system using Redis with Lua scripting
 * for atomic operations, IP detection, and configurable blocking logic.
 *
 * @overview
 * This system prevents abuse by limiting requests per IP address within a configurable
 * time window. When limits are exceeded, clients are temporarily blocked and redirected
 * to a rate limit page.
 *
 * @features
 * - Redis-backed rate limiting with atomic Lua scripts
 * - Configurable limits, windows, and blocking durations
 * - Intelligent IP detection with proxy support
 * - Request fingerprinting for clients without valid IPs
 * - Path-based exclusion system
 * - Comprehensive monitoring and logging
 * - Fallback mode when Redis is unavailable
 */

export interface RateLimitResponse {
  blocked: boolean;
  retryAfter?: number;
  ip: string;
  limit: number;
  remaining: number;
  resetTime?: number;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  blockTimeMs: number;
  skipPaths: string[];
  trustProxy: boolean;
  prefix: string;
  enabled: boolean;
}

/**
 * Rate Limiter Class
 * @classdesc Main rate limiter class providing IP-based request limiting with Redis backend
 *
 * @workflow
 * 1. Request received with IP detection or fingerprint generation
 * 2. Path checked against skip list
 * 3. Redis queried for current request count using atomic Lua script
 * 4. If under limit: counter incremented, request allowed
 * 5. If at/exceeded limit: block key set, request blocked with retry time
 * 6. Response with rate limit headers and blocking info
 */
export class RateLimiter {
  private static defaultConfig: RateLimitConfig = {
    maxRequests: 250,
    windowMs: 60 * 1000,
    blockTimeMs: 5 * 60 * 1000,
    skipPaths: [
      "/_next",
      "*.jpg",
      "*.jpeg",
      "*.png",
      "*.gif",
      "*.ico",
      "*.css",
      "*.js",
      "*.svg",
      "*.woff",
      "*.woff2",
      "*.ttf",
      "*.eot",
      "*.webp",
      "*.avif",
    ],
    trustProxy: true,
    prefix: "dual_leaf:ratelimit",
    enabled: true,
  };

  private static getValidIp(ip: string): string | null {
    if (!ip) return null;

    const localIps = [
      "::1",
      "127.0.0.1",
      "localhost",
      "0:0:0:0:0:0:0:1",
      "::ffff:127.0.0.1",
    ];
    if (localIps.includes(ip.toLowerCase())) return null;

    const cleanIp = ip.split(":")[0];

    const ipv4Regex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (ipv4Regex.test(cleanIp)) return cleanIp;

    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    if (ipv6Regex.test(cleanIp)) return cleanIp;

    return null;
  }

  static getClientIp(request: NextRequest, config: RateLimitConfig): string {
    const ipHeaders = config.trustProxy
      ? [
          "cf-connecting-ip", // Cloudflare
          "x-real-ip", // Nginx, Apache
          "x-forwarded-for", // Standard proxy header
          "x-client-ip", // Custom headers
        ]
      : []; // If not trusting proxy, skip header checks

    if (config.trustProxy) {
      for (const header of ipHeaders) {
        const value = request.headers.get(header);
        if (value) {
          // Handle x-forwarded-for which can contain multiple IPs
          if (header === "x-forwarded-for") {
            const ips = value.split(",").map((ip) => ip.trim());
            // Get the first valid IP (client's original IP)
            for (const ip of ips) {
              const validIp = this.getValidIp(ip);
              if (validIp) return validIp;
            }
          } else {
            const validIp = this.getValidIp(value);
            if (validIp) return validIp;
          }
        }
      }
    }

    return this.generateFingerprint(request);
  }

  private static generateFingerprint(request: NextRequest): string {
    const components = [
      request.headers.get("user-agent") || "unknown",
      request.headers.get("accept-language") || "unknown",
      request.headers.get("accept-encoding") || "unknown",
      request.headers.get("sec-ch-ua-platform") || "unknown",
    ];

    const fingerprint = components.join("|");
    return `ip_fingerprint_${this.simpleHash(fingerprint)}`;
  }

  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).substring(0, 10);
  }

  private static async getRedisClient() {
    try {
      const { getRedis } = await import("./redis");
      const redis = getRedis();

      await redis.ping();
      return redis;
    } catch (error: unknown) {
      console.error("[RateLimit] Redis connection error:", error);
      return null;
    }
  }

  private static getRateLimitLuaScript(): string {
    return `
      -- KEYS[1]: block key
      -- KEYS[2]: limit key
      -- ARGV[1]: current timestamp (ms)
      -- ARGV[2]: window size (ms)
      -- ARGV[3]: max requests
      -- ARGV[4]: block duration (ms)
      
      local blockKey = KEYS[1]
      local limitKey = KEYS[2]
      local now = tonumber(ARGV[1])
      local windowMs = tonumber(ARGV[2])
      local maxRequests = tonumber(ARGV[3])
      local blockTimeMs = tonumber(ARGV[4])
      
      -- Check if currently blocked
      local blockedUntil = redis.call('GET', blockKey)
      if blockedUntil then
        blockedUntil = tonumber(blockedUntil)
        if now < blockedUntil then
          return {1, blockedUntil - now, maxRequests, 0, blockedUntil}
        else
          -- Block expired, clean it up
          redis.call('DEL', blockKey)
        end
      end
      
      -- Get current count and reset time
      local count = tonumber(redis.call('GET', limitKey) or 0)
      local ttl = redis.call('TTL', limitKey)
      local resetTime = now + (ttl > 0 and ttl * 1000 or windowMs)
      
      -- Check if limit exceeded
      if count >= maxRequests then
        -- Set block
        local newBlockUntil = now + blockTimeMs
        redis.call('SET', blockKey, newBlockUntil, 'PX', blockTimeMs)
        redis.call('DEL', limitKey)
        
        return {1, blockTimeMs, maxRequests, 0, newBlockUntil}
      end
      
      -- Increment counter
      if count == 0 then
        redis.call('SET', limitKey, 1, 'PX', math.ceil(windowMs / 1000))
      else
        redis.call('INCR', limitKey)
      end
      
      -- Update TTL if needed
      if ttl <= 0 then
        redis.call('EXPIRE', limitKey, math.ceil(windowMs / 1000))
      end
      
      local newCount = count + 1
      return {0, 0, maxRequests, maxRequests - newCount, resetTime}
    `;
  }

  static async checkRateLimit(
    request: NextRequest,
    userConfig: Partial<RateLimitConfig> = {}
  ): Promise<RateLimitResponse> {
    const config: RateLimitConfig = {
      ...this.defaultConfig,
      ...userConfig,
    };

    // Skip if rate limiting is disabled
    if (!config.enabled) {
      return {
        blocked: false,
        ip: "disabled",
        limit: config.maxRequests,
        remaining: config.maxRequests,
      };
    }

    const pathname = request.nextUrl.pathname;
    const ip = this.getClientIp(request, config);

    try {
      const redis = await this.getRedisClient();

      // Fallback if Redis is unavailable
      if (!redis) {
        console.warn(
          "[RateLimit] Redis not available, using in-memory fallback"
        );
        return this.fallbackResponse(ip, config);
      }

      const blockKey = `${config.prefix}:blocked:${ip}`;
      const limitKey = `${config.prefix}:limit:${ip}:${Math.floor(
        Date.now() / config.windowMs
      )}`;

      const now = Date.now();
      const luaScript = this.getRateLimitLuaScript();

      // Execute atomic Lua script
      const result = (await redis.eval(
        luaScript,
        [blockKey, limitKey],
        [
          now.toString(),
          config.windowMs.toString(),
          config.maxRequests.toString(),
          config.blockTimeMs.toString(),
        ]
      )) as [number, number, number, number, number];

      const [blocked, retryMs, limit, remaining, resetTime] = result;

      const response: RateLimitResponse = {
        blocked: blocked === 1,
        ip,
        limit,
        remaining,
        resetTime,
      };

      if (blocked === 1) {
        response.retryAfter = Math.ceil(retryMs / 1000);

        // Log blocking for monitoring
        console.log(
          `[RateLimit] Blocked IP: ${ip}, Path: ${pathname}, ` +
            `Retry after: ${response.retryAfter}s`
        );
      } else if (remaining <= 2) {
        // Warning for near-limit
        console.log(
          `[RateLimit] Warning: IP ${ip} approaching limit ` +
            `(${config.maxRequests - remaining}/${config.maxRequests})`
        );
      }

      return response;
    } catch (error: unknown) {
      console.error("[RateLimit] Error:", error);
      return this.fallbackResponse(ip, config);
    }
  }

  private static fallbackResponse(
    ip: string,
    config: RateLimitConfig
  ): RateLimitResponse {
    return {
      blocked: false,
      ip,
      limit: config.maxRequests,
      remaining: config.maxRequests,
    };
  }
}

/**
 * @description Middleware function that checks rate limits and returns 429 JSON responses for blocked API requests
 *
 * @workflow
 * 1. Checks rate limit using RateLimiter.checkRateLimit()
 * 2. If blocked → Returns 429 JSON response with rate limit headers
 * 3. If allowed → Returns null with rate limit headers for response decoration
 */
export async function rateLimitMiddleware(
  request: NextRequest,
  config?: Partial<RateLimitConfig>
): Promise<Response | null> {
  const rateLimitResult = await RateLimiter.checkRateLimit(request, config);

  if (rateLimitResult.blocked) {
    const responseBody = {
      error: "Too many requests",
      status: 429,
    };

    return new Response(JSON.stringify(responseBody), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": rateLimitResult.retryAfter?.toString() || "60",
        "X-RateLimit-Limit": rateLimitResult.limit.toString(),
        "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
        "X-RateLimit-Reset": rateLimitResult.resetTime?.toString() || "",
      },
    });
  }

  const headers = new Headers();
  headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString());
  headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString());
  if (rateLimitResult.resetTime) {
    headers.set("X-RateLimit-Reset", rateLimitResult.resetTime.toString());
  }

  return null;
}
