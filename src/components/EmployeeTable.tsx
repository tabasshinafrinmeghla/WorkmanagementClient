"use client";

import { useState, useEffect, useCallback, useMemo, useSyncExternalStore } from "react";
import { taskService, Task, CreateTaskInput } from "@/src/services/task.api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

// ─── Static Constants (never change, safe at module level) ───────────────────
const MONTHS = [
  { value: "01", label: "Jan" },
  { value: "02", label: "Feb" },
  { value: "03", label: "Mar" },
  { value: "04", label: "Apr" },
  { value: "05", label: "May" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Aug" },
  { value: "09", label: "Sep" },
  { value: "10", label: "Oct" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dec" },
];

// Days 01–31 — static, safe at module level
const DAYS = Array.from({ length: 31 }, (_, i) =>
  String(i + 1).padStart(2, "0")
);

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  "On process":
    "bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-300 dark:border-orange-900/60",
  Complete:
    "bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400 border border-green-300 dark:border-green-900/60",
  Pending:
    "bg-red-100 dark:bg-red-950/40 text-red-500 dark:text-red-400 border border-red-300 dark:border-red-900/60",
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

// ─── Upsert Task Modal ────────────────────────────────────────────────────────
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-card dark:bg-neutral-900 border border-border rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-foreground mb-5">
          {initial ? "Edit Task" : "Create Task"}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Task Title
            </label>
            <input
              className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-foreground"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. University apply"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Team Members{" "}
              <span className="text-neutral-400 dark:text-neutral-500 font-normal">
                (comma-separated)
              </span>
            </label>
            <input
              className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-foreground"
              value={membersInput}
              onChange={(e) => setMembersInput(e.target.value)}
              placeholder="e.g. meghla, juale, tanjib"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Date
            </label>
            <input
              type="date"
              className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-foreground scheme-light dark:scheme-dark"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Status
            </label>
            <select
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-card text-foreground"
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as Task["status"] })
              }
            >
              <option className="bg-card text-foreground">Pending</option>
              <option className="bg-card text-foreground">On process</option>
              <option className="bg-card text-foreground">Complete</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted transition"
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

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
        <div className="text-4xl mb-3">🗑️</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Delete Task?
        </h3>
        <p className="text-sm text-muted-foreground mb-5">
          This action cannot be undone.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted transition"
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

