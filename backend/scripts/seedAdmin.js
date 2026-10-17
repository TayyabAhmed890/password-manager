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

// Generate a secure recovery code.
const { formattedCode, rawCode } = generateRecoveryCode();

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

    if (password.length < 12) {
      throw new Error(
        "Use an admin password with at least 12 characters."
      );
    }

    // Connect to MongoDB before querying users.
    await connectDB();

    // Check whether this admin account already exists.
    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      if (existingAdmin.role !== "admin") {
        existingAdmin.role = "admin";

        // Invalidate existing sessions after changing role.
        existingAdmin.tokenVersion += 1;

        await existingAdmin.save();
      }

      console.log("Admin account already exists.");
      return;
    }

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

seedAdmin();