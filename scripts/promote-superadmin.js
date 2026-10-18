import nextEnv from "@next/env";
import connectToDatabase from "../lib/db.js";
import User from "../models/User.js";

async function main() {
  nextEnv.loadEnvConfig(process.cwd());
  const emailArg = process.argv.find((arg) => arg.startsWith("--email="))?.slice("--email=".length)
    || (process.argv.includes("--email") ? process.argv[process.argv.indexOf("--email") + 1] : "");
  const email = emailArg.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new Error("Usage: npm run user:promote -- --email user@example.com");
  }

  await connectToDatabase();
  const user = await User.findOne({ email, isActive: true });
  if (!user) throw new Error("No active account with that email exists.");
  if (user.role === "superadmin") {
    process.stdout.write("This account is already a superadmin.\n");
    return;
  }
  if (await User.exists({ role: "superadmin" })) {
    throw new Error("A superadmin already exists. Ask that superadmin to manage accounts.");
  }
  user.role = "superadmin";
  await user.save();
  process.stdout.write("Superadmin access granted.\n");
}

main().catch((error) => {
  const safeMessages = new Set([
    "Usage: npm run user:promote -- --email user@example.com",
    "No active account with that email exists.",
    "A superadmin already exists. Ask that superadmin to manage accounts.",
  ]);
  const message = safeMessages.has(error.message)
    ? error.message
    : error.message === "MONGODB_URI is missing. Add your MongoDB connection string to .env.local."
      ? "MONGODB_URI is missing. Add it to .env.local and retry."
      : error.code === "ETIMEDOUT" || error.code === "ETIMEOUT"
        ? "MongoDB connection timed out. Check Atlas network access, cluster status, and local network connectivity."
        : error.code === "ENOTFOUND"
          ? "MongoDB hostname could not be resolved. Check the URI hostname and DNS/network connectivity."
          : "Could not promote the account. Check configuration and database availability.";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}).finally(async () => {
  const mongoose = await import("mongoose");
  await mongoose.default.disconnect().catch(() => {});
});
