'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { featureFlags, FeatureFlag } from '@/lib/featureFlags';

export default function FeatureFlagsAdmin() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    loadFlags();
  }, [router]);

  const loadFlags = async () => {
    try {
      await featureFlags.loadFlags();
      setFlags(featureFlags.getAllFlags());
    } catch (error) {
      console.error('Error loading flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (flagName: string) => {
    console.log('🔄 Toggling flag:', flagName);
    setUpdating(flagName);
    setMessage(null);
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setMessage({ text: 'Please login again', type: 'error' });
        router.push('/login');
        return;
      }

      const flag = flags.find(f => f.name === flagName);
      if (!flag) {
        setMessage({ text: 'Flag not found', type: 'error' });
        return;
      }

      const newEnabled = !flag.enabled;
      console.log('📤 Sending request to enable:', newEnabled);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/feature-flags/${flagName}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled: newEnabled }),
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to update flag');
      }

      const data = await response.json();
      console.log('✅ Success:', data);

      setMessage({ 
        text: `✅ ${flagName} ${newEnabled ? 'enabled' : 'disabled'} successfully!`, 
        type: 'success' 
      });

      // Reload flags
      await loadFlags();
      
      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 500);

    } catch (error) {
      console.error('❌ Error toggling flag:', error);
      setMessage({ 
        text: error instanceof Error ? error.message : 'Failed to update feature flag', 
        type: 'error' 
      });
    } finally {
      setUpdating(null);
    }
  };

  const updatePercentage = async (flagName: string, percentage: number) => {
    setUpdating(flagName);
    setMessage(null);
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setMessage({ text: 'Please login again', type: 'error' });
        router.push('/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/feature-flags/${flagName}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ percentage }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to update percentage');
      }

      await loadFlags();
      setMessage({ text: `✅ ${flagName} rollout set to ${percentage}%`, type: 'success' });
      
    } catch (error) {
      console.error('Error updating percentage:', error);
      setMessage({ 
        text: error instanceof Error ? error.message : 'Failed to update rollout percentage', 
        type: 'error' 
      });
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-600">Loading feature flags...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Feature Flags</h1>
            <p className="text-sm text-gray-500">Manage feature rollouts and A/B testing</p>
          </div>
          <button
            onClick={loadFlags}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Refresh
          </button>
        </div>

        {message && (
          <div className={`mb-4 p-4 rounded-md ${
            message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Feature Flag
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rollout %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {flags.map((flag) => (
                  <tr key={flag.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{flag.name}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {flag.description || 'No description'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        flag.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {flag.enabled ? '✅ Enabled' : '❌ Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={flag.percentage || 0}
                          onChange={(e) => updatePercentage(flag.name, parseInt(e.target.value))}
                          className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          disabled={updating === flag.name}
                        />
                        <span className="text-sm text-gray-600 w-10">
                          {flag.percentage || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => toggleFlag(flag.name)}
                        disabled={updating === flag.name}
                        className={`px-3 py-1 rounded-md text-white ${
                          flag.enabled ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                        } ${updating === flag.name ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {updating === flag.name ? '...' : (flag.enabled ? 'Disable' : 'Enable')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800">💡 How Feature Flags Work</h3>
          <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
            <li><strong>Enabled</strong> - Feature is active for all users</li>
            <li><strong>Disabled</strong> - Feature is hidden from all users</li>
            <li><strong>Rollout %</strong> - Percentage of users who see the feature (A/B testing)</li>
            <li><strong>User-specific</strong> - Rollout is based on user ID hash, ensuring consistent experience</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
