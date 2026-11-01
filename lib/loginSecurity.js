import { createHash } from "node:crypto";
import AuthRateLimit from "../models/AuthRateLimit.js";
import { PUBLIC_RATE_LIMITS, RATE_LIMIT_WINDOW_MS } from "../config/security.js";

const WINDOW_MS = RATE_LIMIT_WINDOW_MS;

// Shared across instances; no reliance on spoofable forwarded IP headers.
// Fixed windows bound account lockout. TTL is cleanup, not enforcement.
async function consumeBucket(key, maxAttempts, now) {
  const window = Math.floor(now / WINDOW_MS);
  const _id = `${key}:${window}`;
  const expiresAt = new Date((window + 1) * WINDOW_MS);
  let result;
  try {
    result = await AuthRateLimit.findOneAndUpdate({ _id }, {
      $inc: { attempts: 1 }, $setOnInsert: { expiresAt },
    }, { upsert: true, returnDocument: "after" }).lean();
  } catch (error) {
    // Concurrent first attempts can race on the unique _id index.
    if (error?.code !== 11000) throw error;
    result = await AuthRateLimit.findOneAndUpdate({ _id }, { $inc: { attempts: 1 } }, { returnDocument: "after" }).lean();
  }
  if (!result) throw new Error("Login rate limit could not be checked.");
  return { allowed: result.attempts <= maxAttempts, retryAfter: Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000)) };
}

export async function consumePublicAttempt(kind, value, now = Date.now()) {
  const limits = PUBLIC_RATE_LIMITS[kind];
  if (!limits) throw new Error("Unknown rate limit policy.");
  const global = await consumeBucket(`${kind}:global`, limits.global, now);
  if (!global.allowed) return global;
  const identity = createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
  return consumeBucket(`${kind}:${identity}`, limits.identity, now);
}

export function consumeLoginAttempt(email, now = Date.now()) {
  return consumePublicAttempt("login", email, now);
}

export function rateLimitResponse(limit) {
  return Response.json({ success: false, error: { message: "Too many attempts. Try again later." } }, {
    status: 429, headers: { "Cache-Control": "no-store", "Retry-After": String(limit.retryAfter) },
  });
}
