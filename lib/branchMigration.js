// Raw collections deliberately avoid schema defaults so absent vs null is preserved.
export const BRANCH_COLLECTIONS = Object.freeze(["members", "trainers", "plans", "subscriptions", "payments", "attendances", "gymmemberships", "staffinvitations"]);
const relations = { members: { planId: "plans", trainerId: "trainers" }, subscriptions: { memberId: "members", planId: "plans" }, payments: { memberId: "members", planId: "plans", subscriptionId: "subscriptions" }, attendances: { memberId: "members" } };

export async function inspectBranchMigration(db, gymId, { session } = {}) {
  const entries = [];
  const issues = [];
  for (const collection of BRANCH_COLLECTIONS) {
    const rows = await db.collection(collection).find({ gymId }, { session }).toArray();
    for (const row of rows) {
      const branchId = row.branchId || gymId;
      if (String(branchId) !== String(gymId) && !await db.collection("branches").findOne({ _id: branchId, gymId }, { session })) issues.push({ collection, id: String(row._id), issue: "Branch does not belong to this gym" });
      for (const [field, target] of Object.entries(relations[collection] || {})) {
        if (!row[field]) continue;
        const parent = await db.collection(target).findOne({ _id: row[field], gymId }, { session });
        if (!parent || String(parent.branchId || gymId) !== String(branchId)) issues.push({ collection, id: String(row._id), field, issue: "Missing or cross-branch relationship" });
      }
      if (row.branchId == null) entries.push({ collection, id: row._id, wasMissing: !Object.hasOwn(row, "branchId") });
    }
  }
  return { gymId, entries, issues, counts: Object.fromEntries(BRANCH_COLLECTIONS.map((name) => [name, entries.filter((entry) => entry.collection === name).length])) };
}

export async function applyBranchMigration(db, gymId, session) {
  if (!session?.inTransaction()) throw new Error("Migration requires a transaction.");
  const report = await inspectBranchMigration(db, gymId, { session });
  if (report.issues.length) throw new Error("Validation failed. Resolve the reported relationships before migrating.");
  const prior = await db.collection("branchmigrationjournals").findOne({ _id: gymId, status: "applied" }, { session });
  if (prior) throw new Error("This gym already has an applied migration; inspect its journal first.");
  const branch = await db.collection("branches").findOne({ _id: gymId }, { session });
  if (branch && String(branch.gymId) !== String(gymId)) throw new Error("Default branch identity collision.");
  if (!branch) await db.collection("branches").insertOne({ _id: gymId, gymId, name: "Main branch", address: "", isDefault: true, status: "active", createdAt: new Date(), updatedAt: new Date() }, { session });
  for (const entry of report.entries) {
    const updated = await db.collection(entry.collection).updateOne({ _id: entry.id, gymId, branchId: null }, { $set: { branchId: gymId } }, { session });
    if (updated.modifiedCount !== 1) throw new Error("Data changed during migration.");
  }
  await db.collection("branchmigrationjournals").replaceOne({ _id: gymId }, { _id: gymId, status: "applied", appliedAt: new Date(), entries: report.entries, createdDefaultBranch: !branch }, { upsert: true, session });
  return report.counts;
}

export async function rollbackBranchMigration(db, gymId, session) {
  if (!session?.inTransaction()) throw new Error("Rollback requires a transaction.");
  const journal = await db.collection("branchmigrationjournals").findOne({ _id: gymId, status: "applied" }, { session });
  if (!journal) throw new Error("No applied migration journal found.");
  for (const entry of journal.entries) {
    const restored = await db.collection(entry.collection).updateOne({ _id: entry.id, gymId, branchId: gymId }, entry.wasMissing ? { $unset: { branchId: 1 } } : { $set: { branchId: null } }, { session });
    if (restored.matchedCount !== 1) throw new Error("A migrated record moved or was deleted. Rollback requires manual review; nothing was restored.");
  }
  // Keep the harmless default branch: newer records may now reference it.
  await db.collection("branchmigrationjournals").updateOne({ _id: gymId }, { $set: { status: "rolled_back", rolledBackAt: new Date() } }, { session });
  return journal.entries.length;
}
