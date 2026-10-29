const validateEnv = (env = process.env) => {
  const getClientOrigins = require("./clientOrigins");
  const errors = [];
  const mongoUri = env.MONGODB_URI || env.MONGO_URI;

  if (!mongoUri) {
    errors.push("MONGODB_URI or MONGO_URI is required.");
  } else if (
    !mongoUri.startsWith("mongodb://") &&
    !mongoUri.startsWith("mongodb+srv://")
  ) {
    errors.push("MONGODB_URI must use mongodb:// or mongodb+srv://.");
  }

  if (!env.JWT_SECRET) {
    errors.push("JWT_SECRET is required.");
  } else if (Buffer.byteLength(env.JWT_SECRET, "utf8") < 32) {
    errors.push("JWT_SECRET must be at least 32 bytes.");
  }

  if (!env.VAULT_KEY) {
    errors.push("VAULT_KEY is required.");
  } else if (!/^[a-fA-F0-9]{64}$/.test(env.VAULT_KEY)) {
    errors.push("VAULT_KEY must be exactly 64 hexadecimal characters.");
  }

  if (env.PORT !== undefined) {
    const port = Number(env.PORT);

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      errors.push("PORT must be an integer between 1 and 65535.");
    }
  }

  if (env.NODE_ENV === "production") {
    if (!env.CLIENT_URL) {
      errors.push("CLIENT_URL is required in production.");
    } else {
      try {
        getClientOrigins(env);
      } catch {
        errors.push("CLIENT_URL must contain valid HTTP(S) origins without paths.");
      }
    }

    if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
      errors.push(
        "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production."
      );
    }

    if (
      env.UPSTASH_REDIS_REST_URL &&
      !env.UPSTASH_REDIS_REST_URL.startsWith("https://")
    ) {
      errors.push("UPSTASH_REDIS_REST_URL must use HTTPS.");
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid application configuration: ${errors.join(" ")}`);
  }
};

module.exports = validateEnv;
