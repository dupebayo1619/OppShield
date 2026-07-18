// src/routes/dashboard.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticate } = require('../middleware/auth');

// GET dashboard data
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's organization through Member table
    const member = await prisma.member.findFirst({
      where: { userId: userId },
      include: { organisation: true }
    });

    if (!member || !member.organisation) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const orgId = member.organisation.id;

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
        totalOrgs: 1 // Since we're only showing one org
      },
      recentActivity: formattedActivity
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;
