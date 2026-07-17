'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { featureFlags } from '@/lib/featureFlags';

interface DashboardData {
  stats: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    totalOrgs: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    timestamp: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    // Load feature flags
    const loadFlags = async () => {
      await featureFlags.loadFlags();
      setShowAnalytics(featureFlags.isEnabled('analytics-widget'));
      setShowBulkActions(featureFlags.isEnabled('bulk-actions'));
    };
    loadFlags();

    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch('https://staging.srzoh.com.ng/api/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          localStorage.removeItem('accessToken');
          router.push('/login');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard');
        }

        const dashboardData = await response.json();
        setData(dashboardData);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-gray-900">OpsShield</h1>
            <div className="flex space-x-4">
              <Link href="/dashboard" className="text-gray-700 hover:text-gray-900">Dashboard</Link>
              <Link href="/tasks" className="text-gray-700 hover:text-gray-900">Tasks</Link>
              <Link href="/billing" className="text-gray-700 hover:text-gray-900">Billing</Link>
              <Link href="/admin/feature-flags" className="text-gray-700 hover:text-gray-900">Feature Flags</Link>
              <button onClick={handleLogout} className="text-red-600 hover:text-red-800">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm text-gray-500">Total Tasks</h3>
            <p className="text-2xl font-bold">{data?.stats.totalTasks || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm text-gray-500">Completed</h3>
            <p className="text-2xl font-bold text-green-600">{data?.stats.completedTasks || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm text-gray-500">Pending</h3>
            <p className="text-2xl font-bold text-yellow-600">{data?.stats.pendingTasks || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm text-gray-500">Organizations</h3>
            <p className="text-2xl font-bold text-blue-600">{data?.stats.totalOrgs || 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          {data?.recentActivity?.length ? (
            <ul className="divide-y">
              {data.recentActivity.map((activity) => (
                <li key={activity.id} className="py-3">
                  <p className="text-sm text-gray-700">{activity.action}</p>
                  <p className="text-xs text-gray-400">{new Date(activity.timestamp).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No recent activity</p>
          )}
        </div>

        {/* Feature Flag: Analytics Widget */}
        {showAnalytics && (
          <div className="bg-white p-6 rounded-lg shadow mt-6">
            <h2 className="text-lg font-semibold mb-4">📊 Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600">Total Users</p>
                <p className="text-2xl font-bold text-blue-800">42</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600">Active Sessions</p>
                <p className="text-2xl font-bold text-green-800">12</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600">Completion Rate</p>
                <p className="text-2xl font-bold text-purple-800">78%</p>
              </div>
            </div>
          </div>
        )}

        {/* Feature Flag: Bulk Actions */}
        {showBulkActions && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
            <h3 className="text-sm font-medium text-yellow-800">⚡ Bulk Actions (Beta)</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Select multiple tasks and perform actions in bulk.
            </p>
            <div className="flex space-x-2 mt-2">
              <button className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700">
                Select All
              </button>
              <button className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700">
                Bulk Delete
              </button>
              <button className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700">
                Bulk Complete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
