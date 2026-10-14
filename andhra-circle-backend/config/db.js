const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 2500,
    });

    console.log("MongoDB Connected Successfully");
    console.log("Database:", connection.connection.name);
    console.log("Host:", connection.connection.host);
  } catch (error) {
    console.warn("MongoDB Connection Warning:", error.message);
    // Disable command buffering so unbuffered queries don't hang for 10s
    mongoose.set("bufferCommands", false);
  }
};

module.exports = connectDB;