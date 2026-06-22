const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface Task {
  _id: string;
  title: string;
  teamMembers: string[];
  date: string;
  status: "On process" | "Complete" | "Pending";
}

export interface CreateTaskInput {
  title: string;
  teamMembers: string[];
  date: string;
  status: "On process" | "Complete" | "Pending";
}

function getToken(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token") || "";
  }
  return "";
}

const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

export const taskService = {
  // queryStr is the full pre-built query string from EmployeeTable,
  // e.g. "?q=foo&status=Pending&date=2025-06" — forwarded as-is to the backend.
  async getTasks(queryStr?: string): Promise<Task[]> {
    const url = `${API_BASE}/tasks${queryStr ?? ""}`;
    const res = await fetch(url, { headers: headers() });
    if (!res.ok) throw new Error("Failed to fetch tasks");
    const json = await res.json();
    return json.data;
  },

  async createTask(data: CreateTaskInput): Promise<Task> {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create task");
    const json = await res.json();
    return json.data;
  },

  async updateTask(id: string, data: Partial<CreateTaskInput>): Promise<Task> {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update task");
    const json = await res.json();
    return json.data;
  },

  async deleteTask(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: "DELETE",
      headers: headers(),
    });
    if (!res.ok) throw new Error("Failed to delete task");
  },
};