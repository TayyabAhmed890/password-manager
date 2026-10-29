const assert = require("assert");
const mongoose = require("mongoose");
const User = require("../src/models/user.model");
const VaultKey = require("../src/models/vaultKey.model");
const { register, forgotPassword } = require("../src/controllers/auth.controllers");
const { unwrapDek } = require("../src/utils/encryption");

// Disable Mongoose buffering so un-stubbed DB operations fail immediately without timeout
mongoose.set("bufferCommands", false);
process.env.VAULT_KEY = "a".repeat(64);

let createdVaultKey = null;
let transactionCount = 0;
let endSessionCount = 0;
let failVaultKeyCreate = false;
mongoose.startSession = async () => ({
  withTransaction: async (callback) => {
    transactionCount++;
    await callback();
  },
  endSession: async () => {
    endSessionCount++;
  },
});

// Stub User database methods for unit testing without MongoDB
User.findOne = async () => null;
User.create = async (documents, options) => {
  assert(Array.isArray(documents));
  assert(options.session);
  return documents.map((data) => ({
    _id: "670b00000000000000000001",
    email: data.email,
    role: "user",
    tokenVersion: 0,
  }));
};
VaultKey.create = async (documents, options) => {
  assert(Array.isArray(documents));
  assert(options.session);
  if (failVaultKeyCreate) {
    throw new Error("Simulated vault-key write failure.");
  }
  createdVaultKey = documents[0];
  return documents;
};

// Helper to mock Express req and res
function createMockContext(body) {
  let statusCode = 200;
  let jsonResponse = null;
  const cookies = [];

  const req = { body };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      jsonResponse = payload;
      return this;
    },
    set() {
      return this;
    },
    cookie(name, value, options) {
      cookies.push({ name, value, options });
      return this;
    },
  };

  return {
    req,
    res,
    getStatus: () => statusCode,
    getJson: () => jsonResponse,
    getCookies: () => cookies,
  };
}

