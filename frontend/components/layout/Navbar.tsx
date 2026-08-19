"use client";

import { useState } from "react";

import { NotificationBell } from "@/components/layout/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { initials } from "@/utils/format";

const ROLE_LABELS: Record<string, string> = {
  MAIN_ADMIN: "Main Admin",
  MANAGER: "Manager",
  COMPANY_USER: "Company User",
};

export function Navbar({ title, onMenuClick }: { title: string; onMenuClick?: () => void }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="flex min-w-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            aria-label="Open menu"
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 md:hidden"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <h1 className="min-w-0 truncate text-lg font-semibold text-gray-900">{title}</h1>
      </div>
      {user && (
        <div className="flex shrink-0 items-center gap-2">
          <NotificationBell />
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-gray-200 py-1 pl-1 pr-3 text-sm hover:bg-gray-50"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
                {initials(user.name)}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block font-medium text-gray-900">{user.name}</span>
                <span className="block text-xs text-gray-500">{ROLE_LABELS[user.role]}</span>
              </span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-30 mt-2 w-44 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                <button
                  onClick={logout}
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
