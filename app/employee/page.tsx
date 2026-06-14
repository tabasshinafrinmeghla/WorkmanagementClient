"use client";

import ProtectedRoute from "@/src/ProtectedRoute";

export default function EmployeesPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "employee"]}>
      <h1>👷 Employee Dashboard</h1>
    </ProtectedRoute>
  );
}