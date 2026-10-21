import { createHash, randomUUID } from "node:crypto";

const TEST_DATABASE_MARKER = /(^|[-_])(test|testing|disposable)([-_]|$)/i;

/**
 * Return a per-run database URI only for a clearly named disposable test DB.
 * Local loopback servers are allowed by default; remote servers require an
 * explicit MONGODB_TEST_DISPOSABLE=YES acknowledgement in the test process.
 */
export function isolatedTestUri(configuredUri, suiteName, {
  allowRemoteDisposable = process.env.MONGODB_TEST_DISPOSABLE === "YES",
  processId = process.pid,
  runId = randomUUID(),
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

  const sourceDatabase = decodeURIComponent(uri.pathname.slice(1));
  if (!sourceDatabase || !TEST_DATABASE_MARKER.test(sourceDatabase)) {
    throw new Error("MONGODB_TEST_URI must name a database containing a test, testing, or disposable marker.");
  }

  if (!/^[a-z][a-z0-9_]*$/i.test(suiteName)) {
    throw new Error("Integration test suite name is invalid.");
  }

  const host = uri.hostname.toLowerCase();
  const isLoopback = host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";
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
