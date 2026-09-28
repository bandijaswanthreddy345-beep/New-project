const User = require("../models/User");
const Note = require("../models/note");
const Paper = require("../models/Paper");
const Syllabus = require("../models/Syllabus");
const Notification = require("../models/Notification");
const LabProgram = require("../models/LabProgram");

exports.getDashboardStats = async (req, res) => {
  try {
    const users = await User.countDocuments();
    const notes = await Note.countDocuments();
    const papers = await Paper.countDocuments();
    const syllabus = await Syllabus.countDocuments();
    const notifications = await Notification.countDocuments();
    const labPrograms = await LabProgram.countDocuments();

    res.json({
      users,
      notes,
      papers,
      syllabus,
      notifications,
      labPrograms,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};