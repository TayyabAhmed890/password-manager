const assert = require("assert");

let capturedOptions;
let limitCalls = 0;
const redisPath = require.resolve("@upstash/redis");
const rateLimitPath = require.resolve("@upstash/ratelimit");
require.cache[redisPath] = {
  exports: { Redis: class MockRedis {} },
};
require.cache[rateLimitPath] = {
  exports: {
    Ratelimit: class MockRatelimit {
      static slidingWindow(limit, window) {
        return { limit, window };
      }

      constructor(options) {
        capturedOptions = options;
      }

      async limit() {
        limitCalls++;
        return { success: true, limit: 5, remaining: 4, reset: Date.now() + 60_000 };
      }
    },
  },
};

const adminLoginRateLimit = require("../src/middlewares/adminLoginRateLimit.middleware");

const createContext = (origin) => {
  let nextCalled = false;
  const headers = {};
  return {
    req: {
      ip: "192.0.2.10",
      socket: { remoteAddress: "192.0.2.10" },
      body: { email: " Admin@example.com " },
      get(name) {
        return name === "origin" ? origin : undefined;
      },
    },
    res: {
      set(name, value) {
        headers[name] = value;
        return this;
      },
      status() {
        return this;
      },
      json() {
        return this;
      },
    },
    next: () => { nextCalled = true; },
    wasNextCalled: () => nextCalled,
  };
};

async function runTests() {
  const previousUrl = process.env.UPSTASH_REDIS_REST_URL;
  const previousToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  process.env.UPSTASH_REDIS_REST_URL = "https://unit-test.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "unit-test-token";

  try {
    const userContext = createContext("http://localhost:5173");
    adminLoginRateLimit(userContext.req, userContext.res, userContext.next);
    assert.strictEqual(userContext.wasNextCalled(), true);
    assert.strictEqual(limitCalls, 0);

    const adminContext = createContext("http://localhost:5174");
    await adminLoginRateLimit(adminContext.req, adminContext.res, adminContext.next);
    assert.strictEqual(adminContext.wasNextCalled(), true);
    assert.strictEqual(limitCalls, 1);
    assert.strictEqual(capturedOptions.limiter.limit, 5);
    assert.strictEqual(capturedOptions.limiter.window, "15 m");
    assert.strictEqual(capturedOptions.prefix, "password-manager:admin-login");
    console.log("Admin login rate-limit tests passed: 5 attempts per 15 minutes on admin origins.");
  } finally {
    if (previousUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = previousUrl;
    if (previousToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = previousToken;
  }
}

runTests().catch((error) => {
  console.error("Admin login rate-limit tests failed:", error);
  process.exitCode = 1;
});
