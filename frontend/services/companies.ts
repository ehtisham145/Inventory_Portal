import { api } from "@/lib/api";
import { Company, Paginated } from "@/types";

export interface CompanyInput {
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  status?: "ACTIVE" | "INACTIVE";
}

export async function listCompanies(params?: Record<string, string>): Promise<Paginated<Company>> {
  const { data } = await api.get("/companies/", { params });
  return data;
}

export async function getCompany(id: string): Promise<Company> {
  const { data } = await api.get(`/companies/${id}/`);
  return data;
}

export async function createCompany(input: CompanyInput): Promise<Company> {
  const { data } = await api.post("/companies/", input);
  return data;
}

export async function updateCompany(id: string, input: Partial<CompanyInput>): Promise<Company> {
  const { data } = await api.patch(`/companies/${id}/`, input);
  return data;
}

export async function deleteCompany(id: string): Promise<void> {
  await api.delete(`/companies/${id}/`);
}

/** Permanently removes the company (and cascades to delete all of its proposals). Cannot be undone. */
export async function permanentlyDeleteCompany(id: string): Promise<void> {
  await api.delete(`/companies/${id}/permanent/`);
}

export async function resendCompanyInvite(id: string): Promise<{ detail: string }> {
  const { data } = await api.post(`/companies/${id}/resend-invite/`);
  return data;
}

export async function bulkDeleteCompanies(
  ids: string[]
): Promise<{ detail: string; deleted_count: number; deleted_proposals: number }> {
  const { data } = await api.post("/companies/bulk-delete/", { ids });
  return data;
}
