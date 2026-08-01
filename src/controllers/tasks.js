// src/controllers/tasks.js
const prisma = require('../lib/prisma');
const audit = require('../lib/audit');

// ─── List Tasks ──────────────────────────────────────────────────
async function list(req, res, next) {
  try {
    console.log(`📋 Fetching tasks for organisation: ${req.organisation.id}`);
    
    const tasks = await prisma.task.findMany({
      where: { organisationId: req.organisation.id },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        approvals: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`✅ Found ${tasks.length} tasks`);
    return res.json({ tasks });
  } catch (err) { 
    console.error('❌ Error listing tasks:', err);
    next(err); 
  }
}

// ─── Create Task ────────────────────────────────────────────────
async function create(req, res, next) {
  try {
    const { title, description, requiresApproval, assignedToId } = req.body;

    if (assignedToId) {
      const assigneeMember = await prisma.member.findUnique({
        where: {
          userId_organisationId: {
            userId: assignedToId,
            organisationId: req.organisation.id,
          }
        }
      });
      if (!assigneeMember) {
        return res.status(400).json({ error: 'Assignee is not a member of this organisation' });
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        requiresApproval: requiresApproval !== false,
        organisationId: req.organisation.id,
        createdById: req.user.id,
        assignedToId: assignedToId || null,
        status: 'PENDING'
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    await audit.log({ action: 'task.create', resource: 'task', resourceId: task.id, actor: req.user, organisationId: req.organisation.id, metadata: { title: task.title }, ipAddress: req.ip });

    return res.status(201).json({ task });
  } catch (err) { next(err); }
}

// ─── Get Task ────────────────────────────────────────────────────
async function get(req, res, next) {
  try {
    const { taskId } = req.params;
    
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        organisationId: req.organisation.id,
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        approvals: {
          include: {
            approvedBy: { select: { id: true, firstName: true, lastName: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    return res.json({ task });
  } catch (err) { next(err); }
}

// ─── Update Task ─────────────────────────────────────────────────
async function update(req, res, next) {
  try {
    const { taskId } = req.params;
    const { title, description, assignedToId, status } = req.body;

    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        organisationId: req.organisation.id,
      }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (assignedToId) {
      const assigneeMember = await prisma.member.findUnique({
        where: {
          userId_organisationId: {
            userId: assignedToId,
            organisationId: req.organisation.id,
          }
        }
      });
      if (!assigneeMember) {
        return res.status(400).json({ error: 'Assignee is not a member of this organisation' });
      }
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: title || existingTask.title,
        description: description !== undefined ? description : existingTask.description,
        assignedToId: assignedToId !== undefined ? assignedToId : existingTask.assignedToId,
        status: status || existingTask.status,
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    await audit.log({ action: 'task.update', resource: 'task', resourceId: task.id, actor: req.user, organisationId: req.organisation.id, ipAddress: req.ip });

    return res.json({ task });
  } catch (err) { next(err); }
}

// ─── Delete Task ─────────────────────────────────────────────────
async function remove(req, res, next) {
  try {
    const { taskId } = req.params;

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        organisationId: req.organisation.id,
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await prisma.task.delete({
      where: { id: taskId }
    });

    await audit.log({ action: 'task.delete', resource: 'task', resourceId: taskId, actor: req.user, organisationId: req.organisation.id, ipAddress: req.ip });

    return res.status(204).send();
  } catch (err) { next(err); }
}

// ─── Accept Task (PENDING → IN_PROGRESS) ────────────────────────
// Option B: Accepting also claims the task (assigns to the accepting user)
async function accept(req, res, next) {
  try {
    const { taskId } = req.params;

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        organisationId: req.organisation.id,
        OR: [
          { assignedToId: req.user.id },
          { assignedToId: null },
        ],
      },
      include: {
        assignedTo: true
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found or not assigned to you' });
    }

    if (task.status !== 'PENDING') {
      return res.status(400).json({ error: 'Task is not in pending state' });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'IN_PROGRESS',
        assignedToId: task.assignedToId ?? req.user.id,
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    await audit.log({ action: 'task.accept', resource: 'task', resourceId: taskId, actor: req.user, organisationId: req.organisation.id, ipAddress: req.ip });

    return res.json({ task: updatedTask });
  } catch (err) { next(err); }
}

// ─── Complete Task (IN_PROGRESS → AWAITING_APPROVAL) ────────────
async function complete(req, res, next) {
  try {
    const { taskId } = req.params;

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        organisationId: req.organisation.id,
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Task is not in progress' });
    }

    if (task.assignedToId !== req.user.id) {
      return res.status(403).json({ error: 'You are not assigned to this task' });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { 
        status: 'AWAITING_APPROVAL',
        completedAt: new Date()
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    await prisma.approval.create({
      data: {
        taskId: taskId,
        status: 'PENDING',
        createdAt: new Date()
      }
    });

    await audit.log({ action: 'task.complete', resource: 'task', resourceId: taskId, actor: req.user, organisationId: req.organisation.id, ipAddress: req.ip });

    return res.json({ task: updatedTask });
  } catch (err) { next(err); }
}

// ─── Approve Task (AWAITING_APPROVAL → APPROVED) ────────────────
async function approve(req, res, next) {
  try {
    const { taskId } = req.params;
    const { comment } = req.body;

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        organisationId: req.organisation.id,
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.status !== 'AWAITING_APPROVAL') {
      return res.status(400).json({ error: 'Task is not awaiting approval' });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status: 'APPROVED' },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    await prisma.approval.create({
      data: {
        taskId: taskId,
        status: 'APPROVED',
        comment: comment || null,
        approvedById: req.user.id,
        createdAt: new Date()
      }
    });

    await audit.log({ action: 'task.approve', resource: 'task', resourceId: taskId, actor: req.user, organisationId: req.organisation.id, metadata: { comment: comment || null }, ipAddress: req.ip });

    return res.json({ task: updatedTask });
  } catch (err) { next(err); }
}

// ─── Reject Task (AWAITING_APPROVAL → REJECTED) ─────────────────
async function reject(req, res, next) {
  try {
    const { taskId } = req.params;
    const { reason } = req.body;

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        organisationId: req.organisation.id,
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.status !== 'AWAITING_APPROVAL') {
      return res.status(400).json({ error: 'Task is not awaiting approval' });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { 
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: reason || null
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    await prisma.approval.create({
      data: {
        taskId: taskId,
        status: 'REJECTED',
        comment: reason || null,
        approvedById: req.user.id,
        createdAt: new Date()
      }
    });

    await audit.log({ action: 'task.reject', resource: 'task', resourceId: taskId, actor: req.user, organisationId: req.organisation.id, metadata: { reason: reason || null }, ipAddress: req.ip });

    return res.json({ task: updatedTask });
  } catch (err) { next(err); }
}

module.exports = {
  list,
  create,
  get,
  update,
  remove,
  accept,
  complete,
  approve,
  reject
};
