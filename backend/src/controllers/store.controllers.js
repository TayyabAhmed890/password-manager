const mongoose = require("mongoose");
const Password = require("../models/store.model");

const {
  encrypt,
  decrypt,
} = require("../utils/encryption");


// ============================================================
// GET ALL SAVED PASSWORDS
// ============================================================

const getPasswords = async (req, res) => {
  try {
    // ----------------------------------------------------------
    // Authentication middleware should already set req.user.
    // Still, we validate it here so this controller doesn't
    // accidentally run without a valid user ID.
    // ----------------------------------------------------------
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login first.",
      });
    }

    // ----------------------------------------------------------
    // Fetch only the information needed for the password list.
    //
    // IMPORTANT:
    // We intentionally DO NOT fetch/decrypt the actual password.
    //
    // The frontend can call revealPassword when the user clicks
    // the eye button for a specific entry.
    //
    // This prevents every saved password from being decrypted
    // and sent to the client on every request.
    // ----------------------------------------------------------
    const passwords = await Password.find({
      userId,
    })
      .select("website email createdAt")
      .sort({
        createdAt: -1,
      })
      .lean();

    // ----------------------------------------------------------
    // Empty vault is not an error.
    // Return 200 with an empty array.
    // ----------------------------------------------------------
    if (passwords.length === 0) {
      return res.status(200).json({
        success: true,
        message: "You haven't saved any passwords yet.",
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Passwords fetched successfully.",
      data: passwords.map((entry) => ({
        id: entry._id,
        website: entry.website,
        email: entry.email,
        createdAt: entry.createdAt,
      })),
    });

  } catch (error) {
    console.error("Get passwords error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching your passwords.",
    });
  }
};


// ============================================================
// CREATE / SAVE PASSWORD
// ============================================================

const createPassword = async (req, res) => {
  try {
    // ----------------------------------------------------------
    // Get authenticated user ID.
    // ----------------------------------------------------------
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login to save a password.",
      });
    }

    const {
      website,
      email,
      password,
    } = req.body;

    // ----------------------------------------------------------
    // Validate input types.
    //
    // This prevents operations such as:
    // email.trim() when email is an object/number/etc.
    // ----------------------------------------------------------
    if (
      typeof website !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Website, email and password must be provided.",
      });
    }

    // ----------------------------------------------------------
    // Normalize fields that should not contain unnecessary
    // whitespace.
    //
    // Password is intentionally NOT trimmed because spaces
    // can legitimately be part of a password.
    // ----------------------------------------------------------
    const cleanWebsite = website.trim();
    const cleanEmail = email.trim().toLowerCase();

    // ----------------------------------------------------------
    // Required-field validation.
    // ----------------------------------------------------------
    if (!cleanWebsite) {
      return res.status(400).json({
        success: false,
        message: "Website name is required.",
      });
    }

    if (!cleanEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    if (password.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Password cannot be empty.",
      });
    }

    // ----------------------------------------------------------
    // Length validation.
    //
    // These limits also protect the API from unnecessarily
    // large request data.
    // ----------------------------------------------------------
    if (cleanWebsite.length > 255) {
      return res.status(400).json({
        success: false,
        message: "Website name is too long.",
      });
    }

    if (cleanEmail.length > 254) {
      return res.status(400).json({
        success: false,
        message: "Email is too long.",
      });
    }

    // 4096 characters is already far beyond normal password
    // length but still gives the user room for long passwords.
    if (password.length > 4096) {
      return res.status(400).json({
        success: false,
        message: "Password is too long.",
      });
    }

    // ----------------------------------------------------------
    // Basic email format validation.
    // ----------------------------------------------------------
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    // ----------------------------------------------------------
    // Encrypt the website password.
    //
    // IMPORTANT:
    // We encrypt this password because we need to decrypt it
    // later when the user clicks "reveal".
    //
    // We do NOT hash it.
    // ----------------------------------------------------------
    const {
      encrypted,
      iv,
      authTag,
    } = encrypt(password);

    // ----------------------------------------------------------
    // Store only the encrypted password and its decryption
    // metadata in MongoDB.
    // ----------------------------------------------------------
    const savedPassword = await Password.create({
      userId,
      website: cleanWebsite,
      email: cleanEmail,

      encryptedPassword: encrypted,
      iv,
      authTag,
    });

    // ----------------------------------------------------------
    // Never return the plaintext password or encryption data
    // to the frontend after saving.
    // ----------------------------------------------------------
    return res.status(201).json({
      success: true,
      message: "Password saved successfully.",

      data: {
        id: savedPassword._id,
        website: savedPassword.website,
        email: savedPassword.email,
        createdAt: savedPassword.createdAt,
      },
    });

  } catch (error) {
    console.error("Create password error:", error);

    // Mongoose validation error.
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid password entry.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while saving your password.",
    });
  }
};


// ============================================================
// REVEAL ONE PASSWORD
// ============================================================

