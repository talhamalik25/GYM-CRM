import mongoose from "mongoose";
import { inspectBranchMigration, applyBranchMigration, rollbackBranchMigration } from "../lib/branchMigration.js";

// No fallback to MONGODB_URI and no implicit environment-file loading.
const uri = process.env.BRANCH_MIGRATION_URI;
const gymArgument = process.argv.find((arg) => arg.startsWith("--gym="))?.slice(6);
const apply = process.argv.includes("--apply");
const rollback = process.argv.includes("--rollback");
if (!uri || !mongoose.isObjectIdOrHexString(gymArgument)) throw new Error("Set BRANCH_MIGRATION_URI and pass --gym=<organization id>. Default mode is read-only validation.");
if (apply && rollback) throw new Error("Choose apply or rollback, not both.");
if ((apply || rollback) && (process.env.BRANCH_MIGRATION_APPROVED !== "YES" || process.env.BRANCH_MIGRATION_MAINTENANCE !== "YES" || !process.env.BRANCH_MIGRATION_BACKUP_REFERENCE)) throw new Error("Writes require explicit approval, maintenance mode, and a verified backup reference. See docs/saas-entitlements.md.");
const gymId = new mongoose.Types.ObjectId(gymArgument);
try {
  await mongoose.connect(uri, { autoIndex: false, autoCreate: false });
  const db = mongoose.connection.db;
  if (!await db.collection("gyms").findOne({ _id: gymId })) throw new Error("Organization not found.");
  if (!apply && !rollback) {
    const report = await inspectBranchMigration(db, gymId);
    const unscopedRecords = {};
    for (const collection of ["members", "trainers", "plans", "subscriptions", "payments", "attendances"]) unscopedRecords[collection] = await db.collection(collection).countDocuments({ gymId: null });
    console.log(JSON.stringify({ mode: "dry-run", gymId, unscopedRecords, counts: report.counts, issues: report.issues, valid: !report.issues.length }, null, 2));
    if (report.issues.length) process.exitCode = 1;
  } else {
    // Pre-create only the journal collection outside the transaction, if absent.
    if (!await db.listCollections({ name: "branchmigrationjournals" }).hasNext()) await db.createCollection("branchmigrationjournals");
    if (!await db.listCollections({ name: "branches" }).hasNext()) await db.createCollection("branches");
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await db.collection("gyms").updateOne({ _id: gymId }, { $inc: { capacityVersion: 1 } }, { session });
        const result = rollback ? await rollbackBranchMigration(db, gymId, session) : await applyBranchMigration(db, gymId, session);
        console.log(JSON.stringify({ mode: rollback ? "rollback" : "apply", gymId, result }));
      });
    } finally { await session.endSession(); }
  }
} finally { await mongoose.disconnect(); }
