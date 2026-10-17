const mongoose = require("mongoose");

const passwordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },

    website: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },

    encryptedPassword: {
      type: String,
      required: true,
    },

    iv: {
      type: String,
      required: true,
    },

    authTag: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// User ke passwords fetch karne mein useful
passwordSchema.index({
  userId: 1,
  createdAt: -1,
});

const passwordModel = mongoose.model(
  "password",
  passwordSchema
);

module.exports = passwordModel