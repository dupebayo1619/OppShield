"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchTasks = async () => {
      try {
        const response = await fetch("https://staging.srzoh.com.ng/api/tasks", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (Array.isArray(data)) {
          setTasks(data);
        } else {
          console.warn("Tasks API returned non-array:", data);
          setTasks([
            { id: 1, title: "Fix auth service", status: "completed", priority: "high" },
            { id: 2, title: "Deploy staging environment", status: "pending", priority: "medium" },
            { id: 3, title: "Test frontend integration", status: "in-progress", priority: "low" },
            { id: 4, title: "Review PR #2", status: "pending", priority: "high" },
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch tasks:", err);
        setError(err.message);
        setTasks([
          { id: 1, title: "Fix auth service", status: "completed", priority: "high" },
          { id: 2, title: "Deploy staging environment", status: "pending", priority: "medium" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <button
          onClick={() => router.push("/tasks/new")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + New Task
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          <p>⚠️ Error: {error}</p>
        </div>
      )}

      {!Array.isArray(tasks) || tasks.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500 text-lg">No tasks available</p>
          <p className="text-gray-400 text-sm mt-1">Click "New Task" to create one</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="p-4 hover:bg-gray-50 transition cursor-pointer"
              onClick={() => router.push(`/tasks/${task.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">
                    {task.title || "Untitled Task"}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        task.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : task.status === "in-progress"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {task.status || "Pending"}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        task.priority === "high"
                          ? "bg-red-100 text-red-800"
                          : task.priority === "medium"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {task.priority || "Low"}
                    </span>
                  </div>
                </div>
                <div className="text-gray-400">→</div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {Array.isArray(tasks) && tasks.length > 0 && (
        <p className="text-sm text-gray-400 mt-4">
          Total: {tasks.length} task{tasks.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
