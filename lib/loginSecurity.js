import { createHash } from "node:crypto";
import AuthRateLimit from "../models/AuthRateLimit.js";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 20;

// Shared across instances; no reliance on spoofable forwarded IP headers.
// Fixed windows bound account lockout. TTL is cleanup, not enforcement.
export async function consumeLoginAttempt(email, now = Date.now()) {
  const window = Math.floor(now / WINDOW_MS);
  const identity = createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
  const _id = `login:${identity}:${window}`;
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
  return { allowed: result.attempts <= MAX_ATTEMPTS, retryAfter: Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000)) };
}
