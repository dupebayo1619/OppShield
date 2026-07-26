// src/routes/dashboard-public.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── PUBLIC DASHBOARD STATS ──────────────────────────────────────
// Returns ONLY aggregated counts - NO PII, NO task titles, NO org details
// This endpoint is intentionally unauthenticated and safe for public consumption
router.get('/', async (req, res) => {
  try {
    const [
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      totalOrgs
    ] = await Promise.all([
      prisma.task.count(),
      prisma.task.count({ where: { status: 'COMPLETED' } }),
      prisma.task.count({ where: { status: 'PENDING' } }),
      prisma.task.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.organisation.count()
    ]);

    res.json({
      stats: {
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        totalOrgs
      },
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Public dashboard error:', error);
    res.status(500).json({
      error: 'Failed to fetch public stats',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
