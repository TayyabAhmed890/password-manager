const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";

function getEncryptionKey() {
  const key = process.env.VAULT_KEY;

  if (!key) {
    throw new Error("VAULT_KEY is not configured");
  }

  const bufferKey = Buffer.from(key, "hex");

  if (bufferKey.length !== 32) {
    throw new Error("VAULT_KEY must be exactly 32 bytes");
  }

  return bufferKey;
}

function encrypt(text) {
  if (typeof text !== "string") {
    throw new TypeError("Text to encrypt must be a string");
  }

  const key = getEncryptionKey();

  // GCM recommends a 12-byte IV
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(
    ALGORITHM,
    key,
    iv
  );

  let encrypted = cipher.update(text, "utf8", "hex");

  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
}

function decrypt(encrypted, iv, authTag) {
  if (
    typeof encrypted !== "string" ||
    typeof iv !== "string" ||
    typeof authTag !== "string"
  ) {
    throw new TypeError("Invalid encrypted data");
  }

  const key = getEncryptionKey();

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, "hex")
  );

  decipher.setAuthTag(
    Buffer.from(authTag, "hex")
  );

  let decrypted = decipher.update(
    encrypted,
    "hex",
    "utf8"
  );

  decrypted += decipher.final("utf8");

  return decrypted;
}

module.exports = {
  encrypt,
  decrypt,
};