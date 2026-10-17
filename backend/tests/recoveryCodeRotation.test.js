const assert = require("assert");
const bcrypt = require("bcryptjs");
const User = require("../src/models/user.model");
const { forgotPassword } = require("../src/controllers/auth.controllers");
const { generateRecoveryCode } = require("../src/utils/recoveryCode");

// Helper to mock Express req and res
function createMockContext(body) {
  let statusCode = 200;
  let jsonResponse = null;
  const clearedCookies = [];

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
    clearCookie(name, options) {
      clearedCookies.push({ name, options });
      return this;
    },
  };

  return {
    req,
    res,
    getStatus: () => statusCode,
    getJson: () => jsonResponse,
    getClearedCookies: () => clearedCookies,
  };
}

async function runTests() {
  console.log("Starting Phase 1B Recovery-Code Rotation and Concurrency Tests...\n");
  let passedCount = 0;

  // Setup an in-memory mock database state for testing
  const { rawCode: initialRawCode, formattedCode: initialFormattedCode } = generateRecoveryCode();
  const initialRecoveryHash = await bcrypt.hash(initialRawCode, 10);
  const initialPasswordHash = await bcrypt.hash("OldMasterPassword123!", 10);

  let mockDbUser = {
    _id: "user_mock_id_999",
    email: "user@example.com",
    passwordHash: initialPasswordHash,
    recoveryCodeHash: initialRecoveryHash,
    tokenVersion: 1,
  };

  // Mock User.findOne
  User.findOne = async ({ email }) => {
    if (mockDbUser && mockDbUser.email === email) {
      return { ...mockDbUser };
    }
    return null;
  };

  // Mock User.findOneAndUpdate to accurately simulate atomic document locking
  User.findOneAndUpdate = async (filter, update) => {
    if (
      mockDbUser &&
      mockDbUser._id === filter._id &&
      mockDbUser.recoveryCodeHash === filter.recoveryCodeHash
    ) {
      // Apply updates
      if (update.$set) {
        mockDbUser.passwordHash = update.$set.passwordHash ?? mockDbUser.passwordHash;
        mockDbUser.recoveryCodeHash = update.$set.recoveryCodeHash ?? mockDbUser.recoveryCodeHash;
      }
      if (update.$inc && update.$inc.tokenVersion) {
        mockDbUser.tokenVersion += update.$inc.tokenVersion;
      }
      return { ...mockDbUser };
    }
    // Condition failed (stale recoveryCodeHash or already updated by concurrent request)
    return null;
  };

  // -------------------------------------------------------------
  // Test 1: Invalid Recovery Code is rejected
  // -------------------------------------------------------------
  {
    const wrongCode = "01234567-89ABCDEF-01234567-89ABCDEF";
    const ctx = createMockContext({
      email: "user@example.com",
      recoveryCode: wrongCode,
      newPassword: "NewValidPassword123!",
    });

    await forgotPassword(ctx.req, ctx.res);

    assert.strictEqual(ctx.getStatus(), 401);
    assert.strictEqual(ctx.getJson()?.message, "Invalid email or recovery code.");
    assert.strictEqual(mockDbUser.passwordHash, initialPasswordHash, "Password should not change on invalid code");
    assert.strictEqual(mockDbUser.recoveryCodeHash, initialRecoveryHash, "Recovery code should not change on invalid code");
    console.log("✔ Test 1 Passed: Invalid recovery code rejected with 401 and state remains unchanged.");
    passedCount++;
  }

  // -------------------------------------------------------------
  // Test 2: Successful reset rotates recovery code and returns new code
  // -------------------------------------------------------------
  let newFormattedCodeReceived = null;
  {
    const ctx = createMockContext({
      email: "user@example.com",
      recoveryCode: initialFormattedCode,
      newPassword: "NewMasterPassword123!",
    });

    await forgotPassword(ctx.req, ctx.res);

    assert.strictEqual(ctx.getStatus(), 200);
    const json = ctx.getJson();
    assert.strictEqual(json?.success, true);
    assert(json?.newRecoveryCode, "Response must include newRecoveryCode");
    assert(/^[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}$/.test(json.newRecoveryCode), "newRecoveryCode must be properly formatted");
    assert.notStrictEqual(json.newRecoveryCode, initialFormattedCode, "New recovery code must be different from old one");
    assert.notStrictEqual(mockDbUser.recoveryCodeHash, initialRecoveryHash, "DB recovery code hash must be rotated");
    assert.strictEqual(mockDbUser.tokenVersion, 2, "tokenVersion must be incremented to invalidate old sessions");
    assert.strictEqual(ctx.getClearedCookies()[0]?.name, "token", "Token cookie must be cleared on password reset");

    newFormattedCodeReceived = json.newRecoveryCode;
    console.log("✔ Test 2 Passed: Successful reset atomically rotated recovery code and returned new code.");
    passedCount++;
  }

  // -------------------------------------------------------------
  // Test 3: Old Recovery Code cannot be reused (Repeated Attempt)
  // -------------------------------------------------------------
  {
    const ctx = createMockContext({
      email: "user@example.com",
      recoveryCode: initialFormattedCode, // Attempting to use consumed code again
      newPassword: "AnotherPassword123!",
    });

    await forgotPassword(ctx.req, ctx.res);

    assert.strictEqual(ctx.getStatus(), 401);
    assert.strictEqual(ctx.getJson()?.message, "Invalid email or recovery code.");
    console.log("✔ Test 3 Passed: Old recovery code rejected on repeat attempt.");
    passedCount++;
  }

  // -------------------------------------------------------------
  // Test 4: Newly rotated recovery code works for the NEXT reset
  // -------------------------------------------------------------
  {
    const ctx = createMockContext({
      email: "user@example.com",
      recoveryCode: newFormattedCodeReceived, // Using the new recovery code
      newPassword: "SubsequentNewPassword123!",
    });

    await forgotPassword(ctx.req, ctx.res);

    assert.strictEqual(ctx.getStatus(), 200);
    assert.strictEqual(mockDbUser.tokenVersion, 3, "tokenVersion incremented again");
    console.log("✔ Test 4 Passed: Newly issued recovery code successfully verified on subsequent reset.");
    passedCount++;
  }

  // -------------------------------------------------------------
  // Test 5: Concurrent / Race-condition Attempt
  // -------------------------------------------------------------
  {
    // Setup another user state
    const { rawCode: raceRaw, formattedCode: raceFormatted } = generateRecoveryCode();
    const raceHash = await bcrypt.hash(raceRaw, 10);
    mockDbUser = {
      _id: "user_race_id",
      email: "race@example.com",
      passwordHash: await bcrypt.hash("InitialPass123!", 10),
      recoveryCodeHash: raceHash,
      tokenVersion: 1,
    };

    const ctx1 = createMockContext({
      email: "race@example.com",
      recoveryCode: raceFormatted,
      newPassword: "FirstWinningPassword123!",
    });

    const ctx2 = createMockContext({
      email: "race@example.com",
      recoveryCode: raceFormatted,
      newPassword: "SecondConflictingPassword123!",
    });

    // Run both concurrently
    const [res1, res2] = await Promise.all([
      forgotPassword(ctx1.req, ctx1.res),
      forgotPassword(ctx2.req, ctx2.res),
    ]);

    const statuses = [ctx1.getStatus(), ctx2.getStatus()].sort();
    // One must succeed (200) and the other must be rejected due to collision (409 Conflict)
    assert.strictEqual(statuses[0], 200, "One request must succeed");
    assert.strictEqual(statuses[1], 409, "Second concurrent request must fail with 409 Conflict");
    console.log("✔ Test 5 Passed: Concurrent reset attempts handled safely (1 succeeded with 200, 1 rejected with 409 Conflict).");
    passedCount++;
  }

  console.log(`\nAll ${passedCount} Phase 1B recovery-code tests completed successfully!`);
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
