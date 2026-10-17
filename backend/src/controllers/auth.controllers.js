const bcrypt = require("bcryptjs");
const User = require("../models/user.model");

const generateToken = require("../utils/token");

const {
  generateRecoveryCode,
  normalizeRecoveryCode,
} = require("../utils/recoveryCode");


// ============================================================
// REGISTER
// ============================================================

const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ----------------------------------------------------------
    // Validate input types first.
    //
    // This prevents errors such as:
    // email.trim() when email is not a string.
    // ----------------------------------------------------------
    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // Normalize email so:
    // Test@Email.com
    // test@email.com
    //
    // are treated as the same account.
    const cleanEmail = email.trim().toLowerCase();

    // Password is intentionally NOT trimmed.
    //
    // Spaces can technically be part of a password,
    // so we should not silently modify the user's password.
    if (!cleanEmail || password.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Email and password cannot be empty.",
      });
    }

    // ----------------------------------------------------------
    // Password length validation
    //
    // bcrypt ignores bytes beyond 72 bytes in UTF-8 encoding.
    // We check byte length to properly handle multi-byte Unicode.
    // ----------------------------------------------------------
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    if (Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({
        success: false,
        message: "Password cannot exceed 72 bytes.",
      });
    }

    // ----------------------------------------------------------
    // Basic email format validation
    // ----------------------------------------------------------
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    // ----------------------------------------------------------
    // Check whether this email is already registered.
    // ----------------------------------------------------------
    const existingUser = await User.findOne({
      email: cleanEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // ----------------------------------------------------------
    // Hash the login/master password.
    //
    // IMPORTANT:
    // We HASH the login password because we never need to
    // recover the original password.
    // ----------------------------------------------------------
    const passwordHash = await bcrypt.hash(password, 12);

    // ----------------------------------------------------------
    // Generate a recovery code.
    //
    // rawCode:
    //   Used internally for hashing.
    //
    // formattedCode:
    //   Shown to the user once.
    // ----------------------------------------------------------
    const {
      rawCode,
      formattedCode,
    } = generateRecoveryCode();

    // Store only the bcrypt hash of the recovery code.
    //
    // The original recovery code should never be stored
    // directly in MongoDB.
    const recoveryCodeHash = await bcrypt.hash(
      rawCode,
      12
    );

    // ----------------------------------------------------------
    // Create the user.
    // ----------------------------------------------------------
    const user = await User.create({
      email: cleanEmail,
      passwordHash,
      recoveryCodeHash,
    });

    // ----------------------------------------------------------
    // Generate authentication token.
    //
    // tokenVersion is included so that we can invalidate old
    // JWTs after a password reset.
    // ----------------------------------------------------------
    // const token = generateToken(
    //   user._id.toString(),
    //   user.tokenVersion,
    //   user.role
    // );

    // ----------------------------------------------------------
    // Store JWT inside an httpOnly cookie.
    //
    // httpOnly:
    //   JavaScript cannot directly access the cookie.
    //
    // secure:
    //   HTTPS required in production.
    //
    // sameSite:
    //   lax locally, none for cross-site production setup.
    // ----------------------------------------------------------
    // res.cookie("token", token, {
    //   httpOnly: true,

    //   secure:
    //     process.env.NODE_ENV === "production",

    //   sameSite:
    //     process.env.NODE_ENV === "production"
    //       ? "none"
    //       : "lax",

    //   maxAge: 3 * 24 * 60 * 60 * 1000,

    //   // Explicitly set the same path used by clearCookie().
    //   path: "/",
    // });

    // ----------------------------------------------------------
    // Return user information + recovery code.
    //
    // The recovery code should only be shown once.
    // The frontend should tell the user to save it safely.
    //
    // We DO NOT return the JWT because it is already stored
    // inside the httpOnly cookie.
    // ----------------------------------------------------------
    return res.status(201).json({
      success: true,
      message: "Account created successfully.",

      recoveryCode: formattedCode,

      user: {
        id: user._id,
        email: user.email,
      },
    });

  } catch (error) {
    console.error("Register error:", error);

    // ----------------------------------------------------------
    // Edge case:
    //
    // Even though we check for an existing email above,
    // two requests could theoretically arrive at almost
    // exactly the same time.
    //
    // MongoDB's unique index is the final protection.
    //
    // Error code 11000 = duplicate key.
    // ----------------------------------------------------------
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while creating your account.",
    });
  }
};


// ============================================================
// LOGIN
// ============================================================

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ----------------------------------------------------------
    // Validate input types.
    // ----------------------------------------------------------
    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || password.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Email and password cannot be empty.",
      });
    }

    // ----------------------------------------------------------
    // Find the user by normalized email.
    // ----------------------------------------------------------
    const user = await User.findOne({
      email: cleanEmail,
    });

    // Do not reveal whether the email exists.
    //
    // Same message is used for:
    // - non-existing email
    // - wrong password
    //
    // This reduces user-enumeration risk.
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // ----------------------------------------------------------
    // Compare entered password with stored bcrypt hash.
    // ----------------------------------------------------------
    const isPasswordValid = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // ----------------------------------------------------------
    // Generate JWT.
    //
    // IMPORTANT:
    // Include current tokenVersion.
    //
    // If password is reset later:
    // tokenVersion increases.
    //
    // Old tokens will then fail middleware validation.
    // ----------------------------------------------------------
    const token = generateToken(
      user._id.toString(),
      user.tokenVersion,
      user.role
    );

    // ----------------------------------------------------------
    // Store JWT inside httpOnly cookie.
    // ----------------------------------------------------------
    res.cookie("token", token, {
      httpOnly: true,

      secure:
        process.env.NODE_ENV === "production",

      sameSite:
        process.env.NODE_ENV === "production"
          ? "none"
          : "lax",

      maxAge: 3 * 24 * 60 * 60 * 1000,

      // Keep this consistent with logout.
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Login successful.",

      user: {
        id: user._id,
        email: user.email,
      },
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while logging in.",
    });
  }
};


