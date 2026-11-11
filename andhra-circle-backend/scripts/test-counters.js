const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const connectDB = require("../config/db");
const Note = require("../models/note");

async function testCounters() {
  await connectDB();
  const testNote = await Note.create({
    title: "Counter Race Test Note",
    branch: "CSE",
    semester: "1-1",
    subject: "Maths",
    likes: 0,
  });

  console.log("Initial likes:", testNote.likes);

  // Run 10 parallel atomic increments ($inc)
  const incPromises = [];
  for (let i = 0; i < 10; i++) {
    incPromises.push(
      Note.findByIdAndUpdate(testNote._id, { $inc: { likes: 1 } }, { new: true })
    );
  }

  await Promise.all(incPromises);

  const finalNote = await Note.findById(testNote._id);
  console.log("Final likes after 10 concurrent increments:", finalNote.likes);
  console.log("Lost updates check:", finalNote.likes === 10 ? "PASSED (0 lost updates)" : "FAILED");

  await Note.findByIdAndDelete(testNote._id);
  await mongoose.connection.close();
  process.exit(0);
}

testCounters().catch((err) => {
  console.error(err);
  process.exit(1);
});

