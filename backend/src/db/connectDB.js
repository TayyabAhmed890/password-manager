const mongoose = require("mongoose");

const connectDB = async () => {
  // In serverless environments (Vercel), reuse existing active or connecting connection
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  // if mongoUri is Empty
  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing from environment variables.");
  }

  // connect db logic
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log("MongoDB connected successfully.");

    mongoose.connection.on("error", (error) => {
      console.error("MongoDB connection error:", error.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected.");
    });

  } catch (error) {
    console.error(
      "Unable to connect to MongoDB:",
      error.message
    );

    throw error;
  }
};

module.exports = connectDB;