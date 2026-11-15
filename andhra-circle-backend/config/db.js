const mongoose = require("mongoose");
const logger = require("../utils/logger");

const RETRY_INTERVAL_MS = 2000;
const MAX_STARTUP_RETRIES = 5;

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/andhra-circle";
  const localFallbackUri = "mongodb://127.0.0.1:27017/andhra-circle";

  // Check if connection string specifies a database name without printing the URI
  try {
    const rawPath = primaryUri.split("?")[0].replace(/^mongodb(\+srv)?:\/\//, "");
    const slashIdx = rawPath.indexOf("/");
    const dbNamePart = slashIdx !== -1 ? rawPath.slice(slashIdx + 1).trim() : "";
    if (!dbNamePart) {
      logger.warn("WARNING: MongoDB connection string has no database name specified. It will default to 'test' or MongoDB default.");
    }
  } catch {
    // ignore parse error
  }

  let attempts = 0;

  const tryConnect = async () => {
    while (attempts < MAX_STARTUP_RETRIES) {
      attempts++;
      try {
        const connection = await mongoose.connect(primaryUri, {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000,
          socketTimeoutMS: 30000,
          maxPoolSize: 10,
          minPoolSize: 2,
        });

        const isAtlas = connection.connection.host.includes("mongodb.net");
        logger.info("MongoDB Connected Successfully", {
          databaseType: isAtlas ? "MongoDB Atlas (Remote Cluster)" : "Local MongoDB",
          database: connection.connection.name,
          host: connection.connection.host,
        });
        return;
      } catch (error) {
        logger.warn("MongoDB primary connection attempt failed", {
          attempt: attempts,
          maxAttempts: MAX_STARTUP_RETRIES,
          error: error.message,
        });

        // If primary is Atlas and IP is blocked or network unavailable, attempt seamless fallback to local MongoDB
        if (primaryUri !== localFallbackUri) {
          try {
            logger.info("Attempting local MongoDB fallback at 127.0.0.1:27017...");
            const localConn = await mongoose.connect(localFallbackUri, {
              serverSelectionTimeoutMS: 3000,
              connectTimeoutMS: 3000,
              socketTimeoutMS: 30000,
              maxPoolSize: 10,
              minPoolSize: 2,
            });
            logger.info("MongoDB Fallback Connected Successfully (Local MongoDB)", {
              database: localConn.connection.name,
              host: localConn.connection.host,
            });
            return;
          } catch (fallbackErr) {
            logger.warn("Local MongoDB fallback attempt failed", { error: fallbackErr.message });
          }
        }

        if (attempts >= MAX_STARTUP_RETRIES) {
          logger.error("FATAL: MongoDB is not reachable (neither Atlas nor local MongoDB).", {
            attempts,
          });

          if (process.env.NODE_ENV === "production") {
            process.exit(1);
          } else {
            logger.error("Database unavailable. Database operations will return 503.", {});
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
