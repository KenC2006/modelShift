const crypto = require("crypto");

// Get encryption key from environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error("ENCRYPTION_KEY environment variable is required");
}

// Convert base64 key to buffer
const keyBuffer = Buffer.from(ENCRYPTION_KEY, "base64");

// Validate key length (should be 32 bytes for AES-256)
if (keyBuffer.length !== 32) {
  throw new Error(
    "ENCRYPTION_KEY must be 32 bytes (256 bits) when base64 decoded"
  );
}

const ALGORITHM = "aes-256-cbc";

/**
 * Encrypt a string using AES-256-CBC
 * @param {string} text - The text to encrypt
 * @returns {string} - Base64 encoded encrypted string
 */
function encrypt(text) {
  try {
    if (!text) return null;

    // Generate a random IV
    const iv = crypto.randomBytes(16);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

    // Encrypt the text
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Combine IV and encrypted data
    const result = iv.toString("hex") + ":" + encrypted;

    // Return base64 encoded result
    return Buffer.from(result).toString("base64");
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt API key");
  }
}

/**
 * Decrypt a string using AES-256-CBC
 * @param {string} encryptedText - The base64 encoded encrypted text
 * @returns {string} - The decrypted text
 */
function decrypt(encryptedText) {
  try {
    if (!encryptedText) return null;

    // Decode from base64
    const decoded = Buffer.from(encryptedText, "base64").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length !== 2) {
      throw new Error("Invalid encrypted text format");
    }

    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);

    // Decrypt the text
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt API key");
  }
}

module.exports = {
  encrypt,
  decrypt,
};
