const Syllabus = require("../models/syllabus");
const path = require("path");
const fs = require("fs");

let allBranchesSynced = false;
async function syncAllBranchesSyllabus() {
  if (allBranchesSynced) return;
  try {
    const branchConfigs = [
      {
        regex: /computer science/i,
        file: "cse_all_semesters.json",
        label: "CSE"
      },
      {
        regex: /artificial intelligence/i,
        file: "aiml_fixed_syllabus_items.json",
        label: "AIML"
      },
      {
        regex: /electronics/i,
        file: "ece_fixed_syllabus_items.json",
        label: "ECE"
      },
      {
        regex: /mechanical/i,
        file: "mechanical_fixed_syllabus_items.json",
        label: "Mechanical"
      }
    ];

    for (const b of branchConfigs) {
      const hasSem2_1 = await Syllabus.exists({ branch: { $regex: b.regex }, semester: "2-1" });
      const hasSem3_1 = await Syllabus.exists({ branch: { $regex: b.regex }, semester: "3-1" });

      if (!hasSem2_1 || !hasSem3_1) {
        console.log(`[Auto-Migration] Refreshing ${b.label} across all semesters...`);
        await Syllabus.deleteMany({ branch: { $regex: b.regex } });
        const jsonPath = path.join(__dirname, "../scripts", b.file);
        if (fs.existsSync(jsonPath)) {
          const items = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
          await Syllabus.insertMany(items);
          console.log(`[Auto-Migration] Successfully loaded all ${items.length} ${b.label} subjects!`);
        }
      }
    }
    allBranchesSynced = true;
  } catch (err) {
    console.error("[Auto-Migration Error]:", err.message);
  }
}

// Create Syllabus
exports.createSyllabus = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "PDF file is required",
      });
    }

    const syllabus = await Syllabus.create({
      title: req.body.title,
      branch: req.body.branch,
      semester: req.body.semester,
      description: req.body.description || "",
      pdfUrl: `/uploads/${req.file.filename}`,
    });

    res.status(201).json(syllabus);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get All Syllabus
exports.getSyllabus = async (req, res) => {
  try {
    if (require("mongoose").connection.readyState !== 1) {
      return res.status(200).json([]);
    }
    await syncAllBranchesSyllabus();
    const syllabus = await Syllabus.find().sort({ createdAt: -1 });

    res.status(200).json(syllabus);
  } catch (error) {
    console.warn("Get Syllabus Warning:", error.message);
    res.status(200).json([]);
  }
};

// Get Single Syllabus
exports.getSyllabusById = async (req, res) => {
  try {
    const syllabus = await Syllabus.findById(req.params.id);

    if (!syllabus) {
      return res.status(404).json({
        message: "Syllabus not found",
      });
    }

    res.json(syllabus);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Update Syllabus
exports.updateSyllabus = async (req, res) => {
  try {
    const syllabus = await Syllabus.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: "after" }
    );

    if (!syllabus) {
      return res.status(404).json({
        message: "Syllabus not found",
      });
    }

    res.json(syllabus);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Delete Syllabus
exports.deleteSyllabus = async (req, res) => {
  try {
    const syllabus = await Syllabus.findByIdAndDelete(req.params.id);

    if (!syllabus) {
      return res.status(404).json({
        message: "Syllabus not found",
      });
    }

    res.json({
      message: "Syllabus Deleted Successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// LIKE SYLLABUS
// ==========================================
exports.likeSyllabus = async (req, res) => {
  try {
    const { action } = req.body || {};
    const change = action === "unlike" ? -1 : 1;

    const existing = await Syllabus.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        message: "Syllabus not found",
      });
    }

    const currentLikes =
      typeof existing.likes === "number" && !isNaN(existing.likes)
        ? existing.likes
        : 0;
    const targetLikes = Math.max(0, currentLikes + change);

    const syllabus = await Syllabus.findByIdAndUpdate(
      req.params.id,
      { $set: { likes: targetLikes } },
      { returnDocument: "after" }
    );

    res.status(200).json(syllabus);
  } catch (error) {
    console.error("Like Syllabus Error:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// INCREASE VIEWS
// ==========================================
exports.increaseViews = async (req, res) => {
  try {
    const syllabus = await Syllabus.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { returnDocument: "after" }
    );

    if (!syllabus) {
      return res.status(404).json({
        message: "Syllabus not found",
      });
    }

    res.status(200).json(syllabus);
  } catch (error) {
    console.error("View Syllabus Error:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// INCREASE DOWNLOADS
// ==========================================
exports.increaseDownloads = async (req, res) => {
  try {
    const syllabus = await Syllabus.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { returnDocument: "after" }
    );

    if (!syllabus) {
      return res.status(404).json({
        message: "Syllabus not found",
      });
    }

    res.status(200).json(syllabus);
  } catch (error) {
    console.error("Download Syllabus Error:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};