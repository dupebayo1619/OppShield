'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { featureFlags } from '@/lib/featureFlags';

const PLANS = [
  { id: 'STARTER', name: 'Starter', price: '₦5,000/mo', color: 'amber' },
  { id: 'PRO', name: 'Pro', price: '₦9,000/mo', color: 'cyan' },
];

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [isNewBillingEnabled, setIsNewBillingEnabled] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('PRO');
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

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/billing/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Checkout failed');
      }
      window.location.href = data.url;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to start checkout');
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-ink">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-ink mb-6">Billing & Subscription</h1>
        {isNewBillingEnabled ? (
          // New Billing UI (Feature Flagged)
          <div className="bg-blue-950/30 border border-blue-900/40 rounded-lg p-6 mb-8">
            <p className="text-blue-400 font-semibold">✨ New Billing Experience</p>
            <p className="text-blue-400/80 text-sm mt-1">This is the new billing interface.</p>
            {/* Add new billing components here */}
          </div>
        ) : (
          // Current Billing UI
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
                <h3 className="text-sm text-muted">Current Plan</h3>
                <p className="text-xl font-bold text-ink">Free</p>
              </div>
              <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
                <h3 className="text-sm text-muted">Price</h3>
                <p className="text-xl font-bold text-ink">$0/mo</p>
              </div>
              <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
                <h3 className="text-sm text-muted">Next Billing Date</h3>
                <p className="text-xl font-bold text-ink">N/A</p>
              </div>
            </div>

            <div className="bg-surface p-6 rounded-lg shadow-sm border border-border mb-8">
              <h2 className="text-lg font-semibold text-ink mb-4">Usage</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted">Tasks Used</p>
                  <p className="text-lg text-ink">0 / 100</p>
                  <div className="w-full bg-border rounded-full h-2 mt-2">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '0%' }} />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted">Storage Used</p>
                  <p className="text-lg text-ink">0 MB / 1 GB</p>
                  <div className="w-full bg-border rounded-full h-2 mt-2">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '0%' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface p-6 rounded-lg shadow-sm border border-border mb-8">
              <h2 className="text-lg font-semibold text-ink mb-4">Choose a Plan</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PLANS.map((plan) => {
                  const isSelected = selectedPlan === plan.id;
                  const c = plan.color === 'cyan'
                    ? { border: isSelected ? 'border-cyan-400' : 'border-border hover:border-cyan-700', bg: isSelected ? 'bg-cyan-950/30' : 'bg-surface', text: 'text-cyan-400' }
                    : { border: isSelected ? 'border-amber-400' : 'border-border hover:border-amber-700', bg: isSelected ? 'bg-amber-950/30' : 'bg-surface', text: 'text-amber-400' };
                  return (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`text-left p-4 rounded-lg border-2 transition ${c.border} ${c.bg}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-bold ${c.text}`}>{plan.name}</span>
                        {isSelected && (
                          <span className={`text-sm font-medium ${c.text}`}>✓ Selected</span>
                        )}
                      </div>
                      <p className="text-ink text-sm mt-1 font-semibold">{plan.price}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleUpgrade}
              disabled={checkoutLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {checkoutLoading ? 'Redirecting...' : `Upgrade to ${PLANS.find(p => p.id === selectedPlan)?.name}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
