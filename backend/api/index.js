const app = require("../src/index");
const validateEnv = require("../src/config/validateEnv");

// Express middleware initializes or reuses the database connection for API requests.
module.exports = (req, res) => {
  try {
    validateEnv();
  } catch (error) {
    console.error("Application configuration error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Application configuration error.",
    });
  }

  return app(req, res);
};