async function runTests() {
  console.log("Starting Phase 1A Password Byte Length Validation Tests...\n");
  let passedCount = 0;

  // 1. Normal password (ASCII, between 8 and 72 bytes)
  {
    const ctx = createMockContext({
      email: "test@example.com",
      password: "StrongPassword123!",
    });
    await register(ctx.req, ctx.res);
    const json = ctx.getJson();
    assert(
      !(ctx.getStatus() === 400 && json?.message?.includes("72 bytes")),
      "Normal password should not trigger 72-byte limit"
    );
    assert.strictEqual(
      ctx.getCookies().length,
      0,
      "Registration must not set an authentication cookie."
    );
    assert.strictEqual(transactionCount, 1);
    assert.strictEqual(createdVaultKey.userId, "670b00000000000000000001");
    assert.strictEqual(createdVaultKey.keyVersion, 1);
    assert.strictEqual(createdVaultKey.dek, undefined);
    assert.strictEqual(
      unwrapDek(
        createdVaultKey.wrappedDek,
        createdVaultKey.iv,
        createdVaultKey.authTag
      ).length,
      32
    );
    console.log("✔ Test 1 Passed: Normal password (18 bytes) accepted by byte-length validator.");
    passedCount++;
  }

  // 2. Short password (< 8 chars)
  {
    const ctx = createMockContext({
      email: "test@example.com",
      password: "short",
    });
    await register(ctx.req, ctx.res);
    assert.strictEqual(ctx.getStatus(), 400);
    assert.strictEqual(ctx.getJson()?.message, "Password must be at least 8 characters long.");
    console.log("✔ Test 2 Passed: Short password (< 8 chars) rejected with 400.");
    passedCount++;
  }

  // 3. Exactly 72 UTF-8 bytes (ASCII 'a' * 72)
  {
    const exact72Ascii = "a".repeat(72);
    assert.strictEqual(Buffer.byteLength(exact72Ascii, "utf8"), 72);

    const ctx = createMockContext({
      email: "test@example.com",
      password: exact72Ascii,
    });
    await register(ctx.req, ctx.res);
    const json = ctx.getJson();
    assert(
      !(ctx.getStatus() === 400 && json?.message?.includes("72 bytes")),
      "Exactly 72-byte password should not trigger 72-byte limit"
    );
    console.log("✔ Test 3 Passed: Exactly 72-byte ASCII password accepted.");
    passedCount++;
  }

  // 4. More than 72 bytes (ASCII 'a' * 73)
  {
    const over72Ascii = "a".repeat(73);
    assert.strictEqual(Buffer.byteLength(over72Ascii, "utf8"), 73);

    const ctx = createMockContext({
      email: "test@example.com",
      password: over72Ascii,
    });
    await register(ctx.req, ctx.res);
    assert.strictEqual(ctx.getStatus(), 400);
    assert.strictEqual(ctx.getJson()?.message, "Password cannot exceed 72 bytes.");
    console.log("✔ Test 4 Passed: 73-byte ASCII password rejected with 400.");
    passedCount++;
  }

  // 5. Multi-byte Unicode: Exactly 72 bytes using 4-byte emojis (18 emojis * 4 bytes = 72 bytes)
  {
    const exact72Unicode = "🔐".repeat(18);
    assert.strictEqual(Buffer.byteLength(exact72Unicode, "utf8"), 72);

    const ctx = createMockContext({
      email: "test@example.com",
      password: exact72Unicode,
    });
    await register(ctx.req, ctx.res);
    const json = ctx.getJson();
    assert(
      !(ctx.getStatus() === 400 && json?.message?.includes("72 bytes")),
      "18 emojis (72 UTF-8 bytes) should not trigger 72-byte limit"
    );
    console.log("✔ Test 5 Passed: Multi-byte Unicode (18 emojis = exactly 72 UTF-8 bytes) accepted.");
    passedCount++;
  }

  // 6. Multi-byte Unicode: 19 emojis (19 emojis * 4 bytes = 76 bytes) -> Must be rejected!
  {
    const over72Unicode = "🔐".repeat(19);
    assert.strictEqual(Buffer.byteLength(over72Unicode, "utf8"), 76);

    const ctx = createMockContext({
      email: "test@example.com",
      password: over72Unicode,
    });
    await register(ctx.req, ctx.res);
    assert.strictEqual(ctx.getStatus(), 400);
    assert.strictEqual(ctx.getJson()?.message, "Password cannot exceed 72 bytes.");
    console.log("✔ Test 6 Passed: Multi-byte Unicode (19 emojis = 76 UTF-8 bytes) rejected with 400.");
    passedCount++;
  }

  // 7. Multi-byte Unicode 2-byte characters (Greek/Cyrillic 'ж'):
  // 36 characters * 2 bytes = 72 bytes (passes)
  // 37 characters * 2 bytes = 74 bytes (fails)
  {
    const exact72Cyrillic = "ж".repeat(36);
    assert.strictEqual(Buffer.byteLength(exact72Cyrillic, "utf8"), 72);
    const over72Cyrillic = "ж".repeat(37);
    assert.strictEqual(Buffer.byteLength(over72Cyrillic, "utf8"), 74);

    const ctxValid = createMockContext({ email: "test@example.com", password: exact72Cyrillic });
    await register(ctxValid.req, ctxValid.res);
    assert(!(ctxValid.getStatus() === 400 && ctxValid.getJson()?.message?.includes("72 bytes")));

    const ctxInvalid = createMockContext({ email: "test@example.com", password: over72Cyrillic });
    await register(ctxInvalid.req, ctxInvalid.res);
    assert.strictEqual(ctxInvalid.getStatus(), 400);
    assert.strictEqual(ctxInvalid.getJson()?.message, "Password cannot exceed 72 bytes.");
    console.log("✔ Test 7 Passed: 2-byte Unicode boundary verified (36 chars/72 bytes passed, 37 chars/74 bytes rejected).");
    passedCount++;
  }

  // 8. forgotPassword validation consistency: newPassword > 72 bytes (ASCII 'a' * 73)
  {
    const ctx = createMockContext({
      email: "test@example.com",
      recoveryCode: "A".repeat(32),
      newPassword: "a".repeat(73),
    });
    await forgotPassword(ctx.req, ctx.res);
    assert.strictEqual(ctx.getStatus(), 400);
    assert.strictEqual(ctx.getJson()?.message, "New password cannot exceed 72 bytes.");
    console.log("✔ Test 8 Passed: forgotPassword rejects > 72 bytes password with 400.");
    passedCount++;
  }

  // 9. forgotPassword validation consistency: newPassword multi-byte Unicode > 72 bytes
  {
    const ctx = createMockContext({
      email: "test@example.com",
      recoveryCode: "A".repeat(32),
      newPassword: "🔐".repeat(19), // 76 bytes
    });
    await forgotPassword(ctx.req, ctx.res);
    assert.strictEqual(ctx.getStatus(), 400);
    assert.strictEqual(ctx.getJson()?.message, "New password cannot exceed 72 bytes.");
    console.log("✔ Test 9 Passed: forgotPassword rejects multi-byte Unicode > 72 bytes with 400.");
    passedCount++;
  }

  // 10. forgotPassword validation consistency: newPassword exactly 72 bytes
  {
    const ctx = createMockContext({
      email: "test@example.com",
      recoveryCode: "A".repeat(32),
      newPassword: "a".repeat(72),
    });
    await forgotPassword(ctx.req, ctx.res);
    const json = ctx.getJson();
    assert(
      !(ctx.getStatus() === 400 && json?.message?.includes("72 bytes")),
      "forgotPassword should accept exactly 72 bytes"
    );
    console.log("✔ Test 10 Passed: forgotPassword accepts exactly 72-byte password.");
    passedCount++;
  }

  // 11. Registration reports a failed key write and always closes its session.
  {
    const previousEndSessionCount = endSessionCount;
    failVaultKeyCreate = true;
    const previousConsoleError = console.error;
    console.error = () => {};
    const ctx = createMockContext({
      email: "failed-key-write@example.com",
      password: "StrongPassword123!",
    });

    try {
      await register(ctx.req, ctx.res);
    } finally {
      console.error = previousConsoleError;
      failVaultKeyCreate = false;
    }

    assert.strictEqual(ctx.getStatus(), 500);
    assert.strictEqual(ctx.getJson()?.success, false);
    assert.strictEqual(ctx.getCookies().length, 0);
    assert.strictEqual(endSessionCount, previousEndSessionCount + 1);
    console.log("✔ Test 11 Passed: Failed vault-key write does not return success and closes the transaction session.");
    passedCount++;
  }

  console.log(`\nAll ${passedCount} tests completed successfully!`);
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
