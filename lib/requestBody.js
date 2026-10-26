export class RequestBodyError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

// Count the actual stream, even without Content-Length or with a forged value.
export async function readJsonBody(request, maxBytes = 16 * 1024) {
  if (Number(request.headers.get("content-length")) > maxBytes) throw new RequestBodyError("Request body is too large.", 413);
  if (!request.body) throw new RequestBodyError("Request body must be valid JSON.");
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        // Do not await cancel on a cloned/teed request body.
        void reader.cancel().catch(() => {});
        throw new RequestBodyError("Request body is too large.", 413);
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new RequestBodyError("Request body must be valid JSON."); }
}

export function requestBodyErrorResponse(error) {
  return Response.json({ success: false, error: { message: error.message } }, { status: error.status, headers: { "Cache-Control": "no-store" } });
}
