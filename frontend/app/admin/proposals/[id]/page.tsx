"use client";

import { useParams } from "next/navigation";

import { ProposalWorkspace } from "@/components/proposals/ProposalWorkspace";

export default function AdminProposalDetailPage() {
  const params = useParams<{ id: string }>();
  return <ProposalWorkspace proposalId={params.id} backHref="/admin/proposals" canDelete canReassignManager />;
}
