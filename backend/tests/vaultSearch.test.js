const assert = require("assert");
const Password = require("../src/models/store.model");

const vaultCachePath = require.resolve("../src/utils/vaultCache");
require.cache[vaultCachePath] = {
  exports: {
    cachePassword: async () => {},
    cacheVaultList: async () => {},
    getCachedPassword: async () => null,
    getCachedVaultList: async () => null,
    invalidateVaultCache: async () => {},
  },
};

const { getPasswords } = require("../src/controllers/store.controllers");

const createContext = (search) => {
  let statusCode = 200;
  let body;
  const req = {
    user: { id: "user-1" },
    query: search === undefined ? {} : { search },
  };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      body = payload;
      return this;
    },
  };

  return { req, res, getStatus: () => statusCode, getBody: () => body };
};

async function runTests() {
  let requestedUserId;
  Password.find = (filter) => {
    requestedUserId = filter.userId;
    return {
      select() {
        return this;
      },
      sort() {
        return this;
      },
      lean: async () => [
        { _id: "1", website: "Example.com", email: "Alice@example.com", encryptedPassword: "secret" },
        { _id: "2", website: "other.test", email: "bob@example.com", encryptedPassword: "secret" },
      ],
    };
  };

  const matchingContext = createContext("ALICE@EXAMPLE");
  await getPasswords(matchingContext.req, matchingContext.res);
  assert.equal(matchingContext.getStatus(), 200);
  assert.equal(requestedUserId, "user-1");
  assert.equal(matchingContext.getBody().data.length, 1);
  assert.equal(matchingContext.getBody().data[0].id, "1");
  assert.equal(matchingContext.getBody().data[0].encryptedPassword, undefined);
  assert.deepEqual(matchingContext.getBody().vault, { currentCount: 2, maxEntries: 10 });

  const invalidContext = createContext(["example", "other"]);
  await getPasswords(invalidContext.req, invalidContext.res);
  assert.equal(invalidContext.getStatus(), 400);

  const tooLongContext = createContext("x".repeat(101));
  await getPasswords(tooLongContext.req, tooLongContext.res);
  assert.equal(tooLongContext.getStatus(), 400);

  console.log("✔ Vault search is user-scoped, bounded, case-insensitive, and metadata-only.");
}

runTests().catch((error) => {
  console.error("Vault search test failed:", error);
  process.exitCode = 1;
});
