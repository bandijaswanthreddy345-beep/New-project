const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Syllabus = require("../models/syllabus");

async function syncAllNow() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB successfully!");

    const branchConfigs = [
      {
        regex: /computer science/i,
        file: "cse_all_semesters.json",
        label: "Computer Science and Engineering"
      },
      {
        regex: /artificial intelligence/i,
        file: "aiml_fixed_syllabus_items.json",
        label: "Artificial Intelligence & Machine Learning"
      },
      {
        regex: /electronics/i,
        file: "ece_fixed_syllabus_items.json",
        label: "Electronics & Communication Engineering"
      },
      {
        regex: /mechanical/i,
        file: "mechanical_fixed_syllabus_items.json",
        label: "Mechanical Engineering"
      }
    ];

    for (const b of branchConfigs) {
      console.log(`\nSyncing ${b.label}...`);
      await Syllabus.deleteMany({ branch: { $regex: b.regex } });
      const jsonPath = path.join(__dirname, b.file);
      if (fs.existsSync(jsonPath)) {
        const items = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
        await Syllabus.insertMany(items);
        console.log(`Inserted ${items.length} items for ${b.label}`);
      }
    }

    console.log("\n================ CURRENT DATABASE AUDIT (AGGREGATION PIPELINE) ================");
    const auditPipeline = [
      {
        $group: {
          _id: { branch: "$branch", semester: "$semester" },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.branch",
          total: { $sum: "$count" },
          semesters: {
            $push: {
              semester: "$_id.semester",
              count: "$count",
            },
          },
        },
      },
      { $sort: { total: -1 } },
    ];

    const auditResults = await Syllabus.aggregate(auditPipeline);
    let totalAll = 0;

    for (const item of auditResults) {
      totalAll += item.total;
      const semMap = {};
      (item.semesters || []).forEach((s) => {
        semMap[s.semester] = s.count;
      });
      console.log(`\nBranch: "${item._id}" (Total: ${item.total})`);
      console.log("Semesters:", semMap);
    }
    console.log(`\n>>> GRAND TOTAL SYLLABUS RECORDS IN DB: ${totalAll} <<<`);

    await mongoose.disconnect();
    console.log("Done!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

syncAllNow();
