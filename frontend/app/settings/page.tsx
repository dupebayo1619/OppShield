'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

  // ─── Helper: Get Token ──────────────────────────────────────
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
        const response = await fetch('/api/auth/me', {
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
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setMessage('Scan the QR code with your authenticator app');
        setError('');
        setIsMfaSetup(true);
      }
    } catch (error) {
      setError('Failed to setup MFA');
    }
  };

  // ─── Verify MFA Setup ──────────────────────────────────────
  const handleVerifySetup = async () => {
    if (!setupCode) {
      setError('Please enter the 6-digit code');
      return;
    }

    const token = getToken();
    try {
      const response = await fetch('/api/auth/mfa/verify-setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: setupCode })
      });
      
      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setMessage('✅ MFA enabled successfully!');
        setMfaEnabled(true);
        setQrCode('');
        setSecret('');
        setSetupCode('');
        setIsMfaSetup(false);
        if (data.backupCodes) {
          alert('Save these backup codes: ' + data.backupCodes.join(', '));
        }
      }
    } catch (error) {
      setError('Failed to verify MFA');
    }
  };

  // ─── Disable MFA ────────────────────────────────────────────
  const handleDisableMfa = async () => {
    const password = prompt('Enter your password:');
    const code = prompt('Enter your current 6-digit code:');
    if (!password || !code) return;

    const token = getToken();
    try {
      const response = await fetch('/api/auth/mfa/disable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password, code })
      });
      
      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setMessage('✅ MFA disabled successfully');
        setMfaEnabled(false);
      }
    } catch (error) {
      setError('Failed to disable MFA');
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      {/* User Info */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-2">Account</h2>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
        <p><strong>Role:</strong> {user.role}</p>
        <p><strong>MFA Status:</strong> {mfaEnabled ? '✅ Enabled' : '❌ Disabled'}</p>
      </div>

      {/* MFA Section */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Multi-Factor Authentication</h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>
        )}
        {message && (
          <div className="bg-green-100 text-green-700 p-2 rounded mb-4">{message}</div>
        )}

        {!mfaEnabled ? (
          <>
            {!qrCode ? (
              <button
                onClick={handleEnableMfa}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Enable MFA
              </button>
            ) : (
              <div className="space-y-4">
                <p>Scan this QR code with Google Authenticator or Authy:</p>
                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                <p className="text-sm text-gray-500">
                  Or enter this secret manually: <code className="bg-gray-100 p-1 rounded">{secret}</code>
                </p>
                <div>
                  <label className="block mb-1">Enter 6-digit code:</label>
                  <input
                    type="text"
                    value={setupCode}
                    onChange={(e) => setSetupCode(e.target.value)}
                    className="border p-2 rounded w-32"
                    placeholder="123456"
                    maxLength={6}
                  />
                  <button
                    onClick={handleVerifySetup}
                    className="ml-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Verify
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <button
            onClick={handleDisableMfa}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Disable MFA
          </button>
        )}
      </div>
    </div>
  );
}
