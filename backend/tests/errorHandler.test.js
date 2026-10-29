const assert = require("assert");
const express = require("express");
const mongoose = require("mongoose");

// Keep this HTTP test isolated from the configured database.
const connectDBPath = require.resolve("../src/db/connectDB");
let databaseConnectionError = null;
require.cache[connectDBPath] = {
  exports: async () => {
    if (databaseConnectionError) {
      throw databaseConnectionError;
    }
  },
};

const startServer = require("../src/index");
const app = startServer.app;

// Extract the centralized error-handling middleware from the Express app stack (it is the 4-arg middleware)
const errorHandlerLayer = app.router.stack.find(
  (layer) => layer.handle && layer.handle.length === 4
);
const errorHandler = errorHandlerLayer ? errorHandlerLayer.handle : null;

// Helper to mock Express req and res
function createMockContext() {
  let statusCode = 200;
  let jsonResponse = null;

  const req = {};
  const res = {
    headersSent: false,
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      jsonResponse = payload;
      return this;
    },
  };

  return {
    req,
    res,
    getStatus: () => statusCode,
    getJson: () => jsonResponse,
  };
}

async function runTests() {
  console.log("Starting Phase 1D Centralized Error Handler Tests...\n");
  let passedCount = 0;

  assert(errorHandler, "Centralized 4-argument error handler must exist in the app middleware stack");
  console.log("✔ Test 1 Passed: Centralized 4-argument error handler is correctly mounted.");
  passedCount++;

  // Start the Express app on an ephemeral port (port 0) for real HTTP end-to-end testing
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    {
      const res = await fetch(`${baseUrl}/health/live`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get("x-content-type-options"), "nosniff");
      assert.strictEqual(res.headers.get("x-frame-options"), "SAMEORIGIN");
      assert.strictEqual(res.headers.get("x-powered-by"), null);
      assert.deepStrictEqual(await res.json(), {
        success: true,
        status: "alive",
      });
      console.log("✔ Health test passed: liveness works and security headers are present.");
      passedCount++;
    }

    {
      const res = await fetch(`${baseUrl}/health/ready`);
      assert.strictEqual(res.status, 503);
      assert.deepStrictEqual(await res.json(), {
        success: false,
        status: "not_ready",
      });
      console.log("✔ Health test passed: readiness reports a disconnected database.");
      passedCount++;
    }

    {
      const previousReadyState = mongoose.connection.readyState;
      mongoose.connection.readyState = 1;

      try {
        const res = await fetch(`${baseUrl}/health/ready`);
        assert.strictEqual(res.status, 200);
        assert.deepStrictEqual(await res.json(), {
          success: true,
          status: "ready",
        });
        console.log("✔ Health test passed: readiness reports a connected database.");
        passedCount++;
      } finally {
        mongoose.connection.readyState = previousReadyState;
      }
    }

    {
      databaseConnectionError = new Error("sensitive database connection detail");

      try {
        const res = await fetch(`${baseUrl}/api/auth/me`);
        assert.strictEqual(res.status, 503);
        assert.deepStrictEqual(await res.json(), {
          success: false,
          message: "Service temporarily unavailable.",
        });
        console.log("✔ API test passed: database failure returns a safe 503 response.");
        passedCount++;
      } finally {
        databaseConnectionError = null;
      }
    }

    // -------------------------------------------------------------
    // Unknown Route returns 404 JSON
    // -------------------------------------------------------------
    {
      const res = await fetch(`${baseUrl}/api/non-existent-route-12345`);
      assert.strictEqual(res.status, 404);
      const json = await res.json();
      assert.strictEqual(json.success, false);
      assert.strictEqual(json.message, "Route not found.");
      console.log("✔ Test Passed: Unknown route handled cleanly with 404 JSON.");
      passedCount++;
    }

    // -------------------------------------------------------------
    // Malformed JSON payload is formatted by the error handler
    // -------------------------------------------------------------
    {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: '{"email": "broken-json', // Malformed JSON syntax
      });

      assert.strictEqual(res.status, 400);
      const json = await res.json();
      assert.strictEqual(json.success, false);
      assert.strictEqual(json.message, "Malformed JSON payload in request body.");
      console.log("✔ Test Passed: Malformed JSON body is returned as 400 JSON.");
      passedCount++;
    }

    // -------------------------------------------------------------
    // Payload too large (exceeds 10kb limit) returns 413 JSON
    // -------------------------------------------------------------
    {
      const largePayload = JSON.stringify({ data: "x".repeat(15 * 1024) }); // ~15kb
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: largePayload,
      });

      assert.strictEqual(res.status, 413);
      const json = await res.json();
      assert.strictEqual(json.success, false);
      assert.strictEqual(json.message, "Request payload too large.");
      console.log("✔ Test Passed: Payload exceeding 10kb returns 413 JSON.");
      passedCount++;
    }
  } finally {
    if (server.closeAllConnections) server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }

  // -------------------------------------------------------------
  // Test 5: Production internal error (500) hides sensitive database details
  // -------------------------------------------------------------
  {
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    const ctx = createMockContext();
    const sensitiveDbError = new Error("FATAL: connection to database server failed at mongo.cluster.internal:27017");
    sensitiveDbError.statusCode = 500;

    errorHandler(sensitiveDbError, ctx.req, ctx.res, () => {});

    assert.strictEqual(ctx.getStatus(), 500);
    const json = ctx.getJson();
    assert.strictEqual(json.success, false);
    assert.strictEqual(
      json.message,
      "An internal server error occurred.",
      "Internal database error message must be redacted in production"
    );
    assert.strictEqual(json.stack, undefined, "Stack trace must never be leaked");

    process.env.NODE_ENV = prevEnv;
    console.log("✔ Test 5 Passed: 500 error redacts internal database details and stack traces in production.");
    passedCount++;
  }

  // -------------------------------------------------------------
  // Test 6: Development internal error (500) provides helpful error message without stack trace
  // -------------------------------------------------------------
  {
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const ctx = createMockContext();
    const devError = new Error("Specific validation failure in controller");
    devError.statusCode = 500;

    errorHandler(devError, ctx.req, ctx.res, () => {});

    assert.strictEqual(ctx.getStatus(), 500);
    const json = ctx.getJson();
    assert.strictEqual(json.success, false);
    assert.strictEqual(json.message, "Specific validation failure in controller");
    assert.strictEqual(json.stack, undefined, "Stack trace must never be leaked in response even in development");

    process.env.NODE_ENV = prevEnv;
    console.log("✔ Test 6 Passed: Development mode displays error message without leaking stack traces.");
    passedCount++;
  }

  // -------------------------------------------------------------
  // Test 7: Express 5 async error handling integration
  // -------------------------------------------------------------
  {
    // Create an isolated Express 5 mini-app to prove unhandled async controller rejections route to errorHandler
    const testApp = express();
    testApp.get("/test-async", async (req, res) => {
      // Throw an async error without try/catch
      throw new Error("Async failure inside async controller");
    });
    testApp.use(errorHandler);

    const testServer = await new Promise((resolve) => {
      const s = testApp.listen(0, () => resolve(s));
    });
    const testPort = testServer.address().port;

    try {
      const res = await fetch(`http://127.0.0.1:${testPort}/test-async`);
      assert.strictEqual(res.status, 500);
      const json = await res.json();
      assert.strictEqual(json.success, false);
      console.log("✔ Test 7 Passed: Express 5 automatically routes unhandled async controller errors to centralized handler.");
      passedCount++;
    } finally {
      if (testServer.closeAllConnections) testServer.closeAllConnections();
      await new Promise((resolve) => testServer.close(resolve));
    }
  }

  console.log(`\nAll ${passedCount} Phase 1D centralized error-handler tests completed successfully!`);
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exitCode = 1;
});
