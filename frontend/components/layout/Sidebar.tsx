"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/layout/Logo";
import { UserRole } from "@/types";

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  MAIN_ADMIN: [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Proposals", href: "/admin/proposals" },
    { label: "Companies", href: "/admin/companies" },
    { label: "Managers", href: "/admin/managers" },
    { label: "Users", href: "/admin/users" },
    { label: "Activity", href: "/admin/activity" },
  ],
  MANAGER: [
    { label: "Dashboard", href: "/manager/dashboard" },
    { label: "Proposals", href: "/manager/proposals" },
    { label: "Companies", href: "/manager/companies" },
  ],
  COMPANY_USER: [
    { label: "Dashboard", href: "/company/dashboard" },
    { label: "My Proposals", href: "/company/proposals" },
  ],
};

interface SidebarProps {
  role: UserRole;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ role, mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const items = NAV_ITEMS[role];

  const navContent = (onNavigate?: () => void) => (
    <>
      <div className="flex justify-center px-4 py-4">
        <Logo size="sm" className="w-full" />
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 border-r border-gray-200 bg-white md:flex md:flex-col">
        {navContent()}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onMobileClose} aria-hidden="true" />
          <aside className="relative flex h-full w-64 max-w-[80vw] flex-col bg-white shadow-xl">
            {navContent(onMobileClose)}
          </aside>
        </div>
      )}
    </>
  );
}
