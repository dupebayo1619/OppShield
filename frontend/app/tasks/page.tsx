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

interface OrgMember {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  role: 'ADMIN' | 'MEMBER';
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'MEMBER';
  organisations: {
    id: string;
    name: string;
    slug: string;
    role: 'ADMIN' | 'MEMBER';
  }[];
}

export default function TasksPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newRequiresApproval, setNewRequiresApproval] = useState(true);
  const [newAssignedToId, setNewAssignedToId] = useState('');

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
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
          localStorage.removeItem('accessToken');
          document.cookie = 'accessToken=; path=/; max-age=0';
          document.cookie = 'user=; path=/; max-age=0';
          router.push('/login');
          return;
        }

        if (!response.ok) throw new Error('Failed to fetch user');

        const userData = await response.json();
        setUser(userData);
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
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks`, {
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

  // ─── Fetch Org Members (for assignee dropdown) ───────────
  useEffect(() => {
    const orgId = user?.organisations?.[0]?.id;
    if (!orgId) return;

    const fetchMembers = async () => {
      try {
        const token = getToken();
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/organisations/${orgId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return;
        const data = await response.json();
        setOrgMembers(data.organisation?.members || []);
      } catch (err) {
        console.error('Failed to fetch org members:', err);
      }
    };

    fetchMembers();
  }, [user]);

  // ─── Create Task ──────────────────────────────────────────
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);
    try {
      const token = getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          requiresApproval: newRequiresApproval,
          assignedToId: newAssignedToId || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create task');
      }

      const data = await response.json();
      setTasks([data.task, ...tasks]);
      setShowCreateForm(false);
      setNewTitle('');
      setNewDescription('');
      setNewRequiresApproval(true);
      setNewAssignedToId('');
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setCreateLoading(false);
    }
  };

  // ─── Accept Task ─────────────────────────────────────────
  const handleAccept = async (taskId: string) => {
    setActionLoading(taskId);
    try {
      const token = getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${taskId}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to accept task');

      setTasks(tasks.map(task =>
        task.id === taskId
          ? { ...task, status: 'IN_PROGRESS' as const }
          : task
      ));
    } catch (err) {
      alert('Failed to accept task. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Complete Task ──────────────────────────────────────
  const handleComplete = async (taskId: string) => {
    setActionLoading(taskId);
    try {
      const token = getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to complete task');

      setTasks(tasks.map(task =>
        task.id === taskId
          ? { ...task, status: 'AWAITING_APPROVAL' as const }
          : task
      ));
    } catch (err) {
      alert('Failed to complete task. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Logout ──────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    document.cookie = 'accessToken=; path=/; max-age=0';
    document.cookie = 'user=; path=/; max-age=0';
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

  // ─── Render Action Button ──────────────────────────────
  const renderActionButton = (task: Task) => {
    if (task.assignedTo && task.assignedTo.id !== user?.id) {
      return null;
    }

    switch (task.status) {
      case 'PENDING':
        return (
          <button
            onClick={() => handleAccept(task.id)}
            disabled={actionLoading === task.id}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 transition"
          >
            {actionLoading === task.id ? 'Processing...' : '✅ Accept'}
          </button>
        );
      case 'IN_PROGRESS':
        return (
          <button
            onClick={() => handleComplete(task.id)}
            disabled={actionLoading === task.id}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition"
          >
            {actionLoading === task.id ? 'Processing...' : '📝 Complete'}
          </button>
        );
      case 'AWAITING_APPROVAL':
        return (
          <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded">
            ⏳ Awaiting Approval
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-4 py-2 bg-green-100 text-green-700 rounded">
            ✅ Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-4 py-2 bg-red-100 text-red-700 rounded">
            ❌ Rejected
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading tasks...</div>
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="bg-surface shadow-md sticky top-0 z-10 border-b border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-ink">OpsShield</span>
              <span className="ml-2 text-sm text-muted">Tasks</span>
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
              className="px-4 py-2 text-sm font-medium bg-surface text-ink border-b-2 border-ink whitespace-nowrap"
            >
              📋 Tasks
            </Link>
            <Link
              href="/settings"
              className="px-4 py-2 text-sm font-medium text-muted hover:text-ink hover:bg-surface whitespace-nowrap"
            >
              ⚙️ Settings
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-ink">All Tasks</h1>
          {user?.organisations?.[0]?.role === 'ADMIN' && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              + Create Task
            </button>
          )}
        </div>

        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20">
            <div className="bg-card rounded-lg shadow-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-bold mb-4 text-ink">Create Task</h2>
              {createError && (
                <div className="mb-4 text-sm text-red-600">{createError}</div>
              )}
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full border border-border bg-background text-ink rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Description</label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full border border-border bg-background text-ink rounded px-3 py-2"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Assign To</label>
                  <select
                    value={newAssignedToId}
                    onChange={(e) => setNewAssignedToId(e.target.value)}
                    className="w-full border border-border bg-background text-ink rounded px-3 py-2"
                  >
                    <option value="">Unassigned</option>
                    {orgMembers.map((m) => (
                      <option key={m.user.id} value={m.user.id}>
                        {m.user.firstName} {m.user.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requiresApproval"
                    checked={newRequiresApproval}
                    onChange={(e) => setNewRequiresApproval(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="requiresApproval" className="text-sm text-ink">
                    Requires approval
                  </label>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-sm text-muted hover:text-ink"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createLoading ? 'Creating...' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
            <h3 className="text-sm font-medium text-muted">Total Tasks</h3>
            <p className="text-3xl font-bold text-ink">{tasks.length}</p>
          </div>
          <div className="bg-yellow-50 p-6 rounded-lg shadow-sm border border-yellow-100">
            <h3 className="text-sm font-medium text-yellow-600">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {tasks.filter(t => t.status === 'PENDING').length}
            </p>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg shadow-sm border border-blue-100">
            <h3 className="text-sm font-medium text-blue-600">In Progress</h3>
            <p className="text-3xl font-bold text-blue-600">
              {tasks.filter(t => t.status === 'IN_PROGRESS').length}
            </p>
          </div>
          <div className="bg-green-50 p-6 rounded-lg shadow-sm border border-green-100">
            <h3 className="text-sm font-medium text-green-600">Completed</h3>
            <p className="text-3xl font-bold text-green-600">
              {tasks.filter(t => t.status === 'APPROVED').length}
            </p>
          </div>
        </div>

        {/* Task List */}
        <div className="bg-surface rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted">
                      No tasks available
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-background transition">
                      <td className="px-6 py-4">
                        <div className="font-medium text-ink">{task.title}</div>
                        <div className="text-sm text-muted">{task.description}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted">
                        {task.createdBy.firstName} {task.createdBy.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted">
                        {task.assignedTo
                          ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                          : 'Unassigned'
                        }
                      </td>
                      <td className="px-6 py-4">
                        {renderActionButton(task)}
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
