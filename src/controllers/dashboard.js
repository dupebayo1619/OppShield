// src/controllers/dashboard.js
const prisma = require('../lib/prisma');

const getDashboard = async (req, res) => {
  try {
    // ─── Admin Check ──────────────────────────────────────────────
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get user's organisation
    const userId = req.user.id;
    const membership = await prisma.member.findFirst({
      where: { userId },
      include: { organisation: true }
    });

    if (!membership) {
      return res.status(404).json({ error: 'No organisation found' });
    }

    const orgId = membership.organisationId;

    // Get task statistics
    const [totalTasks, completedTasks, pendingTasks, inProgressTasks, totalOrgs] = await Promise.all([
      prisma.task.count({ where: { organisationId: orgId } }),
      prisma.task.count({ where: { organisationId: orgId, status: 'DONE' } }),
      prisma.task.count({ where: { organisationId: orgId, status: 'PENDING' } }),
      prisma.task.count({ where: { organisationId: orgId, status: 'IN_PROGRESS' } }),
      prisma.organisation.count()
    ]);

    // Get recent activity (last 5 tasks)
    const recentTasks = await prisma.task.findMany({
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

    const recentActivity = recentTasks.map(task => ({
      id: task.id,
      action: `${task.createdBy?.firstName || 'User'} ${task.createdBy?.lastName || ''} ${task.status === 'PENDING' ? 'created' : 'updated'} task: ${task.title}`,
      timestamp: task.updatedAt
    }));

    res.json({
      stats: {
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        totalOrgs
      },
      recentActivity
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

module.exports = { getDashboard };
