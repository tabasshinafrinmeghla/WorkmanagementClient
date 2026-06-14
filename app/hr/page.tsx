"use client";

import ProtectedRoute from "@/src/ProtectedRoute";



export default function HRPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "hr"]}>
      <h1>👨‍💼 HR Dashboard</h1>
    </ProtectedRoute>
  );
}