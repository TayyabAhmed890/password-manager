const jwt = require("jsonwebtoken");

// Generate a JWT for the authenticated user.
//
// tokenVersion is included in the token so that we can
// invalidate previously issued tokens when necessary,
// for example after a password reset.
const generateToken = (userId, tokenVersion = 0,role = 'user') => {
  // JWT_SECRET must exist because it is used to sign the token.
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    {
      // User ID stored inside the JWT payload
      id: userId,

      // Used to invalidate old tokens
      tokenVersion,

      // role
      role
    },
    process.env.JWT_SECRET,
    {
      // JWT expiry comes from .env
      expiresIn: process.env.JWT_EXPIRES_IN || "3d",
    }
  );
};

module.exports = generateToken;