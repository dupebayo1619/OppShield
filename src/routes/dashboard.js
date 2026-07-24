// src/routes/dashboard.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET dashboard data (Public - No Authentication Required)
router.get('/', async (req, res) => {
  try {
    // Get the first organization (for public view)
    const org = await prisma.organisation.findFirst();
    if (!org) {
      return res.status(404).json({ error: 'No organization found' });
    }
    const orgId = org.id;

    // Get tasks for the organization
    const tasks = await prisma.task.findMany({
      where: { organisationId: orgId }
    });

    // Calculate stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'APPROVED' || t.status === 'COMPLETED').length;
    const pendingTasks = tasks.filter(t => t.status === 'PENDING').length;
    const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;

    // Get recent activity (last 5 tasks)
    const recentActivity = await prisma.task.findMany({
      where: { organisationId: orgId },
      orderBy: { updatedAt: 'desc' },
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

    // Format recent activity
    const formattedActivity = recentActivity.map(task => ({
      id: task.id,
      action: `${task.createdBy?.firstName || 'User'} ${task.status === 'PENDING' ? 'created' : 'updated'} task: ${task.title}`,
      timestamp: task.updatedAt
    }));

    res.json({
      stats: {
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        totalOrgs: 1
      },
      recentActivity: formattedActivity
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;