// ─── Shared select style helper ───────────────────────────────────────────────
const selectCls =
  "border border-border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-muted text-foreground transition cursor-pointer";

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EmployeeTable() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Granular date filter state
  const [yearFilter, setYearFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const mounted = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  // ✅ HYDRATION FIX: new Date() must only run on the client.
  // Computing YEARS at module level causes SSR vs client mismatch because
  // the server and client clocks can differ by a second / timezone.
  // useMemo with an empty dep array runs once after mount — client-only.
  const YEARS = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, i) =>
      String(currentYear - 10 + i)
    );
  }, []);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Build the date query param from the three selectors.
  // Rules: year required; month optional; day requires month.
  const buildDateParam = (y: string, m: string, d: string): string => {
    if (!y) return "";
    if (!m) return y;            // "YYYY"
    if (!d) return `${y}-${m}`; // "YYYY-MM"
    return `${y}-${m}-${d}`;    // "YYYY-MM-DD"
  };

  const fetchTasks = useCallback(async (queryStr?: string) => {
    setLoading(true);
    setError("");
    try {
      const data = await taskService.getTasks(queryStr);
      setTasks(data);
    } catch {
      setError("Failed to load tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams();
      if (search.trim()) params.append("q", search.trim());
      if (statusFilter !== "All") params.append("status", statusFilter);

      const dateParam = buildDateParam(yearFilter, monthFilter, dayFilter);
      if (dateParam) params.append("date", dateParam);

      const queryString = params.toString() ? `?${params.toString()}` : undefined;
      fetchTasks(queryString);
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [search, statusFilter, yearFilter, monthFilter, dayFilter, fetchTasks, mounted]);

  // Re-fetch preserving all current filters
  const refetch = useCallback(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.append("q", search.trim());
    if (statusFilter !== "All") params.append("status", statusFilter);
    const dateParam = buildDateParam(yearFilter, monthFilter, dayFilter);
    if (dateParam) params.append("date", dateParam);
    fetchTasks(params.toString() ? `?${params.toString()}` : undefined);
  }, [search, statusFilter, yearFilter, monthFilter, dayFilter, fetchTasks]);

  const handleSave = async (data: CreateTaskInput) => {
    if (editTask) {
      await taskService.updateTask(editTask._id, data);
    } else {
      await taskService.createTask(data);
    }
    setModalOpen(false);
    setEditTask(null);
    refetch();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await taskService.deleteTask(deleteId);
    setDeleteId(null);
    refetch();
  };

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

  const hasDateFilter = !!(yearFilter || monthFilter || dayFilter);
  const hasAnyFilter = statusFilter !== "All" || hasDateFilter;

  const clearDateFilters = () => {
    setYearFilter("");
    setMonthFilter("");
    setDayFilter("");
  };

  if (!mounted) return null;

  return (
    <>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <button
          onClick={() => {
            setEditTask(null);
            setModalOpen(true);
          }}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition shadow-sm whitespace-nowrap"
        >
          Create task
        </button>

        <div className="flex items-center gap-2 flex-1 justify-end flex-wrap sm:flex-nowrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[150px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                />
              </svg>
            </span>
            <input
              className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-card transition"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status */}
          <select
            className={`${selectCls} max-w-[140px]`}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="On process">On process</option>
            <option value="Complete">Complete</option>
          </select>

          {/* Year — always available */}
          <select
            className={`${selectCls} w-[90px]`}
            value={yearFilter}
            onChange={(e) => {
              setYearFilter(e.target.value);
              if (!e.target.value) {
                setMonthFilter("");
                setDayFilter("");
              }
            }}
          >
            <option value="">Year</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Month — requires year */}
          <select
            className={`${selectCls} w-[80px]`}
            value={monthFilter}
            onChange={(e) => {
              setMonthFilter(e.target.value);
              if (!e.target.value) setDayFilter("");
            }}
            disabled={!yearFilter}
          >
            <option value="">Month</option>
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          {/* Day — requires month */}
          <select
            className={`${selectCls} w-[70px]`}
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
            disabled={!monthFilter}
          >
            <option value="">Day</option>
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Clear all active filters */}
          {hasAnyFilter && (
            <button
              onClick={() => {
                setStatusFilter("All");
                clearDateFilters();
              }}
              className="text-xs font-medium text-red-500 hover:text-red-600 px-2 py-2 border border-transparent hover:border-red-200 dark:hover:border-red-950 rounded-md transition whitespace-nowrap"
            >
              Clear
            </button>
          )}

          {/* Download PDF */}
          <button
            onClick={handleDownloadPDF}
            title="Download as PDF"
            className="p-2 border border-green-500 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-50/50 dark:hover:bg-green-950/20 transition shrink-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 10l5 5 5-5M12 15V3"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="grid grid-cols-[2rem_1fr_1fr_130px_120px_48px] gap-3 px-4 py-3 border-b border-border text-sm font-semibold text-muted-foreground bg-muted/30">
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
              className="grid grid-cols-[2rem_1fr_1fr_130px_120px_48px] gap-3 px-4 py-4 border-b border-border animate-pulse"
            >
              <div className="h-4 bg-muted rounded w-4"></div>
              <div className="h-4 bg-muted rounded w-28"></div>
              <div className="h-4 bg-muted rounded w-36"></div>
              <div className="h-4 bg-muted rounded w-20"></div>
              <div className="h-6 bg-muted rounded-full w-20"></div>
              <div></div>
            </div>
          ))
        ) : error ? (
          <div className="text-center py-12 text-red-500 text-sm">{error}</div>
        ) : tasks.length === 0 ? (
          <>
            <div className="text-center py-8 text-muted-foreground text-sm">
              No tasks found.
            </div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 border-b border-border bg-muted/10" />
            ))}
          </>
        ) : (
          <>
            {tasks.map((task, idx) => (
              <div
                key={task._id}
                className="grid grid-cols-[2rem_1fr_1fr_130px_120px_48px] gap-3 px-4 py-4 border-b border-border items-center hover:bg-muted/40 transition text-sm text-foreground/90"
              >
                <span className="text-muted-foreground font-medium">
                  {idx + 1}
                </span>
                <span className="font-medium text-foreground">{task.title}</span>
                <span className="text-muted-foreground">
                  {task.teamMembers.join(", ")}
                </span>
                <span>{formatDate(task.date)}</span>
                <StatusBadge status={task.status} />

                <div className="flex justify-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded hover:bg-muted text-muted-foreground transition focus:outline-none">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <circle cx="10" cy="4" r="1.5" />
                          <circle cx="10" cy="10" r="1.5" />
                          <circle cx="10" cy="16" r="1.5" />
                        </svg>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-32 bg-popover border border-border shadow-md rounded-lg py-1 text-popover-foreground"
                    >
                      <DropdownMenuItem
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted cursor-pointer focus:outline-none"
                        onClick={() => {
                          setEditTask(task);
                          setModalOpen(true);
                        }}
                      >
                        ✏️ Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-destructive/10 dark:hover:bg-red-950/30 cursor-pointer focus:outline-none"
                        onClick={() => setDeleteId(task._id)}
                      >
                        🗑️ Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}

            {tasks.length < 7 &&
              Array.from({ length: 7 - tasks.length }).map((_, i) => (
                <div
                  key={`filler-${i}`}
                  className="h-12 border-b border-border bg-muted/5"
                />
              ))}
          </>
        )}
      </div>

      {/* Modals */}
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
    </>
  );
}