"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { listProposals } from "@/services/proposals";
import { Proposal } from "@/types";
import { formatDate } from "@/utils/format";

const POLL_INTERVAL_MS = 60_000;

export function NotificationBell() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [count, setCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const data = await listProposals({ status: "SENT,PENDING_REVIEW", page_size: "5" });
      setProposals(data.results);
      setCount(data.count);
    } catch {
      // silent — the bell is a convenience, not critical path
    }
  };

  useEffect(() => {
    if (user?.role !== "COMPANY_USER") return;
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (user?.role !== "COMPANY_USER") return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Notifications"
        className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-30 mt-2 w-72 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          <div className="border-b border-gray-100 px-4 py-2">
            <p className="text-sm font-semibold text-gray-900">Proposals Awaiting Review</p>
          </div>
          {proposals.length === 0 ? (
            <p className="px-4 py-4 text-sm text-gray-400">Nothing new right now.</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto">
              {proposals.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/company/proposals/${p.id}`}
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-2 hover:bg-gray-50"
                  >
                    <p className="truncate text-sm font-medium text-gray-800">{p.title}</p>
                    <p className="text-xs text-gray-400">{formatDate(p.updated_at)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-gray-100 px-4 py-2">
            <Link
              href="/company/proposals"
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              View all proposals
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
