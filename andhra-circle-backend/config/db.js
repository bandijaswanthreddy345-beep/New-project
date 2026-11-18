const mongoose = require("mongoose");
const logger = require("../utils/logger");

const RETRY_INTERVAL_MS = 3000;
const MAX_STARTUP_RETRIES = 10;

let isReconnecting = false;
let reconnectTimer = null;

const scheduleReconnect = (uri, delayMs = 5000) => {
  if (isReconnecting || mongoose.connection.readyState === 1) return;
  if (reconnectTimer) clearTimeout(reconnectTimer);

  isReconnecting = true;
  logger.info(`[MongoDB] Scheduling auto-reconnect in ${Math.round(delayMs / 1000)}s...`);

  reconnectTimer = setTimeout(async () => {
    isReconnecting = false;
    if (mongoose.connection.readyState === 1) return;

    try {
      logger.info("[MongoDB] Attempting reconnection to database...");
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 20000,
        connectTimeoutMS: 20000,
        socketTimeoutMS: 45000,
        maxPoolSize: 20,
        minPoolSize: 2,
        heartbeatFrequencyMS: 10000,
        retryWrites: true,
        w: "majority",
      });
      logger.info("[MongoDB] Successfully reconnected to database!");
    } catch (err) {
      logger.warn("[MongoDB] Reconnection attempt failed:", { error: err.message });
      // Exponential backoff up to 20 seconds
      const nextDelay = Math.min(delayMs * 1.5, 20000);
      scheduleReconnect(uri, nextDelay);
    }
  }, delayMs);
};

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
          serverSelectionTimeoutMS: 20000,
          connectTimeoutMS: 20000,
          socketTimeoutMS: 45000,
          maxPoolSize: 20,
          minPoolSize: 2,
          heartbeatFrequencyMS: 10000,
          retryWrites: true,
          w: "majority",
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

        // In local development only, attempt local MongoDB fallback
        if (process.env.NODE_ENV !== "production" && primaryUri !== localFallbackUri) {
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
          logger.error("MongoDB initial connection attempts exhausted. Server will stay online and retry in background.", {
            attempts,
          });
          // Do NOT crash process.exit(1); keep server up so Render/Cloudflare don't crash
          scheduleReconnect(primaryUri, 5000);
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
      }
    }
  };

  mongoose.connection.on("connected", () => {
    logger.info("MongoDB connection state: CONNECTED");
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    isReconnecting = false;
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB connection state: DISCONNECTED. Initiating automatic recovery...");
    scheduleReconnect(primaryUri, 3000);
  });

  mongoose.connection.on("error", (err) => {
    logger.error("MongoDB runtime error", { error: err.message });
    if (mongoose.connection.readyState !== 1) {
      scheduleReconnect(primaryUri, 3000);
    }
  });

  await tryConnect();
};

module.exports = connectDB;
