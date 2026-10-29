const assert = require("assert");
const mongoose = require("mongoose");
const connectDB = require("../src/db/connectDB");

async function runTests() {
  const originalConnect = mongoose.connect;
  const originalReadyState = mongoose.connection.readyState;
  const originalMongoUri = process.env.MONGODB_URI;
  const originalMongoAltUri = process.env.MONGO_URI;

  try {
    delete process.env.MONGODB_URI;
    delete process.env.MONGO_URI;

    await assert.rejects(
      connectDB(),
      /MONGODB_URI is missing from environment variables/
    );
    console.log("✔ Test 1 Passed: Missing MongoDB URI is rejected clearly.");

    process.env.MONGODB_URI = "mongodb://unit.test/password-manager";
    mongoose.connection.readyState = 0;

    let connectCalls = 0;
    let resolveConnection;
    mongoose.connect = (uri, options) => {
      connectCalls++;
      assert.strictEqual(uri, process.env.MONGODB_URI);
      assert.strictEqual(options.serverSelectionTimeoutMS, 5000);
      return new Promise((resolve) => {
        resolveConnection = resolve;
      });
    };

    const firstRequest = connectDB();
    const secondRequest = connectDB();

    assert.strictEqual(connectCalls, 1);
    mongoose.connection.readyState = 1;
    resolveConnection(mongoose);
    await Promise.all([firstRequest, secondRequest]);
    console.log("✔ Test 2 Passed: Concurrent calls share one pending MongoDB connection.");

    await connectDB();
    assert.strictEqual(connectCalls, 1);
    console.log("✔ Test 3 Passed: An established MongoDB connection is reused.");

    mongoose.connection.readyState = 0;
    mongoose.connect = () => {
      connectCalls++;
      throw new Error("simulated connection failure");
    };

    await assert.rejects(connectDB(), /simulated connection failure/);

    mongoose.connect = async () => {
      connectCalls++;
      mongoose.connection.readyState = 1;
      return mongoose;
    };

    await connectDB();
    assert.strictEqual(connectCalls, 3);
    console.log("✔ Test 4 Passed: A failed connection attempt can be retried.");
  } finally {
    mongoose.connect = originalConnect;
    mongoose.connection.readyState = originalReadyState;

    if (originalMongoUri === undefined) {
      delete process.env.MONGODB_URI;
    } else {
      process.env.MONGODB_URI = originalMongoUri;
    }

    if (originalMongoAltUri === undefined) {
      delete process.env.MONGO_URI;
    } else {
      process.env.MONGO_URI = originalMongoAltUri;
    }
  }
}

runTests().catch((error) => {
  console.error("MongoDB connection test failed:", error);
  process.exitCode = 1;
});
