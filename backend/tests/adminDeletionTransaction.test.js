const assert = require("assert");
const mongoose = require("mongoose");
const User = require("../src/models/user.model");
const Password = require("../src/models/store.model");
const VaultKey = require("../src/models/vaultKey.model");
const { deleteUser } = require("../src/controllers/admin.controllers");

const targetUserId = "670b33333333333333333333";
const adminId = "670b22222222222222222222";

function createContext() {
  let statusCode = 200;
  let responseBody;

  return {
    req: {
      params: { id: targetUserId },
      user: { id: adminId, role: "admin" },
    },
    res: {
      status(code) {
        statusCode = code;
        return this;
      },
      json(body) {
        responseBody = body;
        return this;
      },
    },
    getStatus: () => statusCode,
    getBody: () => responseBody,
  };
}

async function runTests() {
  let transactionCallback;
  let transactionError = null;
  let endedSessions = 0;
  let userLookupCount = 0;
  const operations = [];

  mongoose.startSession = async () => ({
    withTransaction: async (callback) => {
      transactionCallback = callback;
      await callback();
      if (transactionError) {
        throw transactionError;
      }
    },
    endSession: async () => {
      endedSessions++;
    },
  });

  User.findOne = (query) => {
    userLookupCount++;
    return {
      session: async (session) => {
        assert(session);
        operations.push(["find-user", query]);
        return { _id: targetUserId };
      },
    };
  };

  Password.deleteMany = (query) => ({
    session: async (session) => {
      assert(session);
      operations.push(["delete-passwords", query]);
    },
  });

  VaultKey.deleteOne = (query) => ({
    session: async (session) => {
      assert(session);
      operations.push(["delete-vault-key", query]);
    },
  });

  User.deleteOne = (query) => ({
    session: async (session) => {
      assert(session);
      operations.push(["delete-user", query]);
    },
  });

  {
    const context = createContext();
    await deleteUser(context.req, context.res);

    assert.strictEqual(context.getStatus(), 200);
    assert.strictEqual(context.getBody().success, true);
    assert.deepStrictEqual(
      operations.map(([name]) => name),
      ["find-user", "delete-passwords", "delete-vault-key", "delete-user"]
    );
    assert(operations.every(([, query]) => query.userId === targetUserId || query._id === targetUserId || query.role === "user"));
    assert.strictEqual(endedSessions, 1);
    console.log("✔ Test 1 Passed: Account, vault key, and vault entries are deleted through one transaction.");
  }

  {
    operations.length = 0;
    transactionError = new Error("Transaction numbers are only allowed on a replica set member or mongos");
    const context = createContext();
    const previousConsoleError = console.error;
    console.error = () => {};

    try {
      await deleteUser(context.req, context.res);
    } finally {
      console.error = previousConsoleError;
    }

    assert.strictEqual(context.getStatus(), 500);
    assert.strictEqual(context.getBody().success, false);
    assert.strictEqual(operations.length, 4);
    assert.strictEqual(userLookupCount, 2);
    assert.strictEqual(transactionCallback instanceof Function, true);
    assert.strictEqual(endedSessions, 2);
    console.log("✔ Test 2 Passed: Transaction failure returns an error instead of falling back to non-atomic deletion.");
  }

  console.log("\nAll admin deletion transaction tests passed!");
}

runTests().catch((error) => {
  console.error("Admin deletion transaction test failed:", error);
  process.exitCode = 1;
});
