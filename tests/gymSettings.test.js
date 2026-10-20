import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { GET, PATCH } from "../app/api/gym/settings/route.js";
import { serializeGymSettings, validateGymSettings } from "../lib/gymSettingsRules.js";

test("Gym settings accept only a normalized name and real IANA timezone", () => {
  assert.deepEqual(validateGymSettings({ name: "  Fitivo North  ", timezone: "Asia/Karachi" }), { name: "Fitivo North", timezone: "Asia/Karachi" });
  assert.equal(validateGymSettings({ name: "A", timezone: "Asia/Karachi" }).fields.name, "Gym name must be between 2 and 120 characters.");
  assert.equal(validateGymSettings({ name: "Fitivo", timezone: "Not/A_Zone" }).fields.timezone, "Enter a valid IANA timezone.");
  assert.equal(validateGymSettings({ name: "Fitivo", timezone: "UTC", slug: "forged" }).fields.slug, "This field cannot be changed.");
  assert.ok(validateGymSettings([]).message);
});

test("Gym settings serialization returns only supported public workspace fields", () => {
  const result = serializeGymSettings({ name: "Fitivo", slug: "fitivo", timezone: "UTC", status: "active", ownerEmail: "private@example.test", secret: "private" });
  assert.deepEqual(result, { name: "Fitivo", slug: "fitivo", timezone: "UTC", status: "active" });
  assert.equal(JSON.stringify(result).includes("private"), false);
});

test("Gym settings endpoints require a trusted owner context and ignore client gym ids", async () => {
  const getResponse = await GET(new Request("http://localhost/api/gym/settings"));
  const patchResponse = await PATCH(new Request("http://localhost/api/gym/settings", {
    method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "Gym", timezone: "UTC", gymId: "forged" }),
  }));
  assert.equal(getResponse.status, 401);
  assert.equal(patchResponse.status, 401);
  const source = await readFile(fileURLToPath(new URL("../app/api/gym/settings/route.js", import.meta.url)), "utf8");
  assert.equal((source.match(/allowedRoles: \["gym_owner"\]/g) || []).length, 2);
  assert.match(source, /getRequestGymId\(request\)/);
  assert.doesNotMatch(source, /body\.gymId|searchParams\.get\("gymId"\)/);
});
