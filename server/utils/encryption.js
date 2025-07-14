const crypto = require("crypto");

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  if (process.env.NODE_ENV === "development") {
    process.env.ENCRYPTION_KEY =
      "dGVzdC1lbmNyeXB0aW9uLWtleS1mb3ItZGV2ZWxvcG1lbnQ=";
  } else {
    throw new Error("ENCRYPTION_KEY environment variable is required");
  }
}

const keyBuffer = Buffer.from(ENCRYPTION_KEY, "base64");

if (keyBuffer.length !== 32) {
  throw new Error(
    "ENCRYPTION_KEY must be 32 bytes (256 bits) when base64 decoded"
  );
}

const ALGORITHM = "aes-256-cbc";

function encrypt(text) {
  try {
    if (!text) return null;

    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const result = iv.toString("hex") + ":" + encrypted;

    return Buffer.from(result).toString("base64");
  } catch (error) {
    throw new Error("Failed to encrypt API key");
  }
}

function decrypt(encryptedText) {
  try {
    if (!encryptedText) return null;

    const decoded = Buffer.from(encryptedText, "base64").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length !== 2) {
      throw new Error("Invalid encrypted text format");
    }

    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    throw new Error("Failed to decrypt API key");
  }
}

module.exports = {
  encrypt,
  decrypt,
};
