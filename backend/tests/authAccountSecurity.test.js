const assert = require("assert");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../src/models/user.model");
const Password = require("../src/models/store.model");
const VaultKey = require("../src/models/vaultKey.model");
const {
  getCurrentUser,
  rotateRecoveryCode,
  changePassword,
  deleteOwnAccount,
  deleteAdminProfile,
} = require("../src/controllers/auth.controllers");
const { generateRecoveryCode } = require("../src/utils/recoveryCode");

const userId = "670b44444444444444444444";
const adminId = "670b22222222222222222222";
const { rawCode: initialRecoveryCode } = generateRecoveryCode();

let state;
let deletionOperations;
let endedSessions;

function createContext({ body = {}, user = { id: userId, role: "user" } } = {}) {
  let statusCode = 200;
  let responseBody;
  const clearedCookies = [];
  return {
    req: { body, user },
    res: {
      status(code) {
        statusCode = code;
        return this;
      },
      json(body) {
        responseBody = body;
        return this;
      },
      set() {
        return this;
      },
      clearCookie(name, options) {
        clearedCookies.push({ name, options });
        return this;
      },
    },
    getStatus: () => statusCode,
    getBody: () => responseBody,
    getClearedCookies: () => clearedCookies,
  };
}

function mockUserQuery(query, callback) {
  return {
    session: async (session) => {
      assert(session);
      return callback(query);
    },
  };
}

