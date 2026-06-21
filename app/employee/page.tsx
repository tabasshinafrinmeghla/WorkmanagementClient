"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import ProtectedRoute from "@/src/ProtectedRoute";
import { taskService, Task, CreateTaskInput } from "@/src/services/task.api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Shadcn UI Imports ──────────────────────────────────────────────────────
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Hydration Mismatch Safety Helpers ──────────────────────────────────────
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

// ─── Status Badge Component ──────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  "On process": "bg-orange-100 text-orange-600 border border-orange-300",
  Complete: "bg-green-100 text-green-600 border border-green-300",
  Pending: "bg-red-100 text-red-500 border border-red-300",
};

function StatusBadge({ status }: { status: Task["status"] }) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_STYLES[status] || ""}`}
    >
      {status}
    </span>
  );
}

// ─── Upsert Task Modal Component ─────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateTaskInput) => void;
  initial?: Task | null;
}

const EMPTY_FORM: CreateTaskInput = {
  title: "",
  teamMembers: [],
  date: "",
  status: "Pending",
};

function TaskModal({ open, onClose, onSave, initial }: ModalProps) {
  const [form, setForm] = useState<CreateTaskInput>(() =>
    open && initial
      ? {
          title: initial.title,
          teamMembers: initial.teamMembers,
          date: initial.date,
          status: initial.status,
        }
      : EMPTY_FORM
  );
  const [membersInput, setMembersInput] = useState(
    open && initial ? initial.teamMembers.join(", ") : ""
  );
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!form.title || !form.date || !membersInput.trim()) return;
    setLoading(true);
    const members = membersInput
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
    await onSave({ ...form, teamMembers: members });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-5">
          {initial ? "Edit Task" : "Create Task"}
        </h2>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Title
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. University apply"
            />
          </div>

          {/* Team Members */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team Members{" "}
              <span className="text-gray-400 font-normal">(comma-separated)</span>
            </label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              value={membersInput}
              onChange={(e) => setMembersInput(e.target.value)}
              placeholder="e.g. meghla, juale, tanjib"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as Task["status"] })
              }
            >
              <option>Pending</option>
              <option>On process</option>
              <option>Complete</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 text-sm rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition disabled:opacity-60"
          >
            {loading ? "Saving…" : initial ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm Delete Modal Component ───────────────────────────────────────────
function ConfirmModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
        <div className="text-4xl mb-3">🗑️</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Task?</h3>
        <p className="text-sm text-gray-500 mb-5">
          This action cannot be undone.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 text-sm rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page View ──────────────────────────────────────────────────────────
export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Safe client-side mount flag evaluation
  const mounted = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  // Modal workflows state
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchTasks = useCallback(async (q?: string) => {
    setLoading(true);
    setError("");
    try {
      const data = await taskService.getTasks(q);
      setTasks(data);
    } catch {
      setError("Failed to load tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const loadInitialTasks = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await taskService.getTasks();
        setTasks(data);
      } catch {
        setError("Failed to load tasks. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    void loadInitialTasks();
  }, [mounted]);

  // Debounced query logic
  useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(() => fetchTasks(search || undefined), 350);
    return () => clearTimeout(t);
  }, [search, fetchTasks, mounted]);

  // ── CRUD Request Hooks ──
  const handleSave = async (data: CreateTaskInput) => {
    if (editTask) {
      await taskService.updateTask(editTask._id, data);
    } else {
      await taskService.createTask(data);
    }
    setModalOpen(false);
    setEditTask(null);
    fetchTasks(search || undefined);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await taskService.deleteTask(deleteId);
    setDeleteId(null);
    fetchTasks(search || undefined);
  };

  // ── PDF Layout Builder ──
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Task List", 14, 15);

    autoTable(doc, {
      startY: 22,
      head: [["#", "Task", "Team Members", "Date", "Status"]],
      body: tasks.map((t, i) => [
        i + 1,
        t.title,
        t.teamMembers.join(", "),
        formatDate(t.date),
        t.status,
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [22, 163, 74] },
    });

    doc.save("tasks.pdf");
  };

  const formatDate = (raw: string) => {
    if (!raw) return "";
    const [y, m, d] = raw.split("-");
    if (y && m && d) return `${d}/${m}/${y}`;
    return raw;
  };

  if (!mounted) {
    return null;
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "employee"]}>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* ── Header Area ── */}
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <button
            onClick={() => {
              setEditTask(null);
              setModalOpen(true);
            }}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            Create task
          </button>

          <div className="flex items-center gap-2 flex-1 justify-end max-w-md">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
              </span>
              <input
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Print Export Action */}
            <button
              onClick={handleDownloadPDF}
              title="Download as PDF"
              className="p-2 border border-green-500 text-green-600 rounded-lg hover:bg-green-50 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 10l5 5 5-5M12 15V3" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Core Grid Layout Table ── */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-[2rem_1fr_1fr_130px_120px_48px] gap-3 px-4 py-3 border-b border-gray-100 text-sm font-semibold text-gray-700">
            <span></span>
            <span>Task</span>
            <span>Team members</span>
            <span>Date</span>
            <span>Status</span>
            <span></span>
          </div>

          {loading ? (
            Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[2rem_1fr_1fr_130px_120px_48px] gap-3 px-4 py-4 border-b border-gray-100 animate-pulse"
              >
                <div className="h-4 bg-gray-100 rounded w-4"></div>
                <div className="h-4 bg-gray-100 rounded w-28"></div>
                <div className="h-4 bg-gray-100 rounded w-36"></div>
                <div className="h-4 bg-gray-100 rounded w-20"></div>
                <div className="h-6 bg-gray-100 rounded-full w-20"></div>
                <div></div>
              </div>
            ))
          ) : error ? (
            <div className="text-center py-12 text-red-500 text-sm">{error}</div>
          ) : tasks.length === 0 ? (
            <>
              <div className="text-center py-8 text-gray-400 text-sm">
                No tasks found.
              </div>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 border-b border-gray-100 bg-gray-50/40" />
              ))}
            </>
          ) : (
            <>
              {tasks.map((task, idx) => (
                <div
                  key={task._id}
                  className="grid grid-cols-[2rem_1fr_1fr_130px_120px_48px] gap-3 px-4 py-4 border-b border-gray-100 items-center hover:bg-gray-50 transition text-sm text-gray-700"
                >
                  <span className="text-gray-400 font-medium">{idx + 1}</span>
                  <span className="font-medium text-gray-800">{task.title}</span>
                  <span className="text-gray-500">{task.teamMembers.join(", ")}</span>
                  <span>{formatDate(task.date)}</span>
                  <StatusBadge status={task.status} />

                  {/* ── Shadcn UI Dropdown Action Panel ── */}
                  <div className="flex justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded hover:bg-gray-100 text-gray-500 transition focus:outline-none">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <circle cx="10" cy="4" r="1.5" />
                            <circle cx="10" cy="10" r="1.5" />
                            <circle cx="10" cy="16" r="1.5" />
                          </svg>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32 bg-white border border-gray-100 shadow-md rounded-lg py-1">
                        <DropdownMenuItem
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer focus:outline-none"
                          onClick={() => {
                            setEditTask(task);
                            setModalOpen(true);
                          }}
                        >
                          ✏️ Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 cursor-pointer focus:outline-none"
                          onClick={() => {
                            setDeleteId(task._id);
                          }}
                        >
                          🗑️ Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}

              {/* Layout Compensation Spacers */}
              {tasks.length < 7 &&
                Array.from({ length: 7 - tasks.length }).map((_, i) => (
                  <div
                    key={`filler-${i}`}
                    className="h-12 border-b border-gray-100 bg-gray-50/30"
                  />
                ))}
            </>
          )}
        </div>
      </div>

      {/* Modals Containers */}
      <TaskModal
        key={`${modalOpen}-${editTask?._id ?? "new"}`}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditTask(null);
        }}
        onSave={handleSave}
        initial={editTask}
      />
      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </ProtectedRoute>
  );
}