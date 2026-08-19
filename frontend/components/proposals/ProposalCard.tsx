import Link from "next/link";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { Proposal } from "@/types";
import { formatDate } from "@/utils/format";

export function ProposalCard({ proposal, href }: { proposal: Proposal; href: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-gray-900">{proposal.title}</h3>
        <StatusBadge status={proposal.status} />
      </div>
      <p className="text-sm text-gray-500">{proposal.company_detail?.company_name}</p>
      <p className="text-xs text-gray-400">Updated {formatDate(proposal.updated_at)}</p>
    </Link>
  );
}
