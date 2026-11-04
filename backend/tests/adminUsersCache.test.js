const assert = require("assert");

const cache = new Map();
const redisPath = require.resolve("@upstash/redis");
const rateLimitPath = require.resolve("@upstash/ratelimit");
require.cache[redisPath] = {
  exports: {
    Redis: class MockRedis {
      async get(key) {
        return cache.get(key) ?? null;
      }

      async set(key, value, options) {
        cache.set(key, value);
        assert.strictEqual(options.ex, 30);
      }

      async incr(key) {
        const next = Number(cache.get(key) || 0) + 1;
        cache.set(key, next);
        return next;
      }
    },
  },
};
require.cache[rateLimitPath] = {
  exports: {
    Ratelimit: class MockRatelimit {
      static slidingWindow(limit, window) {
        return { limit, window };
      }
    },
  },
};

const {
  getAdminUsersCacheKey,
  invalidateAdminUsersCache,
  readAdminUsersCache,
  writeAdminUsersCache,
} = require("../src/utils/adminUsersCache");

async function runTests() {
  const previousUrl = process.env.UPSTASH_REDIS_REST_URL;
  const previousToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  process.env.UPSTASH_REDIS_REST_URL = "https://unit-test.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "unit-test-token";

  try {
    const response = { success: true, data: [{ id: "1" }] };
    const firstKey = await getAdminUsersCacheKey(1, 10);
    await writeAdminUsersCache(firstKey, response);
    assert.deepStrictEqual(await readAdminUsersCache(firstKey), response);

    await invalidateAdminUsersCache();
    const nextKey = await getAdminUsersCacheKey(1, 10);
    assert.notStrictEqual(nextKey, firstKey);
    assert.strictEqual(await readAdminUsersCache(nextKey), null);
    console.log("Admin user cache tests passed: 30-second TTL and versioned invalidation.");
  } finally {
    if (previousUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = previousUrl;
    if (previousToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = previousToken;
  }
}

runTests().catch((error) => {
  console.error("Admin user cache tests failed:", error);
  process.exitCode = 1;
});
