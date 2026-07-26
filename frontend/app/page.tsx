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

export default function HomePage() {
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
        <div className="text-red-500">Error loading stats</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="max-w-4xl w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-2">
          OpsShield
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Internal operations platform — public stats
        </p>
        
        {data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <h3 className="text-sm text-gray-500 font-medium">Total Tasks</h3>
                <p className="text-2xl font-bold">{data.stats.totalTasks}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <h3 className="text-sm text-gray-500 font-medium">Completed</h3>
                <p className="text-2xl font-bold">{data.stats.completedTasks}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <h3 className="text-sm text-gray-500 font-medium">Pending</h3>
                <p className="text-2xl font-bold">{data.stats.pendingTasks}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <h3 className="text-sm text-gray-500 font-medium">In Progress</h3>
                <p className="text-2xl font-bold">{data.stats.inProgressTasks}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <h3 className="text-sm text-gray-500 font-medium">Organisations</h3>
                <p className="text-2xl font-bold">{data.stats.totalOrgs}</p>
              </div>
            </div>
            
            <div className="mt-4 text-center text-sm text-gray-400">
              Last updated: {new Date(data.updatedAt).toLocaleString()}
            </div>
          </>
        )}
        
        <div className="mt-8 text-center">
          <Link
            href="/login"
            className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Sign in to your dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
