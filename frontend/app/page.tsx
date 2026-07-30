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
  // ─── Fetch public stats ───────────────────────────────────────
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

  return (
    <div className="min-h-screen bg-card">
      {/* ─── Navigation ─────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#0F1729] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">OS</span>
              </div>
              <span className="text-foreground font-bold text-xl tracking-tight">OpsShield</span>
              <span className="text-muted text-xs font-mono hidden sm:inline-block bg-surface px-2 py-0.5 rounded">v2.0</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="px-4 py-2 text-sm text-muted hover:text-foreground transition font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="px-5 py-2.5 text-sm bg-accent text-white rounded-lg hover:bg-accent-dark transition font-medium shadow-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ───────────────────────────────────────── */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-accent-soft border border-accent/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
              <span className="text-accent-dark text-sm font-medium">Three Disciplines. One Platform.</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Built Across
              <span className="text-muted">
                {' '}DevOps · Cloud · Security
              </span>
            </h1>
            <p className="mt-6 text-lg text-muted max-w-2xl mx-auto leading-relaxed">
              A hash-chained audit log, multi-tenant task and approval workflows,
              and enterprise-grade infrastructure — delivered by three coordinated teams.
            </p>
            <p className="mt-4 text-sm text-muted">
              <a href="https://opsshield-sentinels.expadox.com" className="text-accent hover:text-accent-dark underline underline-offset-2">opsshield-sentinels.expadox.com</a>
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/login"
                className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent-dark transition font-medium shadow-sm"
              >
                Start Free Trial
              </Link>
              
              <a
                href="#disciplines"
                className="px-6 py-3 border border-border text-foreground rounded-lg hover:bg-surface transition font-medium"
              >
                Explore the Platform →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Public Stats Section ────────────────────────────────── */}
      <section className="py-12 px-4 bg-surface border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Platform Stats</h2>
            <p className="text-muted text-sm">Real-time metrics from across the platform</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-24">
              <div className="text-muted">Loading stats...</div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-24">
              <div className="text-danger text-sm">Unable to load stats</div>
            </div>
          ) : data ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-card border border-border rounded-lg p-6 text-center hover:shadow-sm transition">
                  <h3 className="text-sm text-muted font-medium">Total Tasks</h3>
                  <p className="text-3xl font-bold text-foreground">{data.stats.totalTasks}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-6 text-center hover:shadow-sm transition">
                  <h3 className="text-sm text-muted font-medium">Completed</h3>
                  <p className="text-3xl font-bold text-success">{data.stats.completedTasks}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-6 text-center hover:shadow-sm transition">
                  <h3 className="text-sm text-muted font-medium">Pending</h3>
                  <p className="text-3xl font-bold text-warning">{data.stats.pendingTasks}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-6 text-center hover:shadow-sm transition">
                  <h3 className="text-sm text-muted font-medium">In Progress</h3>
                  <p className="text-3xl font-bold text-info">{data.stats.inProgressTasks}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-6 text-center hover:shadow-sm transition">
                  <h3 className="text-sm text-muted font-medium">Organisations</h3>
                  <p className="text-3xl font-bold text-foreground">{data.stats.totalOrgs}</p>
                </div>
              </div>
              <div className="text-center mt-4 text-xs text-muted">
                Last updated: {new Date(data.updatedAt).toLocaleString()}
              </div>
            </>
          ) : null}
        </div>
      </section>

      {/* ─── Three Disciplines Section ──────────────────────────── */}
      <section id="disciplines" className="py-16 px-4 bg-[#0F1729]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-white">Three Teams, One Mission</h2>
            <p className="mt-2 text-slate-400">Coordinated across DevOps, Cloud, and Security</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* DevOps */}
            <div className="bg-[#1B2740] border border-accent/30 rounded-xl p-8 hover:border-accent/60 transition">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
                  <span className="text-2xl">⚙️</span>
                </div>
                <span className="text-accent text-xs font-bold font-mono tracking-wider bg-accent/20 border border-accent/50 px-2 py-0.5 rounded shadow-sm shadow-accent/20">DEVOPS</span>
              </div>
              <h3 className="text-lg font-semibold text-white">Shipping & Operations</h3>
              <p className="mt-3 text-slate-400 text-sm leading-relaxed">
                CI/CD · Password reset · Feature flags · Frontend · Domain/DNS management.
                <span className="block mt-2 text-slate-500 text-xs">Keeping the platform running, every day.</span>
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-xs bg-accent/10 border border-accent/20 text-accent px-2 py-1 rounded">GitHub Actions</span>
                <span className="text-xs bg-accent/10 border border-accent/20 text-accent px-2 py-1 rounded">Vercel</span>
                <span className="text-xs bg-accent/10 border border-accent/20 text-accent px-2 py-1 rounded">Feature Flags</span>
              </div>
            </div>

            {/* Cloud */}
            <div className="bg-[#1B2740] border border-info/30 rounded-xl p-8 hover:border-info/60 transition">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-info rounded-xl flex items-center justify-center">
                  <span className="text-2xl">☁️</span>
                </div>
                <span className="text-info text-xs font-mono bg-info/10 border border-info/30 px-2 py-0.5 rounded">CLOUD</span>
              </div>
              <h3 className="text-lg font-semibold text-white">AWS Infrastructure</h3>
              <p className="mt-3 text-slate-400 text-sm leading-relaxed">
                VPC · ECS · RDS · Secrets Manager · Auto Scaling · Well-Architected Review.
                <span className="block mt-2 text-slate-500 text-xs">Cost governance, security, and scale.</span>
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-xs bg-info/10 border border-info/20 text-info px-2 py-1 rounded">Fargate</span>
                <span className="text-xs bg-info/10 border border-info/20 text-info px-2 py-1 rounded">PostgreSQL</span>
                <span className="text-xs bg-info/10 border border-info/20 text-info px-2 py-1 rounded">Secrets Manager</span>
              </div>
            </div>

            {/* Security */}
            <div className="bg-[#1B2740] border border-warning/30 rounded-xl p-8 hover:border-warning/60 transition">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-warning rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🛡️</span>
                </div>
                <span className="text-warning text-xs font-mono bg-warning/10 border border-warning/30 px-2 py-0.5 rounded">SECURITY</span>
              </div>
              <h3 className="text-lg font-semibold text-white">Threat & Compliance</h3>
              <p className="mt-3 text-slate-400 text-sm leading-relaxed">
                Threat modeling · SAST · SBOM/CVE · Wazuh SIEM · MITRE ATT&CK · Pentesting.
                <span className="block mt-2 text-slate-500 text-xs">Trust, verified.</span>
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-xs bg-warning/10 border border-warning/20 text-warning px-2 py-1 rounded">MITRE ATT&CK</span>
                <span className="text-xs bg-warning/10 border border-warning/20 text-warning px-2 py-1 rounded">Wazuh</span>
                <span className="text-xs bg-warning/10 border border-warning/20 text-warning px-2 py-1 rounded">SBOM</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ─── Audit Log Preview ───────────────────────────────────── */}
      <section className="py-16 px-4 bg-surface border-y border-border">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#1B2740] border border-[#2C3A56] rounded-xl p-6 shadow-sm">
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex space-x-1.5">
                <span className="w-3 h-3 bg-danger rounded-full"></span>
                <span className="w-3 h-3 bg-warning rounded-full"></span>
                <span className="w-3 h-3 bg-success rounded-full"></span>
              </div>
              <span className="text-slate-400 text-xs font-mono ml-2">~ audit.log — hash-chained, tamper-evident</span>
              <span className="ml-auto text-success text-xs font-mono">✓ verified</span>
            </div>
            <div className="font-mono text-sm space-y-1.5 text-slate-300">
              <div className="flex items-start space-x-3 hover:bg-white/5 p-2 rounded transition">
                <span className="text-slate-500 text-xs whitespace-nowrap">[2026-07-30 14:23:01]</span>
                <span className="text-success">task_approve</span>
                <span className="text-slate-400">— user: admin@opsshield.io</span>
                <span className="text-slate-500 text-xs ml-auto font-mono">SHA256: 7f3a91c2_e88b</span>
              </div>
              <div className="flex items-start space-x-3 hover:bg-white/5 p-2 rounded transition">
                <span className="text-slate-500 text-xs whitespace-nowrap">[2026-07-30 14:22:45]</span>
                <span className="text-info">member_invite</span>
                <span className="text-slate-400">— user: admin@opsshield.io</span>
                <span className="text-slate-500 text-xs ml-auto font-mono">SHA256: b21d4e0f_7a7c</span>
              </div>
              <div className="flex items-start space-x-3 hover:bg-white/5 p-2 rounded transition">
                <span className="text-slate-500 text-xs whitespace-nowrap">[2026-07-30 14:21:58]</span>
                <span className="text-accent">billing.success</span>
                <span className="text-slate-400">— user: admin@opsshield.io</span>
                <span className="text-slate-500 text-xs ml-auto font-mono">SHA256: 4c9a71a5_d310</span>
              </div>
              <div className="flex items-start space-x-3 hover:bg-white/5 p-2 rounded transition border-t border-slate-700 pt-2 mt-1">
                <span className="text-slate-500 text-xs whitespace-nowrap">[2026-07-30 14:21:12]</span>
                <span className="text-warning">password_reset</span>
                <span className="text-slate-400">— user: member@opsshield.io</span>
                <span className="text-slate-500 text-xs ml-auto font-mono">SHA256: 8f2c91e3_a91d</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center">
              <span className="text-xs text-slate-400">Every action, chained to the one before it.</span>
              <span className="text-success text-xs font-mono">✓ chain intact · 1,247 events</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────── */}
      <section className="py-20 px-4 text-center bg-card">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground">Ready to secure your operations?</h2>
          <p className="mt-3 text-muted">Join teams that trust OpsShield for DevOps, Cloud, and Security.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/login"
              className="px-8 py-3 bg-accent text-white rounded-lg hover:bg-accent-dark transition font-medium shadow-sm"
            >
              Start Free Trial
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 border border-border text-foreground rounded-lg hover:bg-surface transition font-medium"
            >
              Sign In →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-border py-8 px-4 bg-surface">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center text-sm text-muted">
          <div className="flex items-center space-x-3">
            <span className="text-foreground font-bold">OpsShield</span>
            <span>© 2026</span>
            <span className="hidden sm:inline text-border">|</span>
            <span className="hidden sm:inline text-muted text-xs">DevOps · Cloud · Security</span>
          </div>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <Link href="/privacy" className="hover:text-foreground transition">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition">Terms</Link>
            <Link href="/docs" className="hover:text-foreground transition">Docs</Link>
            <Link href="/security" className="hover:text-foreground transition">Security</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