// ============================================================
// LOGOUT
// ============================================================

const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { tokenVersion: 1 },
    });

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to log out right now.",
    });
  }
};


// ============================================================
// FORGOT PASSWORD / RESET PASSWORD
// ============================================================

const forgotPassword = async (req, res) => {
  try {
    const {
      email,
      recoveryCode,
      newPassword,
    } = req.body;

    // ----------------------------------------------------------
    // Validate input types.
    // ----------------------------------------------------------
    if (
      typeof email !== "string" ||
      typeof recoveryCode !== "string" ||
      typeof newPassword !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Email, recovery code and new password are required.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // ----------------------------------------------------------
    // Check required values.
    // ----------------------------------------------------------
    if (
      !cleanEmail ||
      !recoveryCode.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Email and recovery code cannot be empty.",
      });
    }

    // ----------------------------------------------------------
    // Validate new password.
    //
    // bcrypt ignores bytes beyond 72 bytes in UTF-8 encoding.
    // We check byte length to properly handle multi-byte Unicode.
    // ----------------------------------------------------------
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 8 characters long.",
      });
    }

    if (Buffer.byteLength(newPassword, "utf8") > 72) {
      return res.status(400).json({
        success: false,
        message: "New password cannot exceed 72 bytes.",
      });
    }

    // ----------------------------------------------------------
    // Find user.
    // ----------------------------------------------------------
    const user = await User.findOne({
      email: cleanEmail,
    });

    // If user does not exist OR recovery code has already
    // been consumed, return the same generic error.
    if (
      !user ||
      !user.recoveryCodeHash
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or recovery code.",
      });
    }

    // ----------------------------------------------------------
    // Normalize recovery code.
    //
    // Example:
    //
    // ABCD-EFGH
    // abcd efgh
    // ABCDEFGH
    //
    // can all be normalized consistently.
    // ----------------------------------------------------------
    const normalizedCode =
      normalizeRecoveryCode(recoveryCode);

    // ----------------------------------------------------------
    // Edge-case validation:
    //
    // Our generator creates 32 hexadecimal characters.
    // Reject obviously invalid input before doing bcrypt.
    //
    // This is not a replacement for bcrypt verification;
    // it simply avoids unnecessary bcrypt work on malformed
    // input.
    // ----------------------------------------------------------
    const recoveryCodeRegex =
      /^[A-F0-9]{32}$/;

    if (!recoveryCodeRegex.test(normalizedCode)) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or recovery code.",
      });
    }

    // ----------------------------------------------------------
    // Compare entered recovery code with stored bcrypt hash.
    // ----------------------------------------------------------
    const isRecoveryCodeValid =
      await bcrypt.compare(
        normalizedCode,
        user.recoveryCodeHash
      );

    if (!isRecoveryCodeValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or recovery code.",
      });
    }

    // ----------------------------------------------------------
    // Hash the new password.
    // ----------------------------------------------------------
    const newPasswordHash =
      await bcrypt.hash(newPassword, 12);

    // ----------------------------------------------------------
    // Rotate recovery code.
    //
    // Issue a brand new recovery code so the user is not
    // permanently locked out in future recoveries.
    // Store only its bcrypt hash in MongoDB.
    // ----------------------------------------------------------
    const { rawCode, formattedCode } = generateRecoveryCode();
    const newRecoveryCodeHash = await bcrypt.hash(rawCode, 12);

    // ----------------------------------------------------------
    // Atomic update to prevent race conditions and concurrent reuse.
    //
    // Matching recoveryCodeHash ensures that if two requests with
    // the same code arrive concurrently, only ONE can succeed.
    // Invalidate previously issued tokens by incrementing tokenVersion.
    // ----------------------------------------------------------
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: user._id,
        recoveryCodeHash: user.recoveryCodeHash,
      },
      {
        $set: {
          passwordHash: newPasswordHash,
          recoveryCodeHash: newRecoveryCodeHash,
        },
        $inc: {
          tokenVersion: 1,
        },
      },
      {
        new: true,
      }
    );

    if (!updatedUser) {
      return res.status(409).json({
        success: false,
        message: "Password reset conflicted or recovery code already consumed.",
      });
    }

    // ----------------------------------------------------------
    // Remove current authentication cookie.
    //
    // User must login again with the new password.
    // ----------------------------------------------------------
    res.clearCookie("token", {
      httpOnly: true,

      secure:
        process.env.NODE_ENV === "production",

      sameSite:
        process.env.NODE_ENV === "production"
          ? "none"
          : "lax",

      path: "/",
    });

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully. Please save your new recovery code and login again.",
      newRecoveryCode: formattedCode,
    });

  } catch (error) {
    console.error(
      "Forgot password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while resetting your password.",
    });
  }
};


// ============================================================
// GET CURRENT USER / SESSION CHECK
// ============================================================

const getCurrentUser = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve session.",
    });
  }
};


// ============================================================
// EXPORT CONTROLLERS
// ============================================================

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  getCurrentUser,
};