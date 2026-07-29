'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'AWAITING_APPROVAL' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  assignedTo: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  requiresApproval: boolean;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'MEMBER';
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const getToken = () => localStorage.getItem('accessToken');

  // ─── Check Auth ──────────────────────────────────────────
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
          localStorage.removeItem('accessToken');
          router.push('/login');
          return;
        }

        if (!response.ok) throw new Error('Failed to fetch user');

        const userData = await response.json();
        setUser(userData);

        // If user is NOT admin, redirect to member dashboard
        if (userData.role !== 'ADMIN' && userData.role !== 'admin') {
          router.push('/dashboard');
          return;
        }
      } catch (err) {
        console.error('Auth error:', err);
        router.push('/login');
      }
    };

    fetchUser();
  }, [router]);

  // ─── Fetch Tasks ─────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const fetchTasks = async () => {
      try {
        const token = getToken();
        const response = await fetch('/api/tasks', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch tasks');

        const data = await response.json();
        setTasks(data.tasks || []);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tasks');
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user]);

  // ─── Approve Task ────────────────────────────────────────
  const handleApprove = async (taskId: string) => {
    setActionLoading(taskId);
    try {
      const token = getToken();
      const response = await fetch(`/api/tasks/${taskId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to approve task');

      setTasks(tasks.map(task =>
        task.id === taskId
          ? { ...task, status: 'APPROVED' as const }
          : task
      ));
    } catch (err) {
      alert('Failed to approve task. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Reject Task ─────────────────────────────────────────
  const handleReject = async (taskId: string) => {
    setActionLoading(taskId);
    try {
      const token = getToken();
      const response = await fetch(`/api/tasks/${taskId}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to reject task');

      setTasks(tasks.map(task =>
        task.id === taskId
          ? { ...task, status: 'REJECTED' as const }
          : task
      ));
    } catch (err) {
      alert('Failed to reject task. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Logout ──────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  // ─── Render Status Badge ─────────────────────────────────
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      AWAITING_APPROVAL: 'bg-purple-100 text-purple-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  // ─── Filter Tasks ────────────────────────────────────────
  const awaitingApproval = tasks.filter(t => t.status === 'AWAITING_APPROVAL');
  const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS');
  const pending = tasks.filter(t => t.status === 'PENDING');
  const approved = tasks.filter(t => t.status === 'APPROVED');

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading admin dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">OpsShield</span>
              <span className="ml-2 text-sm text-blue-600 font-medium">Admin</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user?.firstName || 'Admin'}
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
              href="/admin/dashboard"
              className="px-4 py-2 text-sm font-medium bg-blue-50 text-blue-600 border-b-2 border-blue-600 whitespace-nowrap"
            >
              📊 Dashboard
            </Link>
            <Link
              href="/admin/feature-flags"
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 whitespace-nowrap"
            >
              🚩 Feature Flags
            </Link>
            <Link
              href="/billing"
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 whitespace-nowrap"
            >
              💳 Billing
            </Link>
            <Link
              href="/settings"
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 whitespace-nowrap"
            >
              ⚙️ Settings
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500">Total Tasks</h3>
            <p className="text-3xl font-bold text-gray-900">{tasks.length}</p>
          </div>
          <div className="bg-yellow-50 p-6 rounded-lg shadow-sm border border-yellow-100">
            <h3 className="text-sm font-medium text-yellow-600">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600">{pending.length}</p>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg shadow-sm border border-blue-100">
            <h3 className="text-sm font-medium text-blue-600">In Progress</h3>
            <p className="text-3xl font-bold text-blue-600">{inProgress.length}</p>
          </div>
          <div className="bg-purple-50 p-6 rounded-lg shadow-sm border border-purple-100">
            <h3 className="text-sm font-medium text-purple-600">Awaiting Approval</h3>
            <p className="text-3xl font-bold text-purple-600">{awaitingApproval.length}</p>
          </div>
          <div className="bg-green-50 p-6 rounded-lg shadow-sm border border-green-100">
            <h3 className="text-sm font-medium text-green-600">Approved</h3>
            <p className="text-3xl font-bold text-green-600">{approved.length}</p>
          </div>
        </div>

        {/* Awaiting Approval Section */}
        {awaitingApproval.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-purple-200 overflow-hidden mb-6">
            <div className="bg-purple-50 px-6 py-4 border-b border-purple-200">
              <h2 className="text-lg font-semibold text-purple-700">
                ⏳ Awaiting Approval ({awaitingApproval.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {awaitingApproval.map(task => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium">{task.title}</div>
                        <div className="text-sm text-gray-500">{task.description}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Awaiting Approval
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {task.createdBy.firstName} {task.createdBy.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {task.assignedTo
                          ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                          : 'Unassigned'
                        }
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(task.id)}
                            disabled={actionLoading === task.id}
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                          >
                            {actionLoading === task.id ? '...' : '✅ Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(task.id)}
                            disabled={actionLoading === task.id}
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                          >
                            {actionLoading === task.id ? '...' : '❌ Reject'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* All Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">All Tasks</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tasks.filter(t => t.status !== 'AWAITING_APPROVAL').length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No tasks available
                    </td>
                  </tr>
                ) : (
                  tasks.filter(t => t.status !== 'AWAITING_APPROVAL').map(task => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium">{task.title}</div>
                        <div className="text-sm text-gray-500">{task.description}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {task.createdBy.firstName} {task.createdBy.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {task.assignedTo
                          ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                          : 'Unassigned'
                        }
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
