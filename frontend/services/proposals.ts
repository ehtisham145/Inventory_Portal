import { api } from "@/lib/api";
import { Observation, Paginated, Proposal, ProposalHistoryItem } from "@/types";

export interface ProposalInput {
  title: string;
  company: string;
  manager?: string | null;
  message: string;
}

export async function listProposals(params?: Record<string, string>): Promise<Paginated<Proposal>> {
  const { data } = await api.get("/proposals/", { params });
  return data;
}

export async function getProposal(id: string): Promise<Proposal> {
  const { data } = await api.get(`/proposals/${id}/`);
  return data;
}

export async function createProposal(input: ProposalInput): Promise<Proposal> {
  const { data } = await api.post("/proposals/", input);
  return data;
}

export async function updateProposal(id: string, input: Partial<ProposalInput>): Promise<Proposal> {
  const { data } = await api.patch(`/proposals/${id}/`, input);
  return data;
}

export async function deleteProposal(id: string): Promise<void> {
  await api.delete(`/proposals/${id}/`);
}

export async function bulkDeleteProposals(ids: string[]): Promise<{ detail: string; deleted_count: number }> {
  const { data } = await api.post("/proposals/bulk-delete/", { ids });
  return data;
}

export async function sendProposal(id: string) {
  const { data } = await api.post(`/proposals/${id}/send/`);
  return data as { detail: string; review_url: string; whatsapp_link: string | null; proposal: Proposal };
}

export async function resendProposal(id: string) {
  const { data } = await api.post(`/proposals/${id}/resend/`);
  return data as { detail: string; review_url: string; whatsapp_link: string | null; proposal: Proposal };
}

export async function sendProposalEmailNow(id: string): Promise<{ detail: string }> {
  const { data } = await api.post(`/proposals/${id}/send-email/`);
  return data;
}

export async function getProposalHistory(id: string): Promise<ProposalHistoryItem[]> {
  const { data } = await api.get(`/proposals/${id}/history/`);
  return data.results ?? data;
}

export async function getProposalObservations(id: string): Promise<Observation[]> {
  const { data } = await api.get(`/proposals/${id}/observations/`);
  return data.results ?? data;
}

export async function uploadProposalAttachment(id: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post(`/proposals/${id}/attachments/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
