const assert = require("assert");
const mongoose = require("mongoose");
const User = require("../src/models/user.model");

const connectDbPath = require.resolve("../src/db/connectDB");
const seedAdminPath = require.resolve("../scripts/seedAdmin");
require.cache[connectDbPath] = {
  id: connectDbPath,
  filename: connectDbPath,
  loaded: true,
  exports: async () => {},
};

let createdUser = false;
let disconnected = false;
User.findOne = async () => ({ _id: "existing", role: "user" });
User.create = async () => {
  createdUser = true;
};
mongoose.disconnect = async () => {
  disconnected = true;
};

process.env.ADMIN_EMAIL = "existing@example.com";
process.env.ADMIN_PASSWORD = "StrongAdminPassword123!";
const previousExitCode = process.exitCode;
const previousConsoleError = console.error;
let errorMessage = "";
console.error = (...messages) => {
  errorMessage = messages.join(" ");
};

async function runTests() {
  try {
    const seedAdmin = require(seedAdminPath);
    await seedAdmin();
    assert.match(errorMessage, /Refusing to promote it/);
    assert.strictEqual(createdUser, false);
    assert.strictEqual(disconnected, true);
    assert.strictEqual(process.exitCode, 1);
    console.log("✔ Admin seed refuses to promote an existing regular user.");
  } finally {
    console.error = previousConsoleError;
    process.exitCode = previousExitCode;
  }
}

runTests().catch((error) => {
  console.error("Admin seed test failed:", error);
  process.exitCode = 1;
});
