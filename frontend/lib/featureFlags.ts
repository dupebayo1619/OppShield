// frontend/lib/featureFlags.ts
import { useState, useEffect } from 'react';

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  percentage?: number;
  description?: string;
}

interface FeatureFlagsResponse {
  name: string;
  enabled: boolean;
  percentage: number;
  description: string;
}

class FeatureFlagService {
  private flags: Map<string, FeatureFlag> = new Map();
  private isLoading: boolean = false;
  private loadPromise: Promise<void> | null = null;

  constructor() {
    this.loadFlags();
  }

  async loadFlags(): Promise<void> {
    if (this.isLoading) {
      return this.loadPromise || Promise.resolve();
    }

    this.isLoading = true;
    this.loadPromise = this._fetchFlags();
    await this.loadPromise;
    this.isLoading = false;
  }

  private async _fetchFlags(): Promise<void> {
    try {
      // Check if we're in the browser (prevents SSR errors)
      if (typeof window === 'undefined') {
        this.loadDefaultFlags();
        return;
      }

      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.warn('No access token found, using default flags');
        this.loadDefaultFlags();
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/feature-flags`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch feature flags');
      }

      const data: FeatureFlagsResponse[] = await response.json();
      
      data.forEach(flag => {
        this.flags.set(flag.name, {
          name: flag.name,
          enabled: flag.enabled,
          percentage: flag.percentage,
          description: flag.description,
        });
      });
    } catch (error) {
      console.error('Error loading feature flags:', error);
      this.loadDefaultFlags();
    }
  }

  private loadDefaultFlags(): void {
    const defaultFlags: FeatureFlag[] = [
      { name: 'new-billing-ui', enabled: false, percentage: 0, description: 'New billing interface' },
      { name: 'analytics-widget', enabled: false, percentage: 0, description: 'Dashboard analytics widget' },
      { name: 'task-automation', enabled: true, percentage: 100, description: 'Task automation features' },
      { name: 'dark-mode', enabled: false, percentage: 0, description: 'Dark mode UI' },
      { name: 'ai-assistant', enabled: false, percentage: 0, description: 'AI-powered task assistant' },
      { name: 'bulk-actions', enabled: true, percentage: 50, description: 'Bulk actions for tasks' },
      { name: 'notifications', enabled: true, percentage: 100, description: 'Real-time notifications' },
    ];

    defaultFlags.forEach(flag => {
      this.flags.set(flag.name, flag);
    });
  }

  isEnabled(flagName: string): boolean {
    const flag = this.flags.get(flagName);
    return flag?.enabled || false;
  }

  getFlag(flagName: string): FeatureFlag | undefined {
    return this.flags.get(flagName);
  }

  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  async refresh(): Promise<void> {
    await this.loadFlags();
  }
}

// Singleton instance
export const featureFlags = new FeatureFlagService();

// React hook for using feature flags
export function useFeatureFlag(flagName: string): boolean {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFlag = async () => {
      await featureFlags.loadFlags();
      setEnabled(featureFlags.isEnabled(flagName));
      setLoading(false);
    };
    checkFlag();
  }, [flagName]);

  return enabled;
}
