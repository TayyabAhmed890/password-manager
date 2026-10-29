const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";

function getMasterKey() {
  const key = process.env.VAULT_KEY;

  if (!key) {
    throw new Error("VAULT_KEY is not configured");
  }

  if (!/^[a-fA-F0-9]{64}$/.test(key)) {
    throw new Error("VAULT_KEY must be exactly 32 bytes encoded as hex");
  }

  const bufferKey = Buffer.from(key, "hex");

  if (bufferKey.length !== 32) {
    throw new Error("VAULT_KEY must be exactly 32 bytes");
  }

  return bufferKey;
}

function validateKey(key) {
  if (!Buffer.isBuffer(key) || key.length !== 32) {
    throw new TypeError("Encryption key must be exactly 32 bytes");
  }
}

function encrypt(text, key) {
  if (typeof text !== "string") {
    throw new TypeError("Text to encrypt must be a string");
  }

  validateKey(key);

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
}

function decrypt(encrypted, iv, authTag, key) {
  if (
    typeof encrypted !== "string" ||
    typeof iv !== "string" ||
    typeof authTag !== "string" ||
    !/^(?:[a-fA-F0-9]{2})*$/.test(encrypted) ||
    !/^[a-fA-F0-9]{24}$/.test(iv) ||
    !/^[a-fA-F0-9]{32}$/.test(authTag)
  ) {
    throw new TypeError("Invalid encrypted data");
  }

  validateKey(key);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, "hex"));
  decipher.setAuthTag(Buffer.from(authTag, "hex"));
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

function wrapDek(dek) {
  validateKey(dek);
  return encrypt(dek.toString("hex"), getMasterKey());
}

function unwrapDek(wrappedDek, iv, authTag) {
  const dekHex = decrypt(wrappedDek, iv, authTag, getMasterKey());

  if (!/^[a-fA-F0-9]{64}$/.test(dekHex)) {
    throw new Error("Wrapped vault key has an invalid format");
  }

  return Buffer.from(dekHex, "hex");
}

module.exports = {
  encrypt,
  decrypt,
  getMasterKey,
  wrapDek,
  unwrapDek,
};