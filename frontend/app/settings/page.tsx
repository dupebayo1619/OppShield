'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [setupCode, setSetupCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isMfaSetup, setIsMfaSetup] = useState(false);

  const getToken = () => localStorage.getItem('accessToken');

  // ─── Check User ─────────────────────────────────────────────
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const checkAuth = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          router.push('/login');
          return;
        }
        const data = await response.json();
        setUser(data);
        setMfaEnabled(data.mfaEnabled || false);
        setLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  // ─── Enable MFA ─────────────────────────────────────────────
  const handleEnableMfa = async () => {
    const token = getToken();
    try {
      const response = await fetch('/api/auth/mfa/setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      const data = await response.json();
      if (response.ok) {
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setSetupCode(data.setupCode);
        setIsMfaSetup(true);
        setMessage('');
        setError('');
      } else {
        setError(data.error || 'Failed to setup MFA');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  // ─── Verify MFA ─────────────────────────────────────────────
  const handleVerifyMfa = async () => {
    const token = getToken();
    try {
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: setupCode }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('MFA enabled successfully!');
        setMfaEnabled(true);
        setIsMfaSetup(false);
        setQrCode('');
        setSecret('');
        setSetupCode('');
        setError('');
      } else {
        setError(data.error || 'Invalid verification code');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  // ─── Disable MFA ────────────────────────────────────────────
  const handleDisableMfa = async () => {
    const token = getToken();
    try {
      const response = await fetch('/api/auth/mfa/disable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      if (response.ok) {
        setMessage('MFA disabled successfully!');
        setMfaEnabled(false);
        setError('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to disable MFA');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  // ─── Logout ──────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    document.cookie = 'accessToken=; path=/; max-age=0';
    document.cookie = 'user=; path=/; max-age=0';
    router.push('/login');
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="bg-surface shadow-md sticky top-0 z-10 border-b border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-ink">OpsShield</span>
              <span className="ml-2 text-sm text-muted">Settings</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-ink">
                Welcome, {user?.firstName || 'User'}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex space-x-1 overflow-x-auto">
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-muted hover:text-ink hover:bg-surface whitespace-nowrap"
            >
              🏠 Home
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-medium text-muted hover:text-ink hover:bg-surface whitespace-nowrap"
            >
              📊 Dashboard
            </Link>
            <Link
              href="/tasks"
              className="px-4 py-2 text-sm font-medium text-muted hover:text-ink hover:bg-surface whitespace-nowrap"
            >
              📋 Tasks
            </Link>
            <Link
              href="/settings"
              className="px-4 py-2 text-sm font-medium bg-surface text-ink border-b-2 border-ink whitespace-nowrap"
            >
              ⚙️ Settings
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-ink">Settings</h1>

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Account Info */}
        <div className="bg-surface rounded-lg shadow p-6 mb-6 border border-border">
          <h2 className="text-lg font-semibold mb-4 text-ink">Account</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-muted">Email</span>
              <p className="font-medium text-ink">{user?.email}</p>
            </div>
            <div>
              <span className="text-sm text-muted">Name</span>
              <p className="font-medium text-ink">{user?.firstName} {user?.lastName}</p>
            </div>
            <div>
              <span className="text-sm text-muted">Role</span>
              <p className="font-medium capitalize text-ink">{user?.role}</p>
            </div>
            <div>
              <span className="text-sm text-muted">MFA Status</span>
              <p className="font-medium text-ink">
                {mfaEnabled ? '✅ Enabled' : '❌ Disabled'}
              </p>
            </div>
          </div>
        </div>

        {/* MFA Section */}
        <div className="bg-surface rounded-lg shadow p-6 border border-border">
          <h2 className="text-lg font-semibold mb-4 text-ink">Multi-Factor Authentication</h2>

          {!mfaEnabled ? (
            <>
              {!isMfaSetup ? (
                <button
                  onClick={handleEnableMfa}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Enable MFA
                </button>
              ) : (
                <div>
                  <p className="text-sm text-muted mb-4">
                    Scan the QR code with your authenticator app, then enter the 6-digit code below.
                  </p>
                  {qrCode && (
                    <div className="mb-4">
                      <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                    </div>
                  )}
                  {secret && (
                    <div className="mb-4">
                      <span className="text-sm text-muted">Secret Key:</span>
                      <code className="ml-2 bg-background text-ink px-2 py-1 rounded font-mono text-sm border border-border">
                        {secret}
                      </code>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={setupCode}
                      onChange={(e) => setSetupCode(e.target.value)}
                      className="px-3 py-2 border border-border bg-background text-ink rounded"
                      maxLength={6}
                    />
                    <button
                      onClick={handleVerifyMfa}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Verify
                    </button>
                    <button
                      onClick={() => setIsMfaSetup(false)}
                      className="px-4 py-2 bg-surface text-ink border border-border rounded hover:bg-background"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <button
              onClick={handleDisableMfa}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Disable MFA
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
