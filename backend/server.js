const app = require("./src/index");
const connectDB = require("./src/db/connectDB");
const validateEnv = require("./src/config/validateEnv");

const PORT = process.env.PORT || 7000;

const startServer = async () => {
  try {
    validateEnv();
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server failed to start:", error.message);
    process.exit(1);
  }
};

startServer();