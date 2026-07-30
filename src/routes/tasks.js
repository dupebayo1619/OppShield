// src/routes/tasks.js
const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const { getOrganisation } = require('../middleware/organisation');
const taskController = require('../controllers/tasks');

// All task routes need authentication and organisation
router.use(authenticate);
router.use(getOrganisation);

// ─── Task Routes ────────────────────────────────────────────────

// Get all tasks
router.get('/', taskController.list);

// Get task by ID
router.get('/:taskId', taskController.get);

// Create task
router.post('/', requireAdmin, taskController.create);

// Update task
router.put('/:taskId', taskController.update);

// Delete task
router.delete('/:taskId', taskController.remove);

// ─── Approval Routes ────────────────────────────────────────────

// Approve task (Admin only)
router.post('/:taskId/approve', requireAdmin, taskController.approve);

// Reject task (Admin only)
router.post('/:taskId/reject', requireAdmin, taskController.reject);

// ─── Member Workflow Routes ─────────────────────────────────────

// Accept task (Member: PENDING → IN_PROGRESS)
router.post('/:taskId/accept', taskController.accept);

// Complete task (Member: IN_PROGRESS → AWAITING_APPROVAL)
router.post('/:taskId/complete', taskController.complete);

module.exports = router;
