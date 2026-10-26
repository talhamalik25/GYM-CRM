import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";

const TEST_DATABASE_MARKER = /(^|[-_])(test|testing|disposable)([-_]|$)/i;
const loopbackHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const normalizedHost = (host) => loopbackHosts.has(host.toLowerCase()) ? "loopback" : host.toLowerCase();

// Inspect only for comparison; never load application credentials into tests.
export function applicationDatabaseUris() {
  const uris = [process.env.MONGODB_URI];
  for (const file of [".env", ".env.local", ".env.production", ".env.production.local", ".env.development", ".env.development.local"]) {
    try {
      uris.push(parseEnv(readFileSync(new URL(`../${file}`, import.meta.url), "utf8")).MONGODB_URI);
    } catch (error) {
      if (error.code !== "ENOENT") throw new Error("Application database configuration could not be checked safely.");
    }
  }
  return uris.filter(Boolean);
}

/**
 * Return a per-run database URI only for a clearly named disposable test DB.
 * Local loopback servers are allowed by default; remote servers require an
 * explicit MONGODB_TEST_DISPOSABLE=YES acknowledgement in the test process.
 */
export function isolatedTestUri(configuredUri, suiteName, {
  allowRemoteDisposable = process.env.MONGODB_TEST_DISPOSABLE === "YES",
  processId = process.pid,
  runId = randomUUID(),
  applicationUris = applicationDatabaseUris(),
} = {}) {
  if (!configuredUri) return null;

  let uri;
  try {
    uri = new URL(configuredUri);
  } catch {
    throw new Error("MONGODB_TEST_URI must be a valid MongoDB URI.");
  }

  if (!["mongodb:", "mongodb+srv:"].includes(uri.protocol)) {
    throw new Error("MONGODB_TEST_URI must use mongodb:// or mongodb+srv://.");
  }

  for (const applicationUri of applicationUris) {
    let application;
    try { application = new URL(applicationUri); }
    catch { throw new Error("Application database configuration could not be checked safely."); }
    // A different database name on the same server is not an isolated deployment.
    const sameServer = normalizedHost(application.hostname) === normalizedHost(uri.hostname)
      && (application.port || "27017") === (uri.port || "27017");
    const reusedCredentials = uri.username && uri.password
      && decodeURIComponent(uri.username) === decodeURIComponent(application.username)
      && decodeURIComponent(uri.password) === decodeURIComponent(application.password);
    if (sameServer || reusedCredentials) {
      throw new Error("Test database refused: application database host or credentials are reused. Configure an independently verified isolated test deployment and separate credentials.");
    }
  }

  const sourceDatabase = decodeURIComponent(uri.pathname.slice(1));
  if (!sourceDatabase || !TEST_DATABASE_MARKER.test(sourceDatabase)) {
    throw new Error("MONGODB_TEST_URI must name a database containing a test, testing, or disposable marker.");
  }

  if (!/^[a-z][a-z0-9_]*$/i.test(suiteName)) {
    throw new Error("Integration test suite name is invalid.");
  }

  const host = uri.hostname.toLowerCase();
  const isLoopback = loopbackHosts.has(host);
  if (!isLoopback && !allowRemoteDisposable) {
    throw new Error("Remote MONGODB_TEST_URI refused; explicitly designate the remote deployment as disposable with MONGODB_TEST_DISPOSABLE=YES.");
  }

  const uniqueSuffix = createHash("sha256")
    .update(`${suiteName}:${processId}:${runId}`)
    .digest("hex")
    .slice(0, 32);
  uri.pathname = `/test_${uniqueSuffix}`;
  return uri.toString();
}
