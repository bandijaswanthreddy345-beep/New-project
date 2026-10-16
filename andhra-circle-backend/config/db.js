const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/andhra-circle";

  const tryConnect = async () => {
    try {
      const connection = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 3000,
      });

      console.log("✅ MongoDB Connected Successfully");
      console.log("   Database:", connection.connection.name);
      console.log("   Host:", connection.connection.host);
    } catch (error) {
      console.warn("⚠️ MongoDB Connection Warning (App will run in offline fallback mode):", error.message);
      mongoose.set("bufferCommands", false);
    }
  };

  mongoose.connection.on("connected", () => {
    console.log("📡 MongoDB Connection state: CONNECTED");
  });

  mongoose.connection.on("disconnected", () => {
    console.log("🔌 MongoDB Connection state: DISCONNECTED");
  });

  mongoose.connection.on("error", (err) => {
    console.warn("⚠️ MongoDB Runtime Error:", err.message);
  });

  await tryConnect();
};

module.exports = connectDB;