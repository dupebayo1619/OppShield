// src/routes/auth.js
const express = require('express');
const router = express.Router();
const { register, login, refresh, logout, forgotPassword, resetPassword, me } = require('../controllers/auth');
const { authenticate } = require('../middleware/auth');
const { featureFlags } = require('../services/featureFlags');

// Register a new user (wrapped in feature flag)
router.post('/register', async (req, res, next) => {
  try {
    const isRegistrationEnabled = featureFlags.isEnabled('new-registration-flow');

    if (!isRegistrationEnabled) {
      return res.status(403).json({
        error: 'Registration is temporarily disabled. Please try again later.'
      });
    }

    register(req, res, next);
  } catch (error) {
    console.error('Feature flag check failed:', error);
    register(req, res, next);
  }
});

// Login a user (no feature flag needed)
router.post('/login', login);

// Refresh access token using the httpOnly refresh cookie
router.post('/refresh', refresh);

// Logout — clears auth cookies
router.post('/logout', authenticate, logout);

// Request a password reset
router.post('/forgot-password', forgotPassword);

// Reset password with a valid token
router.post('/reset-password', resetPassword);

// Get the currently authenticated user
router.get('/me', authenticate, me);

// Test endpoint to check routing
router.get('/test', (req, res) => {
  res.json({ message: 'Auth route is working!' });
});

module.exports = router;
