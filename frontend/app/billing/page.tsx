'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { featureFlags } from '@/lib/featureFlags';  // ← Added

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [isNewBillingEnabled, setIsNewBillingEnabled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    // Check feature flags
    const checkFlags = async () => {
      await featureFlags.loadFlags();
      setIsNewBillingEnabled(featureFlags.isEnabled('new-billing-ui'));
      setLoading(false);
    };
    checkFlags();
  }, [router]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Billing & Subscription</h1>

        {isNewBillingEnabled ? (
          // New Billing UI (Feature Flagged)
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <p className="text-blue-800 font-semibold">✨ New Billing Experience</p>
            <p className="text-blue-600 text-sm mt-1">This is the new billing interface.</p>
            {/* Add new billing components here */}
          </div>
        ) : (
          // Current Billing UI
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm text-gray-500">Current Plan</h3>
                <p className="text-xl font-bold">Free</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm text-gray-500">Price</h3>
                <p className="text-xl font-bold">$0/mo</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm text-gray-500">Next Billing Date</h3>
                <p className="text-xl font-bold">N/A</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <h2 className="text-lg font-semibold mb-4">Usage</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Tasks Used</p>
                  <p className="text-lg">0 / 100</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '0%' }} />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Storage Used</p>
                  <p className="text-lg">0 MB / 1 GB</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '0%' }} />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => alert('Upgrade feature coming soon!')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Upgrade Plan
            </button>
          </>
        )}
      </div>
    </div>
  );
}
