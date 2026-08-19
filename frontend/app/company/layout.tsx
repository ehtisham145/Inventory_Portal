"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell allowedRole="COMPANY_USER" title="My Portal">
      {children}
    </DashboardShell>
  );
}
