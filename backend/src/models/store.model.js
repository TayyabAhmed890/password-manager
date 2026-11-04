const mongoose = require("mongoose");

const passwordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
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
    encryptionVersion: {
      type: Number,
      required: true,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// This index also supports userId-only queries through its leading field.
passwordSchema.index({
  userId: 1,
  createdAt: -1,
});

const passwordModel = mongoose.model(
  "password",
  passwordSchema
);

module.exports = passwordModel