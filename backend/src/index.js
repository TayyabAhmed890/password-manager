const cors = require("cors");
const express = require("express");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const connectDB = require("./db/connectDB");
const authRoutes = require("./routes/auth.routes");
const storeRoutes = require("./routes/store.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();

const PORT = process.env.PORT || 5000;

// Allowed frontend origins (supports comma-separated list in CLIENT_URL)
const rawClientUrl = process.env.CLIENT_URL || "http://localhost:5173";
const allowedOrigins = rawClientUrl.split(",").map((url) => url.trim());

// In development, ensure localhost:5173 and localhost:3000 are always permitted
if (process.env.NODE_ENV !== "production") {
  if (!allowedOrigins.includes("http://localhost:5173")) allowedOrigins.push("http://localhost:5173");
  if (!allowedOrigins.includes("http://localhost:3000")) allowedOrigins.push("http://localhost:3000");
}


// ============================================================
// MIDDLEWARE
// ============================================================

// Parse cookies from incoming requests.
// Used by auth middleware to read the JWT cookie.
app.use(cookieParser());


// Allow requests from the frontend.
// credentials: true is required because authentication uses an httpOnly cookie.
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, or Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);


// Parse JSON request bodies.
//
// 10kb limit prevents unnecessarily large JSON payloads.
app.use(
  express.json({
    limit: "10kb",
  })
);


// ============================================================
// ROUTES
// ============================================================

app.use("/api/auth", authRoutes);

app.use("/api/store", storeRoutes);

// Add alongside your existing routes.
app.use("/api/admin", adminRoutes);


// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/", (req, res) => {
  res.send("Ping from PWManager Backend!");
});


// ============================================================
// UNKNOWN ROUTES
// ============================================================

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});


// ============================================================
// CENTRALIZED ERROR HANDLER
// ============================================================

app.use((err, req, res, next) => {
  // If response headers were already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // Determine appropriate HTTP status code
  const statusCode =
    Number.isInteger(err.status) && err.status >= 400 && err.status < 600
      ? err.status
      : Number.isInteger(err.statusCode) && err.statusCode >= 400 && err.statusCode < 600
        ? err.statusCode
        : 500;

  // Handle malformed JSON body from express.json()
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Malformed JSON payload in request body.",
    });
  }

  // Handle request payload exceeding body-parser limit
  if (err.type === "entity.too.large" || err.status === 413) {
    return res.status(413).json({
      success: false,
      message: "Request payload too large.",
    });
  }

  // Log server errors (500) without exposing sensitive body fields or credentials
  if (statusCode >= 500) {
    console.error(`[Server Error] ${err.name || "Error"}: ${err.message}`);
  }

  const isProduction = process.env.NODE_ENV === "production";

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500 && isProduction
        ? "An internal server error occurred."
        : err.message || "An unexpected error occurred.",
  });
});


// ============================================================
// START SERVER
// ============================================================

const startServer = async () => {
  try {
    // Connect to MongoDB before accepting requests.
    await connectDB();

    app.listen(PORT, () => {
      console.log(
        `Server running on port ${PORT}`
      );
    });

  } catch (error) {
    console.error(
      "Server failed to start:",
      error.message
    );

    // Stop the process if the database connection fails.
    process.exit(1);
  }
};

startServer.app = app;

module.exports = startServer;