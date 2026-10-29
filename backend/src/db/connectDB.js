const mongoose = require("mongoose");

let connectionPromise = null;

mongoose.connection.on("error", (error) => {
  console.error("MongoDB connection error:", error.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected.");
});

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoUri) {
    const error = new Error(
      "MONGODB_URI is missing from environment variables."
    );
    console.error("MongoDB connection configuration error.");
    throw error;
  }

  let pendingConnection;
  try {
    pendingConnection = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    connectionPromise = pendingConnection;

    const connection = await pendingConnection;
    console.log("MongoDB connected successfully.");
    return connection;
  } catch (error) {
    console.error(
      "Unable to connect to MongoDB:",
      error.message
    );
    throw error;
  } finally {
    if (connectionPromise === pendingConnection) {
      connectionPromise = null;
    }
  }
};

module.exports = connectDB;