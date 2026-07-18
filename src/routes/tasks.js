// src/routes/tasks.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth'); // Correct import

// Get all tasks
router.get('/', authenticate, async (req, res) => {
  try {
    // TODO: Implement get tasks
    res.json({ message: 'Get tasks endpoint' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get task by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    // TODO: Implement get task by id
    res.json({ message: 'Get task by id endpoint' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create task
router.post('/', authenticate, async (req, res) => {
  try {
    // TODO: Implement create task
    res.json({ message: 'Create task endpoint' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update task
router.put('/:id', authenticate, async (req, res) => {
  try {
    // TODO: Implement update task
    res.json({ message: 'Update task endpoint' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete task
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // TODO: Implement delete task
    res.json({ message: 'Delete task endpoint' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
