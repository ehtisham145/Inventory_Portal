import { ProposalStatus } from "@/types";

export const STATUS_LABELS: Record<ProposalStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  PENDING_REVIEW: "Pending Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CHANGES_REQUESTED: "Changes Requested",
  RESUBMITTED: "Resubmitted",
};

export const STATUS_STYLES: Record<ProposalStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700 border-gray-200",
  SENT: "bg-blue-50 text-blue-700 border-blue-200",
  PENDING_REVIEW: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-green-50 text-green-700 border-green-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  CHANGES_REQUESTED: "bg-orange-50 text-orange-700 border-orange-200",
  RESUBMITTED: "bg-indigo-50 text-indigo-700 border-indigo-200",
};
