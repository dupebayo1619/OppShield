// src/routes/dashboard.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticate } = require('../middleware/auth');
const { getOrganisation } = require('../middleware/organisation');

router.use(authenticate);
router.use(getOrganisation);

router.get('/', async (req, res) => {
  try {
    const orgId = req.organisation.id;

    const tasks = await prisma.task.findMany({
      where: { organisationId: orgId }
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'APPROVED' || t.status === 'COMPLETED').length;
    const pendingTasks = tasks.filter(t => t.status === 'PENDING').length;
    const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;

    const recentActivity = await prisma.task.findMany({
      where: { organisationId: orgId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: {
        createdBy: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    const formattedActivity = recentActivity.map(task => ({
      id: task.id,
      action: `${task.createdBy?.firstName || 'User'} ${task.status === 'PENDING' ? 'created' : 'updated'} task: ${task.title}`,
      timestamp: task.updatedAt
    }));

    res.json({
      stats: { totalTasks, completedTasks, pendingTasks, inProgressTasks },
      recentActivity: formattedActivity
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;
