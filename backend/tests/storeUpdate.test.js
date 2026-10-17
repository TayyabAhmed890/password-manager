const assert = require("assert");
const mongoose = require("mongoose");
process.env.VAULT_KEY = process.env.VAULT_KEY || "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const Password = require("../src/models/store.model");
const { updatePassword } = require("../src/controllers/store.controllers");
const { encrypt, decrypt } = require("../src/utils/encryption");

// Helper to mock Express req and res
function createMockContext(params, body, user) {
  let statusCode = 200;
  let jsonResponse = null;

  const req = {
    params,
    body,
    user: user || { id: "670b00000000000000000001", role: "user" },
  };

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      jsonResponse = payload;
      return this;
    },
  };

  return {
    req,
    res,
    getStatus: () => statusCode,
    getJson: () => jsonResponse,
  };
}

async function runTests() {
  console.log("Starting Phase 2A Vault Record Update Tests...\n");
  let passedCount = 0;

  const userAId = new mongoose.Types.ObjectId().toString();
  const userBId = new mongoose.Types.ObjectId().toString();
  const recordId = new mongoose.Types.ObjectId().toString();

  const originalPass = "OldVaultPassword@123";
  const initialEnc = encrypt(originalPass);

  // In-memory mock document
  let mockRecord = {
    _id: recordId,
    userId: userAId,
    website: "github.com",
    email: "usera@example.com",
    encryptedPassword: initialEnc.encrypted,
    iv: initialEnc.iv,
    authTag: initialEnc.authTag,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    async save() {
      this.updatedAt = new Date();
      return this;
    },
  };

  // Mock Password.findOne
  Password.findOne = async (filter) => {
    if (
      mockRecord &&
      filter._id === mockRecord._id &&
      filter.userId === mockRecord.userId
    ) {
      return mockRecord;
    }
    return null;
  };

  // -------------------------------------------------------------
  // Test 1: Invalid ObjectId is rejected
  // -------------------------------------------------------------
  {
    const ctx = createMockContext({ id: "invalid-mongo-id" }, { website: "google.com" }, { id: userAId });
    await updatePassword(ctx.req, ctx.res);
    assert.strictEqual(ctx.getStatus(), 400);
    assert.strictEqual(ctx.getJson()?.message, "Invalid password record ID.");
    console.log("✔ Test 1 Passed: Invalid ObjectId returns 400.");
    passedCount++;
  }

  // -------------------------------------------------------------
  // Test 2: Missing update fields (empty body) is rejected
  // -------------------------------------------------------------
  {
    const ctx = createMockContext({ id: recordId }, {}, { id: userAId });
    await updatePassword(ctx.req, ctx.res);
    assert.strictEqual(ctx.getStatus(), 400);
    assert.strictEqual(ctx.getJson()?.message, "Provide at least one field to update.");
    console.log("✔ Test 2 Passed: Empty update payload returns 400.");
    passedCount++;
  }

  // -------------------------------------------------------------
  // Test 3: Input validation (empty website, malformed email, empty password)
  // -------------------------------------------------------------
  {
    // Empty website
    const ctx1 = createMockContext({ id: recordId }, { website: "   " }, { id: userAId });
    await updatePassword(ctx1.req, ctx1.res);
    assert.strictEqual(ctx1.getStatus(), 400);
    assert.strictEqual(ctx1.getJson()?.message, "Website name cannot be empty.");

    // Malformed email
    const ctx2 = createMockContext({ id: recordId }, { email: "not-an-email" }, { id: userAId });
    await updatePassword(ctx2.req, ctx2.res);
    assert.strictEqual(ctx2.getStatus(), 400);
    assert.strictEqual(ctx2.getJson()?.message, "Please provide a valid email address.");

    // Empty password
    const ctx3 = createMockContext({ id: recordId }, { password: "" }, { id: userAId });
    await updatePassword(ctx3.req, ctx3.res);
    assert.strictEqual(ctx3.getStatus(), 400);
    assert.strictEqual(ctx3.getJson()?.message, "Password cannot be empty.");

    console.log("✔ Test 3 Passed: Input validation prevents empty website, invalid email, and empty password.");
    passedCount++;
  }

  // -------------------------------------------------------------
  // Test 4: Record not found (non-existent ID)
  // -------------------------------------------------------------
  {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const ctx = createMockContext({ id: nonExistentId }, { website: "gitlab.com" }, { id: userAId });
    await updatePassword(ctx.req, ctx.res);
    assert.strictEqual(ctx.getStatus(), 404);
    assert.strictEqual(ctx.getJson()?.message, "Password record not found.");
    console.log("✔ Test 4 Passed: Non-existent ID returns 404.");
    passedCount++;
  }

  // -------------------------------------------------------------
  // Test 5: IDOR Protection (User B cannot update User A's record)
  // -------------------------------------------------------------
  {
    const ctx = createMockContext({ id: recordId }, { website: "hacked.com" }, { id: userBId }); // User B logged in
    await updatePassword(ctx.req, ctx.res);
    assert.strictEqual(ctx.getStatus(), 404);
    assert.strictEqual(ctx.getJson()?.message, "Password record not found.");
    assert.strictEqual(mockRecord.website, "github.com", "Record must remain unmodified by unauthorized user");
    console.log("✔ Test 5 Passed: IDOR protection verified (User B cannot update User A's record).");
    passedCount++;
  }

  // -------------------------------------------------------------
  // Test 6: Successful update of website and email
  // -------------------------------------------------------------
  {
    const ctx = createMockContext(
      { id: recordId },
      { website: "newgithub.com", email: "NewUserA@example.com" },
      { id: userAId }
    );
    await updatePassword(ctx.req, ctx.res);
    assert.strictEqual(ctx.getStatus(), 200);
    const json = ctx.getJson();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.website, "newgithub.com");
    assert.strictEqual(json.data.email, "newusera@example.com"); // Normalized to lowercase
    assert.strictEqual(json.data.encryptedPassword, undefined, "Ciphertext must not be exposed");
    assert.strictEqual(mockRecord.website, "newgithub.com");
    assert.strictEqual(mockRecord.email, "newusera@example.com");
    console.log("✔ Test 6 Passed: Website and email updated and normalized successfully.");
    passedCount++;
  }

  // -------------------------------------------------------------
  // Test 7: Successful update of password with re-encryption
  // -------------------------------------------------------------
  {
    const newPlaintextPass = "BrandNewSecretPassword@999!";
    const ctx = createMockContext(
      { id: recordId },
      { password: newPlaintextPass },
      { id: userAId }
    );
    await updatePassword(ctx.req, ctx.res);
    assert.strictEqual(ctx.getStatus(), 200);
    assert.notStrictEqual(mockRecord.encryptedPassword, initialEnc.encrypted, "Ciphertext must be re-encrypted");
    assert.notStrictEqual(mockRecord.iv, initialEnc.iv, "IV must be freshly generated");
    assert.notStrictEqual(mockRecord.authTag, initialEnc.authTag, "authTag must be freshly generated");

    // Decrypt the newly stored record and verify exact match
    const decrypted = decrypt(mockRecord.encryptedPassword, mockRecord.iv, mockRecord.authTag);
    assert.strictEqual(decrypted, newPlaintextPass, "Decrypted password must match new plaintext password");
    console.log("✔ Test 7 Passed: Password successfully re-encrypted with fresh IV/authTag and verified via decrypt().");
    passedCount++;
  }

  console.log(`\nAll ${passedCount} Phase 2A vault update tests completed successfully!`);
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exitCode = 1;
});
