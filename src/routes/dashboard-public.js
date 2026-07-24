// src/routes/dashboard.js
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// GET dashboard data (public)
router.get("/", async (req, res) => {
  try {
    const tasks = await prisma.task.findMany();

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === "APPROVED" || t.status === "COMPLETED").length;
    const pendingTasks = tasks.filter(t => t.status === "PENDING").length;
    const inProgressTasks = tasks.filter(t => t.status === "IN_PROGRESS").length;

    const recentActivity = await prisma.task.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json({
      stats: {
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks
      },
      recentActivity: recentActivity.map(task => ({
        id: task.id,
        title: task.title,
        status: task.status,
        timestamp: task.updatedAt
      }))
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

module.exports = router;
