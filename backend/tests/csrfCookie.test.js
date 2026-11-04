const assert = require("assert");
const csrfProtection = require("../src/middlewares/csrf.middleware");
const {
  getAuthCookieOptions,
} = require("../src/utils/authCookie");

function createContext(headers = {}, cookies = {}) {
  let statusCode = 200;
  let body = null;
  const req = {
    cookies,
    get(name) {
      return headers[name.toLowerCase()];
    },
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

  return {
    req,
    res,
    getStatus: () => statusCode,
    getBody: () => body,
  };
}

async function runTests() {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalClientUrl = process.env.CLIENT_URL;
  const originalAdminUrl = process.env.ADMIN_URL;
  process.env.NODE_ENV = "test";
  process.env.CLIENT_URL = "https://frontend.example.com";
  process.env.ADMIN_URL = "https://admin.example.com";

  try {
    let nextCalled = false;
    const allowedOrigin = createContext({
      origin: "https://frontend.example.com",
    });
    csrfProtection(allowedOrigin.req, allowedOrigin.res, () => {
      nextCalled = true;
    });
    assert.strictEqual(nextCalled, true);
    console.log("✔ Test 1 Passed: Configured Origin is accepted.");

    nextCalled = false;
    const allowedAdminOrigin = createContext({
      origin: "https://admin.example.com",
    });
    csrfProtection(allowedAdminOrigin.req, allowedAdminOrigin.res, () => {
      nextCalled = true;
    });
    assert.strictEqual(nextCalled, true);
    console.log("✔ Test 1a Passed: Configured ADMIN_URL origin is accepted.");

    nextCalled = false;
    const localAdminOrigin = createContext({
      origin: "http://localhost:5174",
    });
    csrfProtection(localAdminOrigin.req, localAdminOrigin.res, () => {
      nextCalled = true;
    });
    assert.strictEqual(nextCalled, true);
    console.log("✔ Test 1b Passed: Local Vite admin origin is accepted in development.");

    const disallowedOrigin = createContext({
      origin: "https://attacker.example",
    });
    csrfProtection(disallowedOrigin.req, disallowedOrigin.res, () => {
      assert.fail("Untrusted origin must be rejected.");
    });
    assert.strictEqual(disallowedOrigin.getStatus(), 403);
    console.log("✔ Test 2 Passed: Untrusted Origin is rejected.");

    nextCalled = false;
    const refererFallback = createContext({
      referer: "https://frontend.example.com/vault",
    });
    csrfProtection(refererFallback.req, refererFallback.res, () => {
      nextCalled = true;
    });
    assert.strictEqual(nextCalled, true);
    console.log("✔ Test 3 Passed: Configured Referer is accepted as Origin fallback.");

    const missingOrigin = createContext({}, { token: "session-cookie" });
    csrfProtection(missingOrigin.req, missingOrigin.res, () => {
      assert.fail("Cookie-authenticated request without origin must be rejected.");
    });
    assert.strictEqual(missingOrigin.getStatus(), 403);
    console.log("✔ Test 4 Passed: Cookie-authenticated request without verifiable origin is rejected.");

    nextCalled = false;
    const sameOriginFetch = createContext({
      "sec-fetch-site": "same-origin",
    }, { token: "session-cookie" });
    csrfProtection(sameOriginFetch.req, sameOriginFetch.res, () => {
      nextCalled = true;
    });
    assert.strictEqual(nextCalled, true);
    console.log("✔ Test 5 Passed: Same-origin Fetch Metadata is accepted.");

    const nonBrowserWithoutCookie = createContext();
    csrfProtection(nonBrowserWithoutCookie.req, nonBrowserWithoutCookie.res, () => {
      assert.fail("Requests without a verifiable origin must be rejected.");
    });
    assert.strictEqual(nonBrowserWithoutCookie.getStatus(), 403);
    console.log("✔ Test 6 Passed: Requests without a verifiable origin are rejected.");

    process.env.NODE_ENV = "production";
    const productionAdminOrigin = createContext({
      origin: "http://localhost:5174",
    });
    csrfProtection(productionAdminOrigin.req, productionAdminOrigin.res, () => {
      assert.fail("Unconfigured local admin origin must not be trusted in production.");
    });
    assert.strictEqual(productionAdminOrigin.getStatus(), 403);
    console.log("✔ Test 1c Passed: Local admin origin is not implicitly allowed in production.");

    const setOptions = getAuthCookieOptions();
    const clearOptions = getAuthCookieOptions({ clear: true });
    assert.strictEqual(setOptions.httpOnly, true);
    assert.strictEqual(setOptions.secure, true);
    assert.strictEqual(setOptions.sameSite, "lax");
    assert.strictEqual(setOptions.path, "/");
    assert.strictEqual(setOptions.maxAge, 3 * 24 * 60 * 60 * 1000);
    assert.deepStrictEqual(clearOptions, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    });
    console.log("✔ Test 7 Passed: Production cookie set/clear options are consistent and secure.");
  } finally {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }

    if (originalClientUrl === undefined) {
      delete process.env.CLIENT_URL;
    } else {
      process.env.CLIENT_URL = originalClientUrl;
    }

    if (originalAdminUrl === undefined) {
      delete process.env.ADMIN_URL;
    } else {
      process.env.ADMIN_URL = originalAdminUrl;
    }
  }
}

runTests().catch((error) => {
  console.error("CSRF/cookie test failed:", error);
  process.exitCode = 1;
});
