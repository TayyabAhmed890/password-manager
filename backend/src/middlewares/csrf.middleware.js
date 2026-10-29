const getClientOrigins = require("../config/clientOrigins");

const getRequestOrigin = (req) => {
  if (req.get("origin")) {
    return req.get("origin");
  }

  const referer = req.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      return null;
    }
  }

  return null;
};

const csrfProtection = (req, res, next) => {
  let allowedOrigins;

  try {
    allowedOrigins = getClientOrigins();
  } catch (error) {
    console.error("CSRF origin configuration error:", error.message);
    return res.status(503).json({
      success: false,
      message: "Service temporarily unavailable.",
    });
  }

  const requestOrigin = getRequestOrigin(req);

  if (requestOrigin) {
    if (allowedOrigins.includes(requestOrigin)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Request origin is not allowed.",
    });
  }

  if (req.get("sec-fetch-site") === "same-origin") {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Request origin could not be verified.",
  });
};

module.exports = csrfProtection;
