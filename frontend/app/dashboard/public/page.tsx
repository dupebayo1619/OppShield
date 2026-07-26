// frontend/app/dashboard/public/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PublicStats {
  stats: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    totalOrgs: number;
  };
  updatedAt: string;
}

export default function PublicDashboardPage() {
  const [data, setData] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/public`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch public stats');
        }
        
        const result = await response.json();
        setData(result);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-500">Loading stats...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">OpsShield Platform Stats</h1>
      <p className="text-gray-500 mb-6">
        Real-time aggregate statistics from all organisations on the platform
      </p>
      
      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
              <h3 className="text-sm text-gray-500 font-medium">Total Tasks</h3>
              <p className="text-2xl font-bold">{data.stats.totalTasks}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
              <h3 className="text-sm text-gray-500 font-medium">Completed</h3>
              <p className="text-2xl font-bold">{data.stats.completedTasks}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
              <h3 className="text-sm text-gray-500 font-medium">Pending</h3>
              <p className="text-2xl font-bold">{data.stats.pendingTasks}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
              <h3 className="text-sm text-gray-500 font-medium">In Progress</h3>
              <p className="text-2xl font-bold">{data.stats.inProgressTasks}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
              <h3 className="text-sm text-gray-500 font-medium">Organisations</h3>
              <p className="text-2xl font-bold">{data.stats.totalOrgs}</p>
            </div>
          </div>
          
          <div className="mt-6 text-sm text-gray-400">
            Last updated: {new Date(data.updatedAt).toLocaleString()}
          </div>
        </>
      )}
      
      <div className="mt-6 text-center">
        <Link href="/login" className="text-blue-500 hover:underline">
          Sign in to access your full dashboard →
        </Link>
      </div>
    </div>
  );
}
