import test from "node:test";
import assert from "node:assert/strict";
import { GET, PATCH } from "../app/api/account/locale/route.js";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

test("account language preference endpoints require an authenticated account", async () => {
  const getResponse = await GET(new Request("http://localhost/api/account/locale"));
  const patchResponse = await PATCH(new Request("http://localhost/api/account/locale", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ locale: "en-US" }),
  }));
  assert.equal(getResponse.status, 401);
  assert.equal(patchResponse.status, 401);
});

test("account language preference cannot accept client-controlled identity or incomplete locales", async () => {
  const source = await readFile(fileURLToPath(new URL("../app/api/account/locale/route.js", import.meta.url)), "utf8");
  assert.match(source, /getAuthenticatedUserFromRequest\(request\)/);
  assert.match(source, /isAvailableLocale\(body\.locale\)/);
  assert.doesNotMatch(source, /body\.userId|body\.gymId|searchParams\.get\("userId"\)/);
});
