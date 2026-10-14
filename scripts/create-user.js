import { emitKeypressEvents } from "node:readline";
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
  await User.create({ email, passwordHash: await hashPassword(password) });
  process.stdout.write("User created.\n");
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
    process.stderr.write(`${safeMessages.has(error.message) ? error.message : "User creation failed. Check configuration and database availability."}\n`);
  }
  process.exitCode = 1;
});
