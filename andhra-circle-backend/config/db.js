const mongoose = require("mongoose");
const logger = require("../utils/logger");

const RETRY_INTERVAL_MS = 2000;
const MAX_STARTUP_RETRIES = 5;

const connectDB = async () => {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/andhra-circle";

  let attempts = 0;

  const tryConnect = async () => {
    while (attempts < MAX_STARTUP_RETRIES) {
      attempts++;
      try {
        const connection = await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000,
          socketTimeoutMS: 30000,
        });

        logger.info("MongoDB Connected Successfully", {
          database: connection.connection.name,
          host: connection.connection.host,
        });
        return;
      } catch (error) {
        logger.warn("MongoDB connection attempt failed", {
          attempt: attempts,
          maxAttempts: MAX_STARTUP_RETRIES,
          error: error.message,
        });

        if (attempts >= MAX_STARTUP_RETRIES) {
          if (process.env.NODE_ENV === "production") {
            logger.error("FATAL: MongoDB could not be reached after maximum startup retries. Exiting process.", {
              attempts,
            });
            process.exit(1);
          } else {
            logger.warn("MongoDB offline in development mode. Proceeding with bufferCommands: false.", {});
            mongoose.set("bufferCommands", false);
            return;
          }
        }

        await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
      }
    }
  };

  mongoose.connection.on("connected", () => {
    logger.info("MongoDB connection state: CONNECTED");
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB connection state: DISCONNECTED");
  });

  mongoose.connection.on("error", (err) => {
    logger.error("MongoDB runtime error", { error: err.message });
  });

  await tryConnect();
};

module.exports = connectDB;
