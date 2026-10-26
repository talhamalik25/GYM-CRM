import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { isolatedTestUri } from "../tests/testDatabaseConfig.js";

const unitOnly = process.argv.includes("--unit");
const env = { ...process.env };
if (unitOnly) {
  delete env.MONGODB_TEST_URI;
  delete env.MONGODB_TEST_DISPOSABLE;
  delete env.MONGODB_URI;
} else {
  try {
    const configured = parseEnv(readFileSync(new URL("../.env.test.local", import.meta.url), "utf8"));
    for (const key of ["MONGODB_TEST_URI", "MONGODB_TEST_DISPOSABLE"]) env[key] ??= configured[key];
  } catch (error) {
    if (error.code !== "ENOENT") throw new Error("Test configuration could not be read safely.");
  }
  try {
    isolatedTestUri(env.MONGODB_TEST_URI, "preflight", { allowRemoteDisposable: env.MONGODB_TEST_DISPOSABLE === "YES" });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
if (!env.MONGODB_TEST_URI) console.warn("Database-backed integration suites are skipped; no isolated test database is configured for this run.");
const args = process.argv.slice(2).filter((arg) => arg !== "--unit");
const result = spawnSync(process.execPath, ["--test", ...args], { env, stdio: "inherit" });
if (result.error) console.error("The test process could not be started.");
process.exitCode = result.status ?? 1;
