const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const connectDB = require("../src/db/connectDB");
const User = require("../src/models/user.model");
const {
  generateRecoveryCode,
} = require("../src/utils/recoveryCode");

const seedAdmin = async () => {
  try {
    // Validate required environment variables.
    const email = process.env.ADMIN_EMAIL
      ?.trim()
      .toLowerCase();

    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      throw new Error(
        "ADMIN_EMAIL and ADMIN_PASSWORD are required."
      );
    }

    if (password.length < 12 || Buffer.byteLength(password, "utf8") > 72) {
      throw new Error(
        "Admin password must be at least 12 characters and no more than 72 UTF-8 bytes."
      );
    }

    // Connect to MongoDB before querying users.
    await connectDB();

    const existingUser = await User.findOne({ email });

    if (existingUser?.role === "admin") {
      console.log("Admin account already exists.");
      return;
    }

    if (existingUser) {
      throw new Error(
        "That email belongs to a non-admin account. Refusing to promote it."
      );
    }

    const { formattedCode, rawCode } = generateRecoveryCode();
    // Hash the password before storing it.
    const passwordHash = await bcrypt.hash(password, 12);
    // Hash the recovery code before storing it.
    const recoveryCodeHash = await bcrypt.hash(
      rawCode,
      12
    );

    // Create the initial admin account.
    await User.create({
      email,
      passwordHash,
      recoveryCodeHash,
      role: "admin",
    });

    // Show the recovery code only once.
    console.log("\nAdmin account created successfully.");
    console.log("Admin email:", email);
    console.log("Recovery code:", formattedCode);
    console.log(
      "Save this code securely. It will not be shown again."
    );
    
  } catch (error) {
    console.error("Admin seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    // Close the database connection when the script finishes.
    await mongoose.disconnect();
  }
};

if (require.main === module) {
  seedAdmin();
}

module.exports = seedAdmin;