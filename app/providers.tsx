// app/providers.tsx
"use client";

import React from "react";
import { AuthProvider } from "@/src/context/AuthContext";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "../src/store"; // আপনার স্টোরের পাথ

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider store={store}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ReduxProvider>
  );
} 