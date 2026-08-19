"use client";

import { useEffect, useState } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Pagination } from "@/components/ui/Pagination";
import { ProposalCard } from "@/components/proposals/ProposalCard";
import { extractErrorMessage } from "@/lib/api";
import { listProposals } from "@/services/proposals";
import { Proposal } from "@/types";

export default function CompanyProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async (targetPage = page) => {
    setIsLoading(true);
    setError("");
    try {
      const data = await listProposals({ page: String(targetPage) });
      setProposals(data.results);
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

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={() => load(page)} />;
  if (proposals.length === 0) return <EmptyState title="No proposals yet" />;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {proposals.map((p) => (
          <ProposalCard key={p.id} proposal={p} href={`/company/proposals/${p.id}`} />
        ))}
      </div>
      <Pagination
        page={page}
        hasNext={proposals.length > 0 && page * 20 < count}
        hasPrevious={page > 1}
        onPageChange={load}
        totalCount={count}
      />
    </div>
  );
}
