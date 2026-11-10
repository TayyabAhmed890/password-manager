const mongoose = require("mongoose");
const Password = require("../models/store.model");
const getUserVaultKey = require("../utils/userVaultKey");
const {
  cachePassword,
  cacheVaultList,
  getCachedPassword,
  getCachedVaultList,
  invalidateVaultCache,
} = require("../utils/vaultCache");
const { invalidateAdminUsersCache } = require("../utils/adminUsersCache");
const { isValidEmail, normalizeEmail } = require("../utils/inputValidation");
const {
  MAX_VAULT_ENTRIES,
  ensureVaultEntryCount,
  reserveVaultEntrySlot,
  releaseVaultEntrySlot,
} = require("../utils/vaultEntryLimit");

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

    const rawSearch = req.query?.search;
    if (rawSearch !== undefined && typeof rawSearch !== "string") {
      return res.status(400).json({
        success: false,
        message: "Search must be a single text value.",
      });
    }

    if (rawSearch && rawSearch.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Search must be 100 characters or fewer.",
      });
    }
    const search = rawSearch?.trim() || "";

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
    let passwords = await getCachedVaultList(userId);
    const cacheHit = Array.isArray(passwords);

    if (!cacheHit) {
      passwords = await Password.find({
        userId,
      })
        .select("website email createdAt")
        .sort({
          createdAt: -1,
        })
        .lean();

      passwords = passwords.map((entry) => ({
        id: String(entry._id),
        website: entry.website,
        email: entry.email,
        createdAt: entry.createdAt,
      }));
      await cacheVaultList(userId, passwords);
    }

    console.info(`[vault-cache] GET /api/store source=${cacheHit ? "Upstash" : "MongoDB"}`);

    const currentCount = passwords.length;
    const normalizedSearch = search.toLowerCase();
    const filteredPasswords = normalizedSearch
      ? passwords.filter((entry) =>
          (typeof entry.website === "string" &&
            entry.website.toLowerCase().includes(normalizedSearch)) ||
          (typeof entry.email === "string" &&
            entry.email.toLowerCase().includes(normalizedSearch))
        )
      : passwords;

    // ----------------------------------------------------------
    // Empty vault is not an error.
    // Return 200 with an empty array.
    // ----------------------------------------------------------
    if (currentCount === 0) {
      return res.status(200).json({
        success: true,
        message: "You haven't saved any passwords yet.",
        data: [],
        vault: { currentCount, maxEntries: MAX_VAULT_ENTRIES },
      });
    }

    return res.status(200).json({
      success: true,
      message: filteredPasswords.length
        ? "Passwords fetched successfully."
        : "No saved passwords match your search.",
      data: filteredPasswords,
      vault: { currentCount, maxEntries: MAX_VAULT_ENTRIES },
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
    } = req.body || {};

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
    const cleanEmail = normalizeEmail(email);

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

    if (cleanEmail.length > 254) {
      return res.status(400).json({
        success: false,
        message: "Email is too long.",
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
    if (!isValidEmail(cleanEmail)) {
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
    let session;
    let savedPassword;
    try {
      session = await mongoose.startSession();
      await session.withTransaction(async () => {
        await reserveVaultEntrySlot(userId, session);
        const dek = await getUserVaultKey(userId);
        let encryptedPassword;

        try {
          encryptedPassword = encrypt(password, dek);
        } finally {
          dek.fill(0);
        }

        [savedPassword] = await Password.create(
          [{
            userId,
            website: cleanWebsite,
            email: cleanEmail,
            encryptedPassword: encryptedPassword.encrypted,
            iv: encryptedPassword.iv,
            authTag: encryptedPassword.authTag,
            encryptionVersion: 1,
          }],
          { session }
        );
      });
    } finally {
      if (session) await session.endSession();
    }

    if (!savedPassword) {
      throw new Error("Vault entry transaction did not complete.");
    }

    await invalidateVaultCache(userId);
    await invalidateAdminUsersCache();
    await cachePassword(userId, String(savedPassword._id), {
      encryptedPassword: savedPassword.encryptedPassword,
      iv: savedPassword.iv,
      authTag: savedPassword.authTag,
      encryptionVersion: savedPassword.encryptionVersion,
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
    if (error.code === "VAULT_LIMIT_REACHED") {
      return res.status(409).json({
        success: false,
        code: error.code,
        message: "Your vault is full. Delete a saved password before adding another.",
      });
    }

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
    let entry = await getCachedPassword(userId, id);
    const cacheHit = Boolean(
      entry &&
      typeof entry.encryptedPassword === "string" &&
      typeof entry.iv === "string" &&
      typeof entry.authTag === "string"
    );

    if (!cacheHit) {
      entry = await Password.findOne({
        _id: id,
        userId,
      })
        .select(
          "encryptedPassword iv authTag encryptionVersion"
        )
        .lean();

      if (entry) {
        await cachePassword(userId, id, entry);
      }
    }

    console.info(
      `[vault-cache] GET /api/store/:id/password source=${cacheHit ? "Upstash" : "MongoDB"}`
    );

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

    if (entry.encryptionVersion !== 1) {
      return res.status(500).json({
        success: false,
        message: "This password could not be decrypted.",
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
      const dek = await getUserVaultKey(userId);
      try {
        originalPassword = decrypt(
          entry.encryptedPassword,
          entry.iv,
          entry.authTag,
          dek
        );
      } finally {
        dek.fill(0);
      }

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

    const { website, email, password } = req.body || {};

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

      const cleanEmail = normalizeEmail(email);

      if (!cleanEmail) {
        return res.status(400).json({
          success: false,
          message: "Email cannot be empty.",
        });
      }

      if (cleanEmail.length > 254) {
        return res.status(400).json({
          success: false,
          message: "Email is too long.",
        });
      }

      if (!isValidEmail(cleanEmail)) {
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
      const dek = await getUserVaultKey(userId);
      try {
        const encryptedPassword = encrypt(password, dek);
        savedPassword.encryptedPassword = encryptedPassword.encrypted;
        savedPassword.iv = encryptedPassword.iv;
        savedPassword.authTag = encryptedPassword.authTag;
        savedPassword.encryptionVersion = 1;
      } finally {
        dek.fill(0);
      }
    }

    // Save updated record
    await savedPassword.save();
    await invalidateVaultCache(userId, id);
    await cachePassword(userId, id, {
      encryptedPassword: savedPassword.encryptedPassword,
      iv: savedPassword.iv,
      authTag: savedPassword.authTag,
      encryptionVersion: savedPassword.encryptionVersion,
    });

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
    let deletedPassword;
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await ensureVaultEntryCount(userId, session);
        deletedPassword = await Password.findOneAndDelete({
          _id: id,
          userId,
        }).session(session);

        if (deletedPassword) {
          await releaseVaultEntrySlot(userId, session);
        }
      });
    } finally {
      await session.endSession();
    }

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

    await invalidateVaultCache(userId, id);
    await invalidateAdminUsersCache();

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