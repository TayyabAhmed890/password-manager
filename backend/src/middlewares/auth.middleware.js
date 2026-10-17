
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const protect = async (req, res, next) => {
  try {
    // Read the JWT from the httpOnly cookie or Authorization Bearer header
    let token = req.cookies?.token;
    if (!token && req.headers?.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured.");

      return res.status(500).json({
        success: false,
        message: "Server authentication configuration error.",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (!decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    // Load the current email, role, and token version from the database.
    // Never rely only on the role stored in an older JWT.
    const user = await User.findById(decoded.id)
      .select("email role tokenVersion")
      .lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists.",
      });
    }

    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({
        success: false,
        message: "Session is no longer valid. Please login again.",
      });
    }

    // Controllers and authorization middleware can use these values.
    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    return next();
  } catch (error) {
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError" ||
      error.name === "CastError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authentication session.",
      });
    }

    console.error("Authentication error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong during authentication.",
    });
  }
};

module.exports = protect;
