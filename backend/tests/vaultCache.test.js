const assert = require("assert");

const cache = new Map();
const redisPath = require.resolve("@upstash/redis");

require.cache[redisPath] = {
  exports: {
    Redis: class MockRedis {
      async get(key) {
        return cache.get(key) ?? null;
      }

      async set(key, value, options) {
        cache.set(key, value);
        assert.strictEqual(options.ex, 60);
      }

      async del(...keys) {
        for (const key of keys) cache.delete(key);
      }
    },
  },
};

const {
  cachePassword,
  cacheVaultList,
  getCachedPassword,
  getCachedVaultList,
  invalidateVaultCache,
} = require("../src/utils/vaultCache");

async function runTests() {
  const previousUrl = process.env.UPSTASH_REDIS_REST_URL;
  const previousToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  process.env.UPSTASH_REDIS_REST_URL = "https://unit-test.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "unit-test-token";

  try {
    const userId = "user-a";
    const otherUserId = "user-b";
    const entryId = "entry-1";
    const encryptedEntry = {
      encryptedPassword: "ciphertext-only",
      iv: "initialization-vector",
      authTag: "authentication-tag",
      encryptionVersion: 1,
    };

    await cacheVaultList(userId, [{ id: entryId, website: "example.com" }]);
    assert.deepStrictEqual(await getCachedVaultList(userId), [
      { id: entryId, website: "example.com" },
    ]);
    assert.strictEqual(await getCachedVaultList(otherUserId), null);

    await cachePassword(userId, entryId, encryptedEntry);
    assert.deepStrictEqual(
      await getCachedPassword(userId, entryId),
      encryptedEntry
    );
    assert.strictEqual(await getCachedPassword(otherUserId, entryId), null);

    await invalidateVaultCache(userId, entryId);
    assert.strictEqual(await getCachedVaultList(userId), null);
    assert.strictEqual(await getCachedPassword(userId, entryId), null);
    console.log("Vault cache tests passed: user-scoped keys, TTL, and invalidation.");
  } finally {
    if (previousUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = previousUrl;
    if (previousToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = previousToken;
  }
}

runTests().catch((error) => {
  console.error("Vault cache tests failed:", error);
  process.exitCode = 1;
});
