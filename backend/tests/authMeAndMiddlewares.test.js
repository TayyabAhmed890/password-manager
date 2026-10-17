const assert = require("assert");
const jwt = require("jsonwebtoken");
const User = require("../src/models/user.model");
const Password = require("../src/models/store.model");
const protect = require("../src/middlewares/auth.middleware");
const requireUser = require("../src/middlewares/user.middleware");
const requireAdmin = require("../src/middlewares/admin.middleware");
const { getCurrentUser } = require("../src/controllers/auth.controllers");
const { getAllUsers, deleteUser } = require("../src/controllers/admin.controllers");

// Set dummy JWT_SECRET for test
process.env.JWT_SECRET = process.env.JWT_SECRET || "mock_jwt_secret_for_tests_12345678901234567890";

function createMockContext({ cookies = {}, headers = {}, params = {}, query = {}, user = null } = {}) {
  let statusCode = 200;
  let jsonResponse = null;

  const req = {
    cookies,
    headers,
    params,
    query,
    user,
  };

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      jsonResponse = payload;
      return this;
    },
  };

  return { req, res, getStatus: () => statusCode, getJson: () => jsonResponse };
}

async function runTests() {
  console.log("Starting Auth, Middleware, and Admin Tests...\n");
  let passedCount = 0;

  const userMock = {
    _id: "670b11111111111111111111",
    email: "regular@example.com",
    role: "user",
    tokenVersion: 2,
  };

  const adminMock = {
    _id: "670b22222222222222222222",
    email: "admin@example.com",
    role: "admin",
    tokenVersion: 0,
  };

  // Mock User.findById
  User.findById = (id) => ({
    select: () => ({
      lean: async () => {
        if (id === userMock._id) return { ...userMock };
        if (id === adminMock._id) return { ...adminMock };
        return null;
      },
    }),
  });

  // -------------------------------------------------------------
  // Test 1: protect middleware rejects missing token (401)
  // -------------------------------------------------------------
  {
    const ctx = createMockContext();
    let nextCalled = false;
    await protect(ctx.req, ctx.res, () => { nextCalled = true; });

    assert.strictEqual(ctx.getStatus(), 401);
    assert.strictEqual(ctx.getJson()?.message, "Authentication required.");
    assert.strictEqual(nextCalled, false);
    console.log("✔ Test 1 Passed: protect rejects missing token with 401.");
    passedCount++;
  }

  // -------------------------------------------------------------
  // Test 2: protect middleware accepts JWT in cookie and populates req.user with email
  // -------------------------------------------------------------
  {
    const token = jwt.sign(
      { id: userMock._id, tokenVersion: userMock.tokenVersion, role: userMock.role },
      process.env.JWT_SECRET
    );

    const ctx = createMockContext({ cookies: { token } });
    let nextCalled = false;
    await protect(ctx.req, ctx.res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(ctx.req.user.id, userMock._id);
    assert.strictEqual(ctx.req.user.email, userMock.email);
    assert.strictEqual(ctx.req.user.role, userMock.role);
    console.log("✔ Test 2 Passed: protect verifies cookie token and sets req.user (id, email, role).");
    passedCount++;
  }

  // -------------------------------------------------------------
  // Test 3: protect middleware accepts Authorization: Bearer <token>
  // -------------------------------------------------------------
  {
    const token = jwt.sign(
      { id: adminMock._id, tokenVersion: adminMock.tokenVersion, role: adminMock.role },
      process.env.JWT_SECRET
    );

    const ctx = createMockContext({ headers: { authorization: `Bearer ${token}` } });
    let nextCalled = false;
    await protect(ctx.req, ctx.res, () => { nextCalled = true; });

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(ctx.req.user.id, adminMock._id);
    assert.strictEqual(ctx.req.user.role, "admin");
    console.log("✔ Test 3 Passed: protect verifies Authorization: Bearer token header.");
    passedCount++;
  }

  // -------------------------------------------------------------
  // Test 4: protect middleware rejects stale tokenVersion (session invalidated)
  // -------------------------------------------------------------
  {
    // Token issued with older tokenVersion (1 vs DB tokenVersion 2)
    const staleToken = jwt.sign(
      { id: userMock._id, tokenVersion: 1, role: userMock.role },
      process.env.JWT_SECRET
    );

    const ctx = createMockContext({ cookies: { token: staleToken } });
    let nextCalled = false;
    await protect(ctx.req, ctx.res, () => { nextCalled = true; });

    assert.strictEqual(ctx.getStatus(), 401);
    assert.strictEqual(ctx.getJson()?.message, "Session is no longer valid. Please login again.");
    assert.strictEqual(nextCalled, false);
    console.log("✔ Test 4 Passed: protect rejects stale tokenVersion (session invalidation).");
    passedCount++;
  }

  // -------------------------------------------------------------
  // Test 5: GET /api/auth/me returns current user profile
  // -------------------------------------------------------------
  {
    const ctx = createMockContext({
      user: { id: userMock._id, email: userMock.email, role: userMock.role },
    });
    await getCurrentUser(ctx.req, ctx.res);

    assert.strictEqual(ctx.getStatus(), 200);
    const json = ctx.getJson();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.user.id, userMock._id);
    assert.strictEqual(json.user.email, userMock.email);
    assert.strictEqual(json.user.role, "user");
    console.log("✔ Test 5 Passed: getCurrentUser (GET /api/auth/me) returns id, email, role.");
    passedCount++;
  }

  // -------------------------------------------------------------
  // Test 6: Role middleware access control (requireUser vs requireAdmin)
  // -------------------------------------------------------------
  {
    // Normal user attempting admin route
    const ctxAdminReject = createMockContext({ user: { id: userMock._id, role: "user" } });
    let next1 = false;
    requireAdmin(ctxAdminReject.req, ctxAdminReject.res, () => { next1 = true; });
    assert.strictEqual(ctxAdminReject.getStatus(), 403);
    assert.strictEqual(ctxAdminReject.getJson()?.message, "Admin access required.");
    assert.strictEqual(next1, false);

    // Admin attempting user route
    const ctxUserReject = createMockContext({ user: { id: adminMock._id, role: "admin" } });
    let next2 = false;
    requireUser(ctxUserReject.req, ctxUserReject.res, () => { next2 = true; });
    assert.strictEqual(ctxUserReject.getStatus(), 403);
    assert.strictEqual(ctxUserReject.getJson()?.message, "Normal user access required.");
    assert.strictEqual(next2, false);

    console.log("✔ Test 6 Passed: requireAdmin and requireUser enforce role separation with 403.");
    passedCount++;
  }

  // -------------------------------------------------------------
  // Test 7: Admin deleteUser self-deletion prevention
  // -------------------------------------------------------------
  {
    const ctx = createMockContext({
      params: { id: adminMock._id },
      user: { id: adminMock._id, role: "admin" }, // Admin trying to delete their own account
    });

    await deleteUser(ctx.req, ctx.res);
    assert.strictEqual(ctx.getStatus(), 400);
    assert.strictEqual(ctx.getJson()?.message, "You cannot delete your own account here.");
    console.log("✔ Test 7 Passed: deleteUser prevents admin from deleting their own account.");
    passedCount++;
  }

  // -------------------------------------------------------------
  // Test 8: Admin getAllUsers pagination validation
  // -------------------------------------------------------------
  {
    const ctxInvalidPage = createMockContext({ query: { page: "-1", limit: "10" } });
    await getAllUsers(ctxInvalidPage.req, ctxInvalidPage.res);
    assert.strictEqual(ctxInvalidPage.getStatus(), 400);
    assert.strictEqual(
      ctxInvalidPage.getJson()?.message,
      "Page must be positive and limit must be between 1 and 100."
    );
    console.log("✔ Test 8 Passed: getAllUsers enforces pagination boundaries (1 to 100).");
    passedCount++;
  }

  console.log(`\nAll ${passedCount} Auth, Middleware, and Admin tests completed successfully!`);
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
