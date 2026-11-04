const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

const isValidEmail = (email) =>
  typeof email === "string" &&
  email.length <= 254 &&
  EMAIL_PATTERN.test(email);

const getPasswordValidationError = (password, label = "Password") => {
  if (typeof password !== "string" || password.length < 8) {
    return `${label} must be at least 8 characters long.`;
  }

  // bcrypt only uses the first 72 bytes, so reject longer inputs consistently.
  if (Buffer.byteLength(password, "utf8") > 72) {
    return `${label} cannot exceed 72 bytes.`;
  }

  return null;
};

module.exports = {
  getPasswordValidationError,
  isValidEmail,
  normalizeEmail,
};
