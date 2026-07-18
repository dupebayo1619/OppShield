// src/routes/billing.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// GET billing information
router.get('/', authenticate, async (req, res) => {
  try {
    // For now, return mock billing data
    const billingData = {
      plan: 'Free',
      price: 0,
      billingCycle: 'monthly',
      nextBillingDate: null,
      usage: {
        tasksUsed: 0,
        tasksLimit: 100,
        storageUsed: '0 MB',
        storageLimit: '1 GB'
      }
    };

    res.json(billingData);
  } catch (error) {
    console.error('Error fetching billing:', error);
    res.status(500).json({ error: 'Failed to fetch billing information' });
  }
});

module.exports = router;
