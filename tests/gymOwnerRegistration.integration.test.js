import test from "node:test";
import assert from "node:assert/strict";
import { POST as registerOwner } from "../app/api/auth/register/route.js";

test("public owner registration is disabled until existing data and tenant isolation are verified", async () => {
  const response = await registerOwner(new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { origin: "http://localhost", "content-type": "application/json" },
    body: JSON.stringify({ fullName: "Owner Example", email: "owner@example.test", password: "long-enough-password", gymName: "Example Gym" }),
  }));
  assert.equal(response.status, 503);
  assert.match((await response.json()).error.message, /registration is paused/i);
});