async function runTests() {
  state = {
    _id: userId,
    name: "Test User",
    email: "person@example.com",
    role: "user",
    passwordHash: await bcrypt.hash("CurrentPassword123!", 4),
    recoveryCodeHash: await bcrypt.hash(initialRecoveryCode, 4),
    tokenVersion: 2,
  };
  deletionOperations = [];
  endedSessions = 0;

  User.findById = async (id) => (state && id === userId ? { ...state } : null);
  User.findOne = (query) =>
    mockUserQuery(query, () =>
      state && state._id === query._id && state.role === query.role
        ? { ...state }
        : null
    );
  User.findOneAndUpdate = async (filter, update) => {
    if (
      !state ||
      state._id !== filter._id ||
      state.passwordHash !== filter.passwordHash ||
      state.recoveryCodeHash !== filter.recoveryCodeHash
    ) {
      return null;
    }

    Object.assign(state, update.$set || {});
    for (const [key, increment] of Object.entries(update.$inc || {})) {
      state[key] += increment;
    }
    return { ...state };
  };

  mongoose.startSession = async () => ({
    withTransaction: async (callback) => callback(),
    endSession: async () => {
      endedSessions++;
    },
  });

  Password.deleteMany = (query) =>
    mockUserQuery(query, () => {
      deletionOperations.push("passwords");
    });
  VaultKey.deleteOne = (query) =>
    mockUserQuery(query, () => {
      deletionOperations.push("vault-key");
    });
  User.deleteOne = (query) =>
    mockUserQuery(query, () => {
      deletionOperations.push("user");
      state = null;
    });

  {
    const context = createContext();
    User.findById = (id) => ({
      select: (fields) => {
        assert.strictEqual(fields, "name email role recoveryCodeHash");
        return {
          lean: async () => (state && id === userId ? { ...state } : null),
        };
      },
    });
    await getCurrentUser(context.req, context.res);
    assert.strictEqual(context.getStatus(), 200);
    assert.strictEqual(context.getBody().user.hasRecoveryCode, true);
    assert.strictEqual(context.getBody().user.name, "Test User");
    assert.strictEqual(context.getBody().user.recoveryCodeHash, undefined);
    console.log("✔ Profile returns recovery-code status without exposing its hash.");
  }

  {
    User.findById = async (id) => (state && id === userId ? { ...state } : null);
    const oldHash = state.recoveryCodeHash;
    const wrongPassword = createContext({
      body: { currentPassword: "wrong password" },
    });
    await rotateRecoveryCode(wrongPassword.req, wrongPassword.res);
    assert.strictEqual(wrongPassword.getStatus(), 401);
    assert.strictEqual(state.recoveryCodeHash, oldHash);

    const context = createContext({
      body: { currentPassword: "CurrentPassword123!" },
    });
    await rotateRecoveryCode(context.req, context.res);
    assert.strictEqual(context.getStatus(), 200);
    assert.notStrictEqual(state.recoveryCodeHash, oldHash);
    assert.strictEqual(await bcrypt.compare(initialRecoveryCode, state.recoveryCodeHash), false);
    assert.strictEqual(
      await bcrypt.compare(context.getBody().recoveryCode.replaceAll("-", ""), state.recoveryCodeHash),
      true
    );
    console.log("✔ Recovery-code rotation verifies the password and invalidates the previous code.");
  }

  {
    const context = createContext({
      body: {
        currentPassword: "CurrentPassword123!",
        newPassword: "NewPassword456!",
      },
    });
    const previousTokenVersion = state.tokenVersion;
    await changePassword(context.req, context.res);
    assert.strictEqual(context.getStatus(), 200);
    assert.strictEqual(state.tokenVersion, previousTokenVersion + 1);
    assert.strictEqual(await bcrypt.compare("CurrentPassword123!", state.passwordHash), false);
    assert.strictEqual(await bcrypt.compare("NewPassword456!", state.passwordHash), true);
    assert.strictEqual(
      await bcrypt.compare(context.getBody().newRecoveryCode.replaceAll("-", ""), state.recoveryCodeHash),
      true
    );
    assert.strictEqual(context.getClearedCookies()[0].name, "token");
    console.log("✔ Password change updates credentials, rotates recovery code, and invalidates the session.");
  }

  {
    const incorrect = createContext({
      body: { currentPassword: "wrong password" },
    });
    await deleteOwnAccount(incorrect.req, incorrect.res);
    assert.strictEqual(incorrect.getStatus(), 401);
    assert(state);
    assert.strictEqual(endedSessions, 1);

    const context = createContext({
      body: { currentPassword: "NewPassword456!" },
    });
    await deleteOwnAccount(context.req, context.res);
    assert.strictEqual(context.getStatus(), 200);
    assert.strictEqual(state, null);
    assert.deepStrictEqual(deletionOperations, ["passwords", "vault-key", "user"]);
    assert.strictEqual(endedSessions, 2);
    assert.strictEqual(context.getClearedCookies()[0].name, "token");
    console.log("✔ Self-deletion verifies the password and atomically removes vault data, key, and account.");
  }

  {
    state = {
      _id: adminId,
      role: "admin",
      passwordHash: await bcrypt.hash("AdminPassword123!", 4),
    };
    User.findOne = async (filter) =>
      state && state._id === filter._id && state.role === filter.role ? { ...state } : null;
    User.findOneAndDelete = async (filter) => {
      if (
        !state ||
        state._id !== filter._id ||
        state.role !== filter.role ||
        state.passwordHash !== filter.passwordHash
      ) {
        return null;
      }
      const deleted = state;
      state = null;
      return deleted;
    };

    const incorrect = createContext({
      body: { currentPassword: "wrong password" },
      user: { id: adminId, role: "admin" },
    });
    await deleteAdminProfile(incorrect.req, incorrect.res);
    assert.strictEqual(incorrect.getStatus(), 401);
    assert(state);

    const context = createContext({
      body: { currentPassword: "AdminPassword123!" },
      user: { id: adminId, role: "admin" },
    });
    await deleteAdminProfile(context.req, context.res);
    assert.strictEqual(context.getStatus(), 200);
    assert.strictEqual(state, null);
    assert.strictEqual(context.getClearedCookies()[0].name, "token");
    console.log("✔ Admin profile deletion verifies the password, deletes only the admin account, and clears the session.");
  }

  console.log("\nAll account security tests passed.");
}

runTests().catch((error) => {
  console.error("Account security test failed:", error);
  process.exitCode = 1;
});
