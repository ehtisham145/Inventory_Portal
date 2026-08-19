"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DashboardCard } from "@/components/layout/DashboardCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { extractErrorMessage } from "@/lib/api";
import { getAdminDashboard } from "@/services/dashboard";
import { AdminDashboard } from "@/types";
import { formatDateTime } from "@/utils/format";

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    setError("");
    try {
      setData(await getAdminDashboard());
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (isLoading) return <LoadingState label="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <DashboardCard label="Total Companies" value={data.total_companies} />
        <DashboardCard label="Total Managers" value={data.total_managers} />
        <DashboardCard label="Total Company Users" value={data.total_company_users} />
        <DashboardCard label="Total Proposals" value={data.total_proposals} />
        <DashboardCard label="Pending Review" value={data.pending_review} accent="amber" />
        <DashboardCard label="Approved" value={data.approved} accent="green" />
        <DashboardCard label="Rejected" value={data.rejected} accent="red" />
        <DashboardCard label="Changes Requested" value={data.changes_requested} accent="orange" />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Recent Activity</h2>
          <Link href="/admin/activity" className="text-xs font-medium text-blue-600 hover:underline">
            View all
          </Link>
        </div>
        {data.recent_activity.length === 0 ? (
          <EmptyState title="No recent activity" />
        ) : (
          <ul className="flex flex-col divide-y divide-gray-100">
            {data.recent_activity.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <span className="font-medium text-gray-800">{item.action}</span>
                  <span className="text-gray-500"> — {item.proposal_title}</span>
                </div>
                <span className="text-xs text-gray-400">{formatDateTime(item.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
