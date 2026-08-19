"use client";

import { useEffect, useState } from "react";

import { Column, DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Pagination } from "@/components/ui/Pagination";
import { extractErrorMessage } from "@/lib/api";
import { getActivityLog } from "@/services/dashboard";
import { ProposalHistoryItem } from "@/types";
import { formatDateTime } from "@/utils/format";

export default function ActivityPage() {
  const [items, setItems] = useState<ProposalHistoryItem[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async (targetPage = page) => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getActivityLog({ page: String(targetPage) });
      setItems(data.results);
      setCount(data.count);
      setPage(targetPage);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: Column<ProposalHistoryItem>[] = [
    { header: "Action", render: (h) => <span className="font-medium text-gray-900">{h.action}</span> },
    { header: "Proposal", render: (h) => h.proposal_title },
    { header: "From", render: (h) => h.old_status || "—" },
    { header: "To", render: (h) => h.new_status || "—" },
    { header: "Performed By", render: (h) => h.performed_by_name },
    { header: "Date", render: (h) => formatDateTime(h.created_at) },
  ];

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={() => load(page)} />;
  if (items.length === 0) return <EmptyState title="No activity recorded yet" />;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <DataTable columns={columns} rows={items} keyField={(h) => h.id} />
      <Pagination
        page={page}
        hasNext={items.length > 0 && page * 20 < count}
        hasPrevious={page > 1}
        onPageChange={load}
        totalCount={count}
      />
    </div>
  );
}
