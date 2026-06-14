"use client";

import ProtectedRoute from "@/src/ProtectedRoute";

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <h1>🛠️ Admin Dashboard</h1>
    </ProtectedRoute>
  );
}