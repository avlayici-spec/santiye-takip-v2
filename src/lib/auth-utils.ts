import crypto from "crypto";

/**
 * Hashes a plaintext password using Node.js built-in pbkdf2 algorithm.
 * Returns the hash in the format: salt:hash
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verifies a plaintext password against a stored hash value (format: salt:hash).
 */
export function verifyPassword(password: string, storedValue: string): boolean {
  // If the stored value doesn't contain a colon, it's plaintext (not hashed yet)
  if (!storedValue.includes(":")) {
    return password === storedValue;
  }
  
  const [salt, hash] = storedValue.split(":");
  if (!salt || !hash) return false;
  
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(verifyHash, "hex"));
  } catch (e) {
    return hash === verifyHash;
  }
}
