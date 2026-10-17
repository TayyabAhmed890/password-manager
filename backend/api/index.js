const startServer = require("../src/index");
const connectDB = require("../src/db/connectDB");

// Express application instance
const app = startServer.app;

// Vercel serverless function entry handler
module.exports = async (req, res) => {
  try {
    // Ensure MongoDB connection is initialized before processing request
    await connectDB();
  } catch (err) {
    console.error("Vercel serverless DB connection error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Database connection failed in serverless function.",
    });
  }

  // Pass request to Express app
  return app(req, res);
};
