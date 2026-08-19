import { publicApi } from "@/lib/api";
import { ReviewProposal } from "@/types";

export async function getReviewProposal(token: string): Promise<ReviewProposal> {
  const { data } = await publicApi.get(`/review/${token}/`);
  return data;
}

export async function approveProposal(token: string) {
  const { data } = await publicApi.post(`/review/${token}/approve/`);
  return data as { detail: string };
}

export async function rejectProposal(token: string, reason: string) {
  const { data } = await publicApi.post(`/review/${token}/reject/`, { reason });
  return data as { detail: string };
}

export async function requestProposalChanges(token: string, observation: string) {
  const { data } = await publicApi.post(`/review/${token}/changes/`, { observation });
  return data as { detail: string };
}