const revealPassword = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    // ----------------------------------------------------------
    // Authentication check.
    // ----------------------------------------------------------
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login first.",
      });
    }

    // ----------------------------------------------------------
    // Validate MongoDB ObjectId before querying.
    //
    // Without this check, an invalid ID can result in a
    // Mongoose CastError and unnecessarily become a 500 error.
    // ----------------------------------------------------------
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid password ID.",
      });
    }

    // ----------------------------------------------------------
    // Find the entry using BOTH:
    //
    // _id    → requested password entry
    // userId → authenticated user
    //
    // This is critical for authorization.
    //
    // User A must NEVER be able to reveal User B's password
    // simply by knowing/guessing the entry ID.
    // ----------------------------------------------------------
    const entry = await Password.findOne({
      _id: id,
      userId,
    })
      .select(
        "encryptedPassword iv authTag"
      )
      .lean();

    // ----------------------------------------------------------
    // Same response whether:
    // - entry doesn't exist
    // - entry belongs to another user
    //
    // This avoids unnecessarily revealing whether another
    // user's record exists.
    // ----------------------------------------------------------
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: "Password entry not found.",
      });
    }

    // ----------------------------------------------------------
    // Decrypt only this specific password.
    //
    // AES-GCM authentication also detects if the encrypted
    // data has been modified/tampered with.
    // ----------------------------------------------------------
    let originalPassword;

    try {
      originalPassword = decrypt(
        entry.encryptedPassword,
        entry.iv,
        entry.authTag
      );

    } catch (error) {
      // Do not expose encryption/decryption internals to client.
      console.error(
        "Password decryption failed:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "This password could not be decrypted.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password revealed successfully.",

      data: {
        password: originalPassword,
      },
    });

  } catch (error) {
    console.error(
      "Reveal password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while retrieving the password.",
    });
  }
};


// ============================================================
// UPDATE PASSWORD RECORD
// ============================================================

const updatePassword = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    // ----------------------------------------------------------
    // Authentication check
    // ----------------------------------------------------------
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login first.",
      });
    }

    // ----------------------------------------------------------
    // Validate MongoDB ObjectId
    // ----------------------------------------------------------
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid password record ID.",
      });
    }

    const { website, email, password } = req.body;

    // ----------------------------------------------------------
    // At least one field must be provided for update
    // ----------------------------------------------------------
    if (
      website === undefined &&
      email === undefined &&
      password === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update.",
      });
    }

    // ----------------------------------------------------------
    // Find record belonging strictly to the authenticated user (IDOR protection)
    // ----------------------------------------------------------
    const savedPassword = await Password.findOne({
      _id: id,
      userId,
    });

    if (!savedPassword) {
      return res.status(404).json({
        success: false,
        message: "Password record not found.",
      });
    }

    // ----------------------------------------------------------
    // Update website (if provided)
    // ----------------------------------------------------------
    if (website !== undefined) {
      if (typeof website !== "string") {
        return res.status(400).json({
          success: false,
          message: "Website must be a string.",
        });
      }

      const cleanWebsite = website.trim();

      if (!cleanWebsite) {
        return res.status(400).json({
          success: false,
          message: "Website name cannot be empty.",
        });
      }

      if (cleanWebsite.length > 255) {
        return res.status(400).json({
          success: false,
          message: "Website name is too long.",
        });
      }

      savedPassword.website = cleanWebsite;
    }

    // ----------------------------------------------------------
    // Update email (if provided)
    // ----------------------------------------------------------
    if (email !== undefined) {
      if (typeof email !== "string") {
        return res.status(400).json({
          success: false,
          message: "Email must be a string.",
        });
      }

      const cleanEmail = email.trim().toLowerCase();

      if (!cleanEmail) {
        return res.status(400).json({
          success: false,
          message: "Email cannot be empty.",
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (cleanEmail.length > 254 || !emailRegex.test(cleanEmail)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email address.",
        });
      }

      savedPassword.email = cleanEmail;
    }

    // ----------------------------------------------------------
    // Update and re-encrypt password (if provided)
    // ----------------------------------------------------------
    if (password !== undefined) {
      if (typeof password !== "string") {
        return res.status(400).json({
          success: false,
          message: "Password must be a string.",
        });
      }

      if (password.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Password cannot be empty.",
        });
      }

      if (password.length > 4096) {
        return res.status(400).json({
          success: false,
          message: "Password is too long.",
        });
      }

      // Encrypt with fresh random IV and authentication tag
      const { encrypted, iv, authTag } = encrypt(password);

      savedPassword.encryptedPassword = encrypted;
      savedPassword.iv = iv;
      savedPassword.authTag = authTag;
    }

    // Save updated record
    await savedPassword.save();

    return res.status(200).json({
      success: true,
      message: "Password record updated successfully.",
      data: {
        id: savedPassword._id,
        website: savedPassword.website,
        email: savedPassword.email,
        createdAt: savedPassword.createdAt,
        updatedAt: savedPassword.updatedAt,
      },
    });

  } catch (error) {
    console.error("Update password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update password right now.",
    });
  }
};


// ============================================================
// DELETE PASSWORD
// ============================================================

const deletePassword = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    // ----------------------------------------------------------
    // Authentication check.
    // ----------------------------------------------------------
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login first.",
      });
    }

    // ----------------------------------------------------------
    // Validate MongoDB ObjectId.
    //
    // Otherwise an invalid ID can cause a Mongoose CastError
    // and incorrectly become a 500 response.
    // ----------------------------------------------------------
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid password ID.",
      });
    }

    // ----------------------------------------------------------
    // Delete only if BOTH conditions match:
    //
    // _id    → requested entry
    // userId → currently authenticated user
    //
    // This prevents cross-user deletion.
    // ----------------------------------------------------------
    const deletedPassword =
      await Password.findOneAndDelete({
        _id: id,
        userId,
      });

    // ----------------------------------------------------------
    // No matching record.
    //
    // This can mean:
    // - ID doesn't exist
    // - entry belongs to another user
    // ----------------------------------------------------------
    if (!deletedPassword) {
      return res.status(404).json({
        success: false,
        message: "Password entry not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password entry deleted successfully.",
    });

  } catch (error) {
    console.error(
      "Delete password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while deleting your password.",
    });
  }
};


// ============================================================
// EXPORT CONTROLLERS
// ============================================================

module.exports = {
  createPassword,
  getPasswords,
  revealPassword,
  deletePassword,
  updatePassword,
};