"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell allowedRole="MANAGER" title="Manager Portal">
      {children}
    </DashboardShell>
  );
}
