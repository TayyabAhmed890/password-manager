const assert = require("assert");

let nextResult = {
  success: true,
  limit: 5,
  remaining: 4,
  reset: Date.now() + 60_000,
};
let shouldThrow = false;
let capturedIdentifier = null;

const redisPath = require.resolve("@upstash/redis");
const rateLimitPath = require.resolve("@upstash/ratelimit");

require.cache[redisPath] = {
  exports: {
    Redis: class MockRedis {},
  },
};

require.cache[rateLimitPath] = {
  exports: {
    Ratelimit: class MockRatelimit {
      static slidingWindow(limit, window) {
        return { limit, window };
      }

      constructor(options) {
        this.options = options;
      }

      async limit(identifier) {
        capturedIdentifier = identifier;
        if (shouldThrow) {
          throw new Error("simulated Upstash outage");
        }
        return nextResult;
      }
    },
  },
};

const { createRateLimit } = require("../src/middlewares/rateLimit.middleware");

function createContext(req) {
  let statusCode = 200;
  let body = null;
  const headers = {};

  return {
    req,
    res: {
      set(name, value) {
        headers[name] = value;
        return this;
      },
      status(code) {
        statusCode = code;
        return this;
      },
      json(value) {
        body = value;
        return this;
      },
    },
    headers,
    getStatus: () => statusCode,
    getBody: () => body,
  };
}

async function runTests() {
  const previousUrl = process.env.UPSTASH_REDIS_REST_URL;
  const previousToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const previousNodeEnv = process.env.NODE_ENV;
  const previousConsoleError = console.error;

  process.env.UPSTASH_REDIS_REST_URL = "https://unit-test.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "unit-test-token";
  console.error = () => {};

  try {
    const limiter = createRateLimit({
      name: "test-success",
      limit: 5,
      window: "1 m",
    });
    const successContext = createContext({
      ip: "192.0.2.1",
      socket: { remoteAddress: "192.0.2.1" },
    });
    let nextCalled = false;

    await limiter(successContext.req, successContext.res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, true);
    assert.match(capturedIdentifier, /^[a-f0-9]{64}$/);
    assert.strictEqual(successContext.headers["RateLimit-Limit"], "5");
    assert.strictEqual(successContext.headers["RateLimit-Remaining"], "4");
    console.log("✔ Test 1 Passed: Allowed requests continue and receive rate-limit headers.");

    const blockedLimiter = createRateLimit({
      name: "test-blocked",
      limit: 1,
      window: "1 m",
    });
    nextResult = {
      success: false,
      limit: 1,
      remaining: 0,
      reset: Date.now() + 30_000,
    };
    const blockedContext = createContext({
      ip: "192.0.2.2",
      socket: { remoteAddress: "192.0.2.2" },
    });

    await blockedLimiter(blockedContext.req, blockedContext.res, () => {
      assert.fail("Blocked request must not continue.");
    });

    assert.strictEqual(blockedContext.getStatus(), 429);
    assert.strictEqual(
      blockedContext.getBody().message,
      "Too many requests. Please try again later."
    );
    assert(Number(blockedContext.headers["Retry-After"]) > 0);
    console.log("✔ Test 2 Passed: Exceeded limits return 429 and Retry-After.");

    const outageLimiter = createRateLimit({
      name: "test-outage",
      limit: 1,
      window: "1 m",
    });
    process.env.NODE_ENV = "production";
    shouldThrow = true;
    const outageContext = createContext({
      ip: "192.0.2.3",
      socket: { remoteAddress: "192.0.2.3" },
    });

    await outageLimiter(outageContext.req, outageContext.res, () => {
      assert.fail("Unavailable limiter must fail closed.");
    });

    assert.strictEqual(outageContext.getStatus(), 503);
    assert.strictEqual(
      outageContext.getBody().message,
      "Service temporarily unavailable."
    );
    console.log("✔ Test 3 Passed: Upstash failures return a generic 503 without bypassing limits.");

    shouldThrow = false;
    process.env.NODE_ENV = "development";
    delete process.env.UPSTASH_REDIS_REST_URL;
    const missingConfigLimiter = createRateLimit({
      name: "test-local-fallback",
      limit: 1,
      window: "1 m",
    });
    const localFirstContext = createContext({
      ip: "192.0.2.4",
      socket: { remoteAddress: "192.0.2.4" },
    });
    let localNextCalled = false;
    await missingConfigLimiter(localFirstContext.req, localFirstContext.res, () => {
      localNextCalled = true;
    });
    assert.strictEqual(localNextCalled, true);

    const localBlockedContext = createContext({
      ip: "192.0.2.4",
      socket: { remoteAddress: "192.0.2.4" },
    });
    await missingConfigLimiter(
      localBlockedContext.req,
      localBlockedContext.res,
      () => assert.fail("Local limit must reject the second request.")
    );
    assert.strictEqual(localBlockedContext.getStatus(), 429);
    console.log("✔ Test 4 Passed: Development uses a local limiter when Upstash is unavailable.");

    process.env.NODE_ENV = "production";
    const productionMissingLimiter = createRateLimit({
      name: "test-production-missing-config",
      limit: 1,
      window: "1 m",
    });
    const productionMissingContext = createContext({
      ip: "192.0.2.5",
      socket: { remoteAddress: "192.0.2.5" },
    });
    await productionMissingLimiter(
      productionMissingContext.req,
      productionMissingContext.res,
      () => assert.fail("Production must not bypass the distributed limiter.")
    );
    assert.strictEqual(productionMissingContext.getStatus(), 503);
    console.log("✔ Test 5 Passed: Production still fails closed without Upstash.");
  } finally {
    console.error = previousConsoleError;

    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    if (previousUrl === undefined) {
      delete process.env.UPSTASH_REDIS_REST_URL;
    } else {
      process.env.UPSTASH_REDIS_REST_URL = previousUrl;
    }

    if (previousToken === undefined) {
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
    } else {
      process.env.UPSTASH_REDIS_REST_TOKEN = previousToken;
    }
  }
}

runTests().catch((error) => {
  console.error("Rate-limit test failed:", error);
  process.exitCode = 1;
});
