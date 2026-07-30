'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      document.cookie = `accessToken=${data.accessToken}; path=/; max-age=900; SameSite=Lax`;
      document.cookie = `user=${encodeURIComponent(JSON.stringify(data.user))}; path=/; max-age=900; SameSite=Lax`;

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* ─── Left: Brand / Story panel ─────────────────────────── */}
      <div className="hidden md:flex md:w-1/2 bg-[#0F1729] text-white flex-col justify-between p-12 relative overflow-hidden">
        <div>
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">OS</span>
            </div>
            <span className="font-bold text-xl tracking-tight">OpsShield</span>
          </Link>
        </div>

        <div>
          <span className="text-accent text-xs font-mono tracking-widest uppercase">Sign in</span>
          <h1 className="mt-3 text-3xl font-bold leading-snug">
            Three teams.<br />One shield.
          </h1>
          <p className="mt-4 text-slate-400 text-sm max-w-sm">
            DevOps ships it, Cloud runs it, Security guards it —
            coordinated in one workspace.
          </p>

          <div className="mt-8 space-y-3 font-mono text-xs">
            <div className="flex items-center space-x-3">
              <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
              <span className="text-slate-300">7f3a91c2…e08b</span>
              <span className="text-slate-500">task.approve</span>
            </div>
            <div className="w-px h-3 bg-slate-700 ml-[3px]"></div>
            <div className="flex items-center space-x-3">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
              <span className="text-slate-300">b21d4e0f…2a7c</span>
              <span className="text-slate-500">member.invite</span>
            </div>
          </div>
        </div>

        <p className="text-slate-500 text-xs font-mono">
          SHA-256 hash-chained audit log · multi-tenant workflows
        </p>
      </div>

      {/* ─── Right: Form panel ─────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-surface p-8">
        <div className="max-w-sm w-full">
          <div className="flex justify-between items-center mb-8 md:hidden">
            <span className="font-bold text-lg text-ink">OpsShield</span>
            <Link href="/" className="text-sm text-muted hover:text-ink transition font-medium">
              🏠 Home
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-ink">Welcome back</h2>
          <p className="mt-1 text-sm text-muted">Sign in to continue to your workspace.</p>

          <form className="mt-8 space-y-5" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink mb-1.5">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-card text-ink placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ink mb-1.5">Password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-card text-ink placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-danger-soft border border-red-200 text-danger px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg font-medium text-white bg-accent hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 transition"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
