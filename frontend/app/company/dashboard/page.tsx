"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DashboardCard } from "@/components/layout/DashboardCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { extractErrorMessage } from "@/lib/api";
import { getCompanyDashboard } from "@/services/dashboard";
import { listProposals } from "@/services/proposals";
import { CompanyDashboard, Proposal } from "@/types";
import { formatDate } from "@/utils/format";

export default function CompanyDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<CompanyDashboard | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [dashboardData, proposalsData] = await Promise.all([
        getCompanyDashboard(),
        listProposals({ page: "1" }),
      ]);
      setData(dashboardData);
      setProposals(proposalsData.results);
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
      <h2 className="text-lg font-semibold text-gray-900">Welcome, {user?.name}</h2>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <DashboardCard label="Pending Review" value={data.pending_review} accent="amber" />
        <DashboardCard label="Approved" value={data.approved} accent="green" />
        <DashboardCard label="Rejected" value={data.rejected} accent="red" />
        <DashboardCard label="Changes Requested" value={data.changes_requested} accent="orange" />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">My Proposals</h3>
        {proposals.length === 0 ? (
          <EmptyState title="No proposals yet" description="You'll see proposals here once Al Merak sends you one." />
        ) : (
          <ul className="flex flex-col divide-y divide-gray-100">
            {proposals.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.title}</p>
                  <p className="text-xs text-gray-400">{formatDate(p.updated_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={p.status} />
                  <Link href={`/company/proposals/${p.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                    View
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
