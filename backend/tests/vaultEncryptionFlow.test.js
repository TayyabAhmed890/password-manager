const assert = require("assert");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Password = require("../src/models/store.model");
const VaultKey = require("../src/models/vaultKey.model");
const { wrapDek } = require("../src/utils/encryption");
const {
  createPassword,
  revealPassword,
} = require("../src/controllers/store.controllers");

function createContext({ userId, body = {}, id } = {}) {
  let statusCode = 200;
  let responseBody = null;
  const req = {
    user: userId ? { id: userId, role: "user" } : undefined,
    body,
    params: id ? { id } : {},
  };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      responseBody = payload;
      return this;
    },
  };

  return {
    req,
    res,
    getStatus: () => statusCode,
    getBody: () => responseBody,
  };
}

async function runTests() {
  process.env.VAULT_KEY = "c".repeat(64);

  const userId = new mongoose.Types.ObjectId().toString();
  const dek = crypto.randomBytes(32);
  const wrapped = wrapDek(dek);
  let savedRecord;
  let queriedKeyUserId;
  let queriedPasswordFilter;

  VaultKey.findOne = (filter) => {
    queriedKeyUserId = filter.userId;
    return {
      select() {
        return {
          lean: async () => ({
            wrappedDek: wrapped.encrypted,
            iv: wrapped.iv,
            authTag: wrapped.authTag,
            keyVersion: 1,
          }),
        };
      },
    };
  };

  Password.create = async (data) => {
    savedRecord = {
      ...data,
      _id: new mongoose.Types.ObjectId(),
      createdAt: new Date(),
    };
    return savedRecord;
  };

  const createContextResult = createContext({
    userId,
    body: {
      website: "example.com",
      email: "person@example.com",
      password: "vault-secret",
    },
  });
  await createPassword(createContextResult.req, createContextResult.res);

  assert.strictEqual(createContextResult.getStatus(), 201);
  assert.strictEqual(queriedKeyUserId, userId);
  assert.strictEqual(savedRecord.encryptionVersion, 1);
  assert.notStrictEqual(savedRecord.encryptedPassword, "vault-secret");
  assert.strictEqual(createContextResult.getBody().data.password, undefined);
  console.log("✔ Test 1 Passed: Create encrypts the vault password with that user's DEK.");

  Password.findOne = (filter) => {
    queriedPasswordFilter = filter;
    return {
      select() {
        return {
          lean: async () => ({
            encryptedPassword: savedRecord.encryptedPassword,
            iv: savedRecord.iv,
            authTag: savedRecord.authTag,
            encryptionVersion: savedRecord.encryptionVersion,
          }),
        };
      },
    };
  };

  const revealContext = createContext({
    userId,
    id: savedRecord._id.toString(),
  });
  await revealPassword(revealContext.req, revealContext.res);

  assert.strictEqual(revealContext.getStatus(), 200);
  assert.strictEqual(revealContext.getBody().data.password, "vault-secret");
  assert.strictEqual(queriedPasswordFilter.userId, userId);
  console.log("✔ Test 2 Passed: Reveal decrypts the owned record and scopes the query to its user.");

  VaultKey.findOne = () => ({
    select() {
      return {
        lean: async () => null,
      };
    },
  });
  let passwordCreateCalled = false;
  Password.create = async () => {
    passwordCreateCalled = true;
  };

  const missingKeyContext = createContext({
    userId,
    body: {
      website: "example.com",
      email: "person@example.com",
      password: "vault-secret",
    },
  });
  const previousConsoleError = console.error;
  console.error = () => {};
  try {
    await createPassword(missingKeyContext.req, missingKeyContext.res);
  } finally {
    console.error = previousConsoleError;
  }

  assert.strictEqual(missingKeyContext.getStatus(), 500);
  assert.strictEqual(passwordCreateCalled, false);
  console.log("✔ Test 3 Passed: Missing user key prevents vault storage.");
}

runTests().catch((error) => {
  console.error("Vault encryption flow test failed:", error);
  process.exitCode = 1;
});
