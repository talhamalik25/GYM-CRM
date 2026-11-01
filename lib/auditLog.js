import AuditLog from "../models/AuditLog.js";

// Call in the mutation's transaction. Do not copy personal data or passwords.
export async function writeAuditLog({ gymId, actorId, action, resourceId, changedFields = [], reason = "" }, session) {
  if (!gymId || !actorId) throw new Error("A trusted gym and actor are required for audit history.");
  return AuditLog.create([{ gymId, actorId, action, resourceId, changedFields, reason }], session ? { session } : undefined);
}
