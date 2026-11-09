const User = require("../models/user");
const Note = require("../models/note");
const Paper = require("../models/paper");
const Syllabus = require("../models/syllabus");
const Notification = require("../models/Notification");
const LabProgram = require("../models/LabProgram");
const UserMaterial = require("../models/userMaterial");

// ==========================================
// GET DASHBOARD BASIC STATS
// ==========================================
exports.getDashboardStats = async (req, res) => {
  try {
    const [users, notes, papers, syllabus, notifications, labPrograms, pendingSubmissions] =
      await Promise.all([
        User.countDocuments(),
        Note.countDocuments(),
        Paper.countDocuments(),
        Syllabus.countDocuments(),
        Notification.countDocuments(),
        LabProgram.countDocuments(),
        UserMaterial.countDocuments({ status: "pending" }),
      ]);

    res.json({
      users,
      notes,
      papers,
      syllabus,
      notifications,
      labPrograms,
      pendingSubmissions,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// GET DASHBOARD ADVANCED ANALYTICS (AGGREGATION PIPELINES)
// ==========================================
exports.getDashboardAnalytics = async (req, res) => {
  try {
    // 1. Pipeline for Notes Analytics & Engagement Facet
    const notesAnalyticsPromise = Note.aggregate([
      {
        $facet: {
          engagement: [
            {
              $group: {
                _id: null,
                totalViews: { $sum: { $ifNull: ["$views", 0] } },
                totalDownloads: { $sum: { $ifNull: ["$downloads", 0] } },
                totalLikes: { $sum: { $ifNull: ["$likes", 0] } },
              },
            },
          ],
          byBranch: [
            {
              $match: { branch: { $exists: true, $ne: "" } },
            },
            {
              $group: {
                _id: { $trim: { input: "$branch" } },
                count: { $sum: 1 },
                views: { $sum: { $ifNull: ["$views", 0] } },
                downloads: { $sum: { $ifNull: ["$downloads", 0] } },
              },
            },
            { $sort: { count: -1 } },
          ],
          topResources: [
            {
              $addFields: {
                score: {
                  $add: [
                    { $ifNull: ["$views", 0] },
                    { $multiply: [{ $ifNull: ["$downloads", 0] }, 2] },
                    { $multiply: [{ $ifNull: ["$likes", 0] }, 3] },
                  ],
                },
              },
            },
            { $sort: { score: -1 } },
            { $limit: 5 },
            {
              $project: {
                title: 1,
                branch: 1,
                semester: 1,
                views: 1,
                downloads: 1,
                likes: 1,
                score: 1,
              },
            },
          ],
        },
      },
    ]);

    // 2. Pipeline for Student Material Submissions Breakdown
    const submissionsPromise = UserMaterial.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // 3. Pipeline for Question Papers Breakdown by Exam Type
    const papersPromise = Paper.aggregate([
      {
        $group: {
          _id: { $ifNull: ["$examType", "Semester"] },
          count: { $sum: 1 },
          totalViews: { $sum: { $ifNull: ["$views", 0] } },
          totalDownloads: { $sum: { $ifNull: ["$downloads", 0] } },
        },
      },
    ]);

    const [notesAnalyticsResult, submissionStats, paperStats] = await Promise.all([
      notesAnalyticsPromise,
      submissionsPromise,
      papersPromise,
    ]);

    const facet = notesAnalyticsResult[0] || {};
    const engagement = facet.engagement?.[0] || { totalViews: 0, totalDownloads: 0, totalLikes: 0 };

    res.status(200).json({
      success: true,
      analytics: {
        totalEngagement: {
          views: engagement.totalViews,
          downloads: engagement.totalDownloads,
          likes: engagement.totalLikes,
        },
        branchDistribution: facet.byBranch || [],
        topPerformingNotes: facet.topResources || [],
        submissionsStatus: submissionStats.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        paperTypes: paperStats,
      },
    });
  } catch (error) {
    console.error("Dashboard Analytics Error:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};
