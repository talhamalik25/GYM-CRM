import { emitKeypressEvents } from "node:readline";
import nextEnv from "@next/env";
import connectToDatabase from "../lib/db.js";
import { hashPassword, validatePassword } from "../lib/passwords.js";
import User from "../models/User.js";

function readHidden(prompt) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
    throw new Error("Run this command in an interactive terminal so the password can be entered without echoing it.");
  }
  return new Promise((resolve, reject) => {
    let value = "";
    process.stdout.write(prompt);
    emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    const cleanup = () => {
      process.stdin.off("keypress", onKeypress);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
    };
    const onKeypress = (character, key = {}) => {
      if (key.ctrl && key.name === "c") {
        cleanup();
        reject(new Error("User creation cancelled."));
      } else if (key.name === "return" || key.name === "enter") {
        cleanup();
        resolve(value);
      } else if (key.name === "backspace") {
        value = value.slice(0, -1);
      } else if (!key.ctrl && !key.meta && character) {
        value += character;
      }
    };
    process.stdin.on("keypress", onKeypress);
  });
}

async function main() {
  nextEnv.loadEnvConfig(process.cwd());
  const emailArg = process.argv.find((arg) => arg.startsWith("--email="))?.slice("--email=".length)
    || (process.argv.includes("--email") ? process.argv[process.argv.indexOf("--email") + 1] : "");
  const email = emailArg.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new Error("Usage: npm run user:create -- --email user@example.com");
  }
  const password = await readHidden("New password (12+ characters): ");
  const passwordError = validatePassword(password);
  if (passwordError) throw new Error(passwordError);
  const confirm = await readHidden("Confirm password: ");
  if (password !== confirm) throw new Error("Passwords do not match.");

  await connectToDatabase();
  const firstAccount = (await User.countDocuments()) === 0;
  await User.create({ email, passwordHash: await hashPassword(password), role: firstAccount ? "superadmin" : "staff" });
  process.stdout.write(firstAccount ? "Initial superadmin created.\n" : "Staff user created.\n");
}

main().catch((error) => {
  if (error?.code === 11000) {
    process.stderr.write("A user with that email already exists.\n");
  } else {
    const safeMessages = new Set([
      "Run this command in an interactive terminal so the password can be entered without echoing it.",
      "User creation cancelled.",
      "Usage: npm run user:create -- --email user@example.com",
      "Passwords do not match.",
      "Password must be at least 12 characters and no more than 128 bytes.",
    ]);
    const message = safeMessages.has(error.message)
      ? error.message
      : error.message === "MONGODB_URI is missing. Add your MongoDB connection string to .env.local."
        ? "MONGODB_URI is missing. Add it to .env.local and retry."
        : error.code === "ETIMEDOUT" || error.code === "ETIMEOUT"
          ? "MongoDB connection timed out. Check Atlas network access, cluster status, and local network connectivity."
          : error.code === "ENOTFOUND"
            ? "MongoDB hostname could not be resolved. Check the URI hostname and DNS/network connectivity."
            : "User creation failed. Check configuration and database availability.";
    process.stderr.write(`${message}\n`);
  }
  process.exitCode = 1;
});
