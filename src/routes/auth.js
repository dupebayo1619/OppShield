// src/routes/auth.js
const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/auth');
const { featureFlags } = require('../services/featureFlags');

// Register a new user (wrapped in feature flag)
router.post('/register', async (req, res, next) => {
  // Check if registration is enabled via feature flag
  try {
    const isRegistrationEnabled = featureFlags.isEnabled('new-registration-flow');
    
    if (!isRegistrationEnabled) {
      return res.status(403).json({ 
        error: 'Registration is temporarily disabled. Please try again later.' 
      });
    }
    
    // Pass to the register controller
    register(req, res, next);
  } catch (error) {
    console.error('Feature flag check failed:', error);
    // Allow registration if feature flag check fails
    register(req, res, next);
  }
});

// Login a user (no feature flag needed)
router.post('/login', login);

module.exports = router;
