import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

const SCRYPT_N = 32768;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const MAXMEM = 64 * 1024 * 1024;
// A valid fixed-format hash makes missing/inactive account failures do the same
// scrypt work. This is not an account credential and can never grant a session.
export const DUMMY_PASSWORD_HASH = `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${Buffer.alloc(16, 1).toString("base64url")}$${Buffer.alloc(KEY_LENGTH, 1).toString("base64url")}`;

function scrypt(password, salt, length, options) {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, length, options, (error, key) => error ? reject(error) : resolve(key));
  });
}

export function validatePassword(password) {
  if (typeof password !== "string" || password.length < 12 || Buffer.byteLength(password, "utf8") > 128) {
    return "Password must be at least 12 characters and no more than 128 bytes.";
  }
  return null;
}

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, KEY_LENGTH, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: MAXMEM });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyPassword(password, encoded) {
  if (typeof password !== "string" || Buffer.byteLength(password, "utf8") > 128 || typeof encoded !== "string") return false;
  const [algorithm, nText, rText, pText, saltText, keyText, extra] = encoded.split("$");
  const n = Number(nText);
  const r = Number(rText);
  const p = Number(pText);
  if (algorithm !== "scrypt" || extra !== undefined || n !== SCRYPT_N || r !== SCRYPT_R || p !== SCRYPT_P || !saltText || !keyText) return false;
  try {
    const salt = Buffer.from(saltText, "base64url");
    const expected = Buffer.from(keyText, "base64url");
    if (salt.length !== 16 || expected.length !== KEY_LENGTH) return false;
    const actual = await scrypt(password, salt, KEY_LENGTH, { N: n, r, p, maxmem: MAXMEM });
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
