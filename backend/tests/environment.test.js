const assert = require("assert");
const validateEnv = require("../src/config/validateEnv");

const validEnv = {
  MONGODB_URI: "mongodb+srv://example.invalid/password-manager",
  JWT_SECRET: "a".repeat(32),
  VAULT_KEY: "a".repeat(64),
  PORT: "7000",
};

async function runTests() {
  validateEnv(validEnv);
  console.log("✔ Test 1 Passed: Valid environment configuration is accepted.");

  assert.throws(
    () => validateEnv({}),
    (error) => {
      assert.match(error.message, /MONGODB_URI or MONGO_URI is required/);
      assert.match(error.message, /JWT_SECRET is required/);
      assert.match(error.message, /VAULT_KEY is required/);
      return true;
    }
  );
  console.log("✔ Test 2 Passed: Missing required variables are reported.");

  assert.throws(
    () => validateEnv({ ...validEnv, MONGODB_URI: "https://example.invalid/database" }),
    /MONGODB_URI must use mongodb:\/\//
  );
  validateEnv({
    MONGO_URI: validEnv.MONGODB_URI,
    JWT_SECRET: validEnv.JWT_SECRET,
    VAULT_KEY: validEnv.VAULT_KEY,
  });
  console.log("✔ Test 3 Passed: MONGO_URI alias works and malformed URI schemes are rejected.");

  assert.throws(
    () => validateEnv({ ...validEnv, JWT_SECRET: "short" }),
    /JWT_SECRET must be at least 32 bytes/
  );
  assert.throws(
    () => validateEnv({ ...validEnv, VAULT_KEY: "not-a-valid-key" }),
    /VAULT_KEY must be exactly 64 hexadecimal characters/
  );
  assert.throws(
    () => validateEnv({ ...validEnv, PORT: "70000" }),
    /PORT must be an integer between 1 and 65535/
  );
  assert.throws(
    () => validateEnv({ ...validEnv, NODE_ENV: "production" }),
    /UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production/
  );
  assert.throws(
    () => validateEnv({
      ...validEnv,
      NODE_ENV: "production",
      UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "non-secret-test-token",
      CLIENT_URL: "https://frontend.example.com",
      ADMIN_URL: "https://admin.example.com/dashboard",
    }),
    /CLIENT_URL and ADMIN_URL must contain valid HTTP\(S\) origins without paths/
  );
  validateEnv({
    ...validEnv,
    NODE_ENV: "production",
    CLIENT_URL: "https://frontend.example.com",
    ADMIN_URL: "https://admin.example.com",
    UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
    UPSTASH_REDIS_REST_TOKEN: "non-secret-test-token",
  });
  assert.throws(
    () => validateEnv({
      ...validEnv,
      NODE_ENV: "production",
      CLIENT_URL: "https://same.example.com",
      ADMIN_URL: "https://same.example.com/",
      UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "non-secret-test-token",
    }),
    /CLIENT_URL and ADMIN_URL must use different origins/
  );
  console.log("✔ Test 4 Passed: Invalid secret formats and port values are rejected.");

  const secret = "sensitive-test-secret-value";
  assert.throws(
    () => validateEnv({ ...validEnv, JWT_SECRET: secret }),
    (error) => !error.message.includes(secret)
  );
  console.log("✔ Test 5 Passed: Validation errors do not include secret values.");
}

runTests().catch((error) => {
  console.error("Environment validation test failed:", error);
  process.exitCode = 1;
});
