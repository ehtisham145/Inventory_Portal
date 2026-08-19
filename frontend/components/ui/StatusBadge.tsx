import { ProposalStatus } from "@/types";
import { STATUS_LABELS, STATUS_STYLES } from "@/utils/status";

export function StatusBadge({ status }: { status: ProposalStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
