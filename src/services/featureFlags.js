class FeatureFlagService {
  constructor() {
    this.flags = new Map();
    this.loadDefaultFlags();
  }

  loadDefaultFlags() {
    const defaultFlags = [
      { name: 'new-billing-ui', enabled: false, description: 'New billing interface' },
      { name: 'new-registration-flow', enabled: false, description: 'New registration flow' },
      { name: 'analytics-widget', enabled: false, description: 'Dashboard analytics widget' },
      { name: 'bulk-actions', enabled: true, description: 'Bulk actions for tasks' },
    ];

    defaultFlags.forEach(flag => {
      this.flags.set(flag.name, flag);
    });
  }

  isEnabled(flagName) {
    const flag = this.flags.get(flagName);
    return flag ? flag.enabled : false;
  }

  getFlag(flagName) {
    return this.flags.get(flagName);
  }

  getAllFlags() {
    return Array.from(this.flags.values());
  }

  // In a real implementation, this would fetch from a database
  async refresh() {
    // For now, just reload defaults
    this.flags.clear();
    this.loadDefaultFlags();
  }
}

// Singleton instance
const featureFlags = new FeatureFlagService();

module.exports = { featureFlags };
