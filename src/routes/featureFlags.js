// src/routes/featureFlags.js
const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');

// Feature flags configuration
const featureFlags = {
  'new-billing-ui': {
    enabled: false,
    percentage: 0,
    description: 'New billing interface with improved UX',
  },
  'analytics-widget': {
    enabled: false,
    percentage: 0,
    description: 'Dashboard analytics widget',
  },
  'task-automation': {
    enabled: true,
    percentage: 100,
    description: 'Task automation features',
  },
  'dark-mode': {
    enabled: false,
    percentage: 0,
    description: 'Dark mode UI',
  },
  'ai-assistant': {
    enabled: false,
    percentage: 0,
    description: 'AI-powered task assistant',
  },
  'bulk-actions': {
    enabled: true,
    percentage: 50,
    description: 'Bulk actions for tasks (50% rollout)',
  },
  'notifications': {
    enabled: true,
    percentage: 100,
    description: 'Real-time notifications',
  },
};

// ─── AUTHENTICATION ──────────────────────────────────────────────────
// All routes require authentication
router.use(authenticate);

// ─── GET all feature flags ─────────────────────────────────────────
router.get('/', (req, res) => {
  const userId = req.user?.id || 'test-user';
  const flags = Object.entries(featureFlags).map(([name, config]) => {
    let isEnabled = config.enabled;
    if (config.percentage !== undefined) {
      const hash = hashString(userId + name);
      isEnabled = isEnabled && hash <= config.percentage;
    }
    return {
      name,
      enabled: isEnabled,
      percentage: config.percentage,
      description: config.description,
    };
  });
  res.status(200).json(flags);
});

// ─── GET single feature flag ──────────────────────────────────────
router.get('/:flagName', (req, res) => {
  const { flagName } = req.params;
  const userId = req.user?.id || 'test-user';
  const config = featureFlags[flagName];
  if (!config) {
    return res.status(404).json({ error: 'Feature flag not found' });
  }
  let isEnabled = config.enabled;
  if (config.percentage !== undefined) {
    const hash = hashString(userId + flagName);
    isEnabled = isEnabled && hash <= config.percentage;
  }
  res.status(200).json({
    name: flagName,
    enabled: isEnabled,
    percentage: config.percentage,
    description: config.description,
  });
});

// ─── UPDATE feature flag (Admin only) ─────────────────────────────
router.put('/:flagName', requireAdmin, (req, res) => {
  const { flagName } = req.params;
  const { enabled, percentage, description } = req.body;
  console.log('📥 Updating flag:', flagName, { enabled, percentage, description });

  if (!featureFlags[flagName]) {
    console.log('❌ Flag not found:', flagName);
    return res.status(404).json({ error: 'Feature flag not found' });
  }

  if (enabled !== undefined) {
    featureFlags[flagName].enabled = enabled;
    console.log(`✅ ${flagName} enabled: ${enabled}`);
  }
  if (percentage !== undefined) {
    featureFlags[flagName].percentage = percentage;
  }
  if (description !== undefined) {
    featureFlags[flagName].description = description;
  }

  res.status(200).json({
    name: flagName,
    enabled: featureFlags[flagName].enabled,
    percentage: featureFlags[flagName].percentage,
    description: featureFlags[flagName].description,
  });
});

// ─── HELPER ─────────────────────────────────────────────────────────
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash) % 100;
}

module.exports = router;

