const assert = require("assert");
const mongoose = require("mongoose");
const User = require("../src/models/user.model");
const Password = require("../src/models/store.model");

async function runTests() {
  console.log("Starting Phase 1C Model Schema Casing Tests...\n");
  let passedCount = 0;

  // 1. Verify User model name in Mongoose registry
  assert.strictEqual(User.modelName, "user", "User model should be registered as 'user'");
  console.log("✔ Test 1 Passed: User model is registered as 'user'.");
  passedCount++;

  // 2. Verify store.model.js userId field schema reference
  const userIdPath = Password.schema.path("userId");
  assert(userIdPath, "userId path must exist in Password schema");
  assert.strictEqual(
    userIdPath.options.ref,
    "user",
    "Password schema userId ref must be exactly 'user' to match User modelName"
  );
  console.log("✔ Test 2 Passed: Password schema userId references 'user' with matching casing.");
  passedCount++;

  // 3. Verify Mongoose model registry can resolve the reference
  const referencedModel = mongoose.model(userIdPath.options.ref);
  assert.strictEqual(
    referencedModel,
    User,
    "mongoose.model('user') must resolve to the registered User model"
  );
  console.log("✔ Test 3 Passed: Mongoose successfully resolves reference to the User model without MissingSchemaError.");
  passedCount++;

  console.log(`\nAll ${passedCount} Phase 1C model schema tests completed successfully!`);
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
