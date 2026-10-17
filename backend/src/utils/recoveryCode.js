const crypto = require("crypto");

// Generate a cryptographically secure recovery code.
//
// The actual recovery code is shown to the user once.
// Only its bcrypt hash should be stored in the database.
const generateRecoveryCode = () => {
  // Generate 16 random bytes = 32 hexadecimal characters.
  const rawCode = crypto
    .randomBytes(16)
    .toString("hex")
    .toUpperCase();

  // Format the code into readable groups:
  // XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX
  const formattedCode = rawCode
    .match(/.{1,8}/g)
    .join("-");

  return {
    // Raw code is used for hashing.
    rawCode,

    // Formatted code is shown to the user.
    formattedCode,
  };
};


// Normalize a recovery code before comparing it.
//
// This allows users to enter the code with or without
// hyphens/spaces and with lowercase or uppercase letters.
const normalizeRecoveryCode = (code) => {
  if (typeof code !== "string") {
    return "";
  }

  return code
    .replace(/-/g, "")
    .replace(/\s/g, "")
    .toUpperCase();
};


module.exports = {
  generateRecoveryCode,
  normalizeRecoveryCode,
};