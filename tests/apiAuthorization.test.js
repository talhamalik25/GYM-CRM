import test from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { existsSync, readdirSync } from "node:fs";
import { NextRequest } from "next/server.js";
import mongoose from "mongoose";

// Match Next's extensionless project imports while exercising actual handlers.
const projectUrl = new URL("../", import.meta.url).href;
registerHooks({ resolve(specifier, context, nextResolve) {
  if (context.parentURL?.startsWith(projectUrl) && !context.parentURL.includes("/node_modules/") && specifier.startsWith(".") && !/\.[a-z]+$/i.test(specifier)) {
    const candidate = new URL(`${specifier}.js`, context.parentURL);
    if (existsSync(candidate)) return nextResolve(candidate.href, context);
  }
  return nextResolve(specifier, context);
} });

test("every protected API handler rejects missing sessions before database access", async (t) => {
  const connect = t.mock.method(mongoose, "connect", () => { throw new Error("A guard attempted a database connection."); });
  const api = new URL("../app/api/", import.meta.url);
  let checked = 0;
  const publicRoutes = new Set(["auth/login/route.js", "auth/register/route.js", "auth/logout/route.js", "staff/invitations/accept/route.js", "cron/saas-expiry/route.js"]);
  for (const file of readdirSync(api, { recursive: true }).filter((file) => file.replaceAll("\\", "/").endsWith("/route.js"))) {
    const relative = file.replaceAll("\\", "/");
    if (publicRoutes.has(relative)) continue;
    const route = await import(new URL(relative, api));
    for (const method of ["GET", "POST", "PATCH", "PUT", "DELETE"]) {
      if (!route[method]) continue;
      const body = relative === "account/profile/route.js" ? { fullName: "Test Owner", phone: "" } : {};
      const request = new NextRequest(`http://localhost/api/${relative.replace("/route.js", "").replaceAll("[id]", "507f1f77bcf86cd799439011")}`, {
        method, headers: { origin: "http://localhost", "content-type": "application/json" },
        ...(method !== "GET" ? { body: JSON.stringify(body) } : {}),
      });
      const response = await route[method](request, { params: Promise.resolve({ id: "507f1f77bcf86cd799439011" }) });
      assert.equal(response.status, 401, `${method} ${relative}`);
      checked++;
    }
  }
  assert.ok(checked >= 50, `Expected the complete protected route inventory, checked ${checked}`);
  assert.equal(connect.mock.callCount(), 0);
  t.diagnostic(`Checked ${checked} protected HTTP handlers.`);
});
