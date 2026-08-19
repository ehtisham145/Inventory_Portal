"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { extractErrorMessage } from "@/lib/api";
import { getProposal, getProposalHistory, getProposalObservations } from "@/services/proposals";
import { Observation, Proposal, ProposalHistoryItem } from "@/types";
import { formatDateTime } from "@/utils/format";

const AWAITING_ACTION = ["SENT", "PENDING_REVIEW"];

export default function CompanyProposalDetailPage() {
  const params = useParams<{ id: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [history, setHistory] = useState<ProposalHistoryItem[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [proposalData, historyData, observationsData] = await Promise.all([
        getProposal(params.id),
        getProposalHistory(params.id),
        getProposalObservations(params.id),
      ]);
      setProposal(proposalData);
      setHistory(historyData);
      setObservations(observationsData);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!proposal) return null;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">{proposal.title}</h2>
        <StatusBadge status={proposal.status} />
      </div>

      {AWAITING_ACTION.includes(proposal.status) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          This proposal is awaiting your review. Please use the secure link sent to your email or WhatsApp to
          approve, reject, or request changes.
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Message</p>
        <p dir="auto" className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
          {proposal.message}
        </p>

        {proposal.attachments.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Attachments</p>
            <ul className="mt-2 flex flex-col gap-1">
              {proposal.attachments.map((att) => (
                <li key={att.id}>
                  <a href={att.file} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">
                    {att.file_name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {observations.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">My Observations</p>
          <ul className="flex flex-col gap-3">
            {observations.map((obs) => (
              <li key={obs.id} className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                {obs.observation}
                <p className="mt-1 text-xs text-gray-400">{formatDateTime(obs.created_at)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">History</p>
        <ul className="flex flex-col gap-3">
          {history.map((h) => (
            <li key={h.id} className="text-sm">
              <p className="font-medium text-gray-800">{h.action}</p>
              <p className="text-xs text-gray-400">{formatDateTime(h.created_at)}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
