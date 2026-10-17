const mongoose = require("mongoose");

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI;
  const localUri = "mongodb://127.0.0.1:27017/andhra-circle";

  mongoose.connection.on("connected", () => {
    console.log("📡 MongoDB Connection state: CONNECTED");
  });

  mongoose.connection.on("disconnected", () => {
    console.log("🔌 MongoDB Connection state: DISCONNECTED");
  });

  mongoose.connection.on("error", (err) => {
    console.warn("⚠️ MongoDB Runtime Error:", err.message);
  });

  // 1. Try Primary (MongoDB Atlas Cloud Cluster)
  if (primaryUri) {
    try {
      console.log("⏳ Connecting to Primary MongoDB (Atlas)...");
      const connection = await mongoose.connect(primaryUri, {
        serverSelectionTimeoutMS: 8000,
      });

      console.log("✅ MongoDB Atlas Connected Successfully");
      console.log("   Database:", connection.connection.name);
      console.log("   Host:", connection.connection.host);
      return;
    } catch (error) {
      console.warn("⚠️ MongoDB Atlas Connection Failed (IP Whitelist / SSL):", error.message);
      console.log("🔄 Attempting automatic fallback to Local MongoDB (127.0.0.1:27017)...");
    }
  }

  // 2. Automatic Fallback to Local MongoDB Server
  try {
    const connection = await mongoose.connect(localUri, {
      serverSelectionTimeoutMS: 3000,
    });

    console.log("✅ Local MongoDB Connected Successfully");
    console.log("   Database:", connection.connection.name);
    console.log("   Host:", connection.connection.host);
  } catch (error) {
    console.warn("⚠️ Local MongoDB Connection Failed:", error.message);
    console.warn("   (App will run in offline fallback mode)");
  }
};

module.exports = connectDB;