// src/routes/tasks.js
const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { getOrganisation } = require("../middleware/organisation");
const taskController = require("../controllers/tasks");

// All task routes need authentication and organisation
router.use(authenticate);
router.use(getOrganisation);

// Get all tasks
router.get("/", taskController.list);

// Get task by ID
router.get("/:taskId", taskController.get);

// Create task
router.post("/", taskController.create);

// Update task
router.put("/:taskId", taskController.update);

// Delete task
router.delete("/:taskId", taskController.remove);

// Approve task
router.post("/:taskId/approve", taskController.approve);

// Reject task
router.post("/:taskId/reject", taskController.reject);

module.exports = router;
