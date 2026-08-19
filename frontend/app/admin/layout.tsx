"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell allowedRole="MAIN_ADMIN" title="Admin Portal">
      {children}
    </DashboardShell>
  );
}
