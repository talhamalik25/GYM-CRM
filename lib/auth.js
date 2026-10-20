import { createHmac, randomBytes } from "node:crypto";
import { cookies } from "next/headers.js";
import { NextResponse } from "next/server.js";
import connectToDatabase from "./db.js";
import AuthSession from "../models/AuthSession.js";
import User from "../models/User.js";
import { scopedTenantFilter } from "./tenantQuery.js";
import { isSuperadmin } from "./adminUserRules.js";

export { scopedTenantFilter } from "./tenantQuery.js";

const tenantContexts = new WeakMap();

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const COOKIE_NAME = process.env.NODE_ENV === "production" ? "__Host-fitivo_session" : "fitivo_session";

function sessionSecret() {
  const value = process.env.AUTH_SESSION_SECRET;
  if (!value || Buffer.byteLength(value, "utf8") < 32) throw new Error("Authentication is not configured.");
  return value;
}

function hashToken(token) {
  return createHmac("sha256", sessionSecret()).update(token).digest("hex");
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export function clearSessionCookie(response) {
  response.cookies.set(COOKIE_NAME, "", { ...cookieOptions(), maxAge: 0, expires: new Date(0) });
  return response;
}

function unauthorized() {
  return NextResponse.json({ success: false, error: { message: "Authentication is required." } }, {
    status: 401,
    headers: { "Cache-Control": "no-store" },
  });
}

function unavailable() {
  return NextResponse.json({ success: false, error: { message: "Authentication service is temporarily unavailable." } }, {
    status: 503,
    headers: { "Cache-Control": "no-store" },
  });
}

function originError(request) {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  try {
    if (new URL(origin).origin !== new URL(request.url).origin) {
      return NextResponse.json({ success: false, error: { message: "Request origin is not allowed." } }, {
        status: 403,
        headers: { "Cache-Control": "no-store" },
      });
    }
  } catch {
    return NextResponse.json({ success: false, error: { message: "Request origin is not allowed." } }, { status: 403 });
  }
  return null;
}

async function findUserForToken(token) {
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return null;
  await connectToDatabase();
  const session = await AuthSession.findOne({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() } }).select("userId").lean();
  if (!session) return null;
  return User.findOne({ _id: session.userId, isActive: true }).select("_id email role").lean();
}

export async function getUserFromToken(token) {
  try {
    return token ? await findUserForToken(token) : null;
  } catch {
    console.error("Authentication session lookup failed.");
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  return getUserFromToken(cookieStore.get(COOKIE_NAME)?.value || "");
}

export async function getAuthenticatedUserFromRequest(request) {
  const token = request.cookies?.get(COOKIE_NAME)?.value || "";
  return token ? getUserFromToken(token) : null;
}

export async function requireApiUser(request, { allowedRoles = ["gym_owner", "gym_admin"], allowSaaSInactive = false, allowSuspendedGym = false } = {}) {
  const authResponse = await authorizeApiUser(request);
  if (authResponse) return authResponse;
  try {
    const { resolveTenantContext } = await import("./tenantContext.js");
    const result = await resolveTenantContext(request, { allowedRoles, allowSaaSInactive, allowSuspendedGym });
    if (result.error) return result.error;
    tenantContexts.set(request, result.context);
    return null;
  } catch {
    return unavailable();
  }
}

export function getRequestTenantContext(request) {
  return tenantContexts.get(request) || null;
}

export function getRequestGymId(request) {
  const context = getRequestTenantContext(request);
  if (!context?.gymId) throw new Error("A trusted gym context is required for this operation.");
  return context.gymId;
}

export function tenantFilter(request, filter = {}) {
  return scopedTenantFilter(getRequestGymId(request), filter);
}

export async function requireSuperadminUser(request) {
  return authorizeApiUser(request, "superadmin");
}

function forbidden() {
  return NextResponse.json({ success: false, error: { message: "You do not have permission to manage user accounts." } }, {
    status: 403,
    headers: { "Cache-Control": "no-store" },
  });
}

async function authorizeApiUser(request, requiredRole = "") {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    const rejectedOrigin = originError(request);
    if (rejectedOrigin) return rejectedOrigin;
  }
  const token = request.cookies?.get(COOKIE_NAME)?.value || "";
  try {
    if (!token) return unauthorized();
    const user = await findUserForToken(token);
    if (!user) return unauthorized();
    if (requiredRole === "superadmin" && isSuperadmin(user)) return null;
    if (requiredRole && user.role !== requiredRole) return forbidden();
    return null;
  } catch {
    console.error("Authentication API check failed.");
    return unavailable();
  }
}

export async function createSession(userId, { session } = {}) {
  if (!session) await connectToDatabase();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  await AuthSession.create([{ userId, tokenHash: hashToken(token), expiresAt }], session ? { session } : undefined);
  const response = NextResponse.json({ success: true, data: { redirectTo: "/dashboard" } }, {
    headers: { "Cache-Control": "no-store" },
  });
  response.cookies.set(COOKIE_NAME, token, cookieOptions());
  return response;
}

export async function revokeSession(request) {
  const token = request.cookies?.get(COOKIE_NAME)?.value || "";
  if (!token) return;
  await connectToDatabase();
  await AuthSession.deleteOne({ tokenHash: hashToken(token) });
}

export function validateRequestOrigin(request) {
  return originError(request);
}
