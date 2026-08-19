"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { LoadingState } from "@/components/ui/LoadingState";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types";

interface DashboardShellProps {
  allowedRole: UserRole;
  title: string;
  children: React.ReactNode;
}

export function DashboardShell({ allowedRole, title, children }: DashboardShellProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== allowedRole) {
      router.replace("/unauthorized");
    }
  }, [isLoading, user, allowedRole, router]);

  if (isLoading || !user || user.role !== allowedRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoadingState label="Loading your dashboard..." />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={allowedRole} mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Navbar title={title} onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="min-w-0 flex-1 px-4 py-6 md:px-6">{children}</main>
      </div>
    </div>
  );
}
