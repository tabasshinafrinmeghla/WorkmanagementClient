"use client";

import ProtectedRoute from "@/src/ProtectedRoute";
import EmployeeTable from "@/src/components/EmployeeTable";

export default function TasksPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "employee"]}>
      {/* FIX: Changed bg-gray-50 to use global fluid variables */}
      <div className="min-h-screen bg-background text-foreground p-6 transition-colors duration-200">
        <EmployeeTable />
      </div>
    </ProtectedRoute>
  );
}