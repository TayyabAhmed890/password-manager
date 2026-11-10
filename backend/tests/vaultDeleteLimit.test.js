const assert = require("assert");
const mongoose = require("mongoose");
const User = require("../src/models/user.model");
const Password = require("../src/models/store.model");

for (const [modulePath, exports] of [
  [
    require.resolve("../src/utils/vaultCache"),
    {
      cachePassword: async () => {},
      cacheVaultList: async () => {},
      getCachedPassword: async () => null,
      getCachedVaultList: async () => null,
      invalidateVaultCache: async () => {},
    },
  ],
  [
    require.resolve("../src/utils/adminUsersCache"),
    { invalidateAdminUsersCache: async () => {} },
  ],
]) {
  require.cache[modulePath] = { exports };
}

const { deletePassword } = require("../src/controllers/store.controllers");

async function runTests() {
  const userId = new mongoose.Types.ObjectId().toString();
  const entryId = new mongoose.Types.ObjectId().toString();
  let count;
  let deleted = true;
  let legacyPasswordCount = 1;

  User.findById = () => ({
    select() {
      return this;
    },
    session() {
      return this;
    },
    lean: async () => count === undefined ? {} : { vaultEntryCount: count },
  });
  User.updateOne = async (filter, update) => {
    if (update.$set) {
      if (count !== undefined) return { modifiedCount: 0 };
      count = update.$set.vaultEntryCount;
      return { modifiedCount: 1 };
    }

    if (count <= filter.vaultEntryCount.$gt) return { modifiedCount: 0 };
    count += update.$inc.vaultEntryCount;
    return { modifiedCount: 1 };
  };
  Password.countDocuments = () => ({
    session: async () => legacyPasswordCount,
  });
  Password.findOneAndDelete = (filter) => ({
    session: async () => {
      assert.equal(filter.userId, userId);
      return deleted ? { _id: entryId } : null;
    },
  });
  mongoose.startSession = async () => ({
    withTransaction: async (callback) => callback(),
    endSession: async () => {},
  });

  const createContext = () => {
    let statusCode = 200;
    let body;
    return {
      req: { user: { id: userId }, params: { id: entryId } },
      res: {
        status(code) {
          statusCode = code;
          return this;
        },
        json(payload) {
          body = payload;
          return this;
        },
      },
      getStatus: () => statusCode,
      getBody: () => body,
    };
  };

  const legacyDelete = createContext();
  await deletePassword(legacyDelete.req, legacyDelete.res);
  assert.equal(legacyDelete.getStatus(), 200);
  assert.equal(count, 0);

  count = 4;
  deleted = false;
  const missingEntry = createContext();
  await deletePassword(missingEntry.req, missingEntry.res);
  assert.equal(missingEntry.getStatus(), 404);
  assert.equal(count, 4);

  console.log("✔ Vault deletion releases exactly one slot and migrates legacy counters safely.");
}

runTests().catch((error) => {
  console.error("Vault deletion limit test failed:", error);
  process.exitCode = 1;
});
