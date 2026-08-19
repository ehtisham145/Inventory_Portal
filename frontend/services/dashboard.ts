import { api } from "@/lib/api";
import { AdminDashboard, CompanyDashboard, ManagerDashboard, Paginated, ProposalHistoryItem } from "@/types";

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const { data } = await api.get("/dashboard/admin/");
  return data;
}

export async function getManagerDashboard(): Promise<ManagerDashboard> {
  const { data } = await api.get("/dashboard/manager/");
  return data;
}

export async function getCompanyDashboard(): Promise<CompanyDashboard> {
  const { data } = await api.get("/dashboard/company/");
  return data;
}

export async function getActivityLog(params?: Record<string, string>): Promise<Paginated<ProposalHistoryItem>> {
  const { data } = await api.get("/activity/", { params });
  return data;
}
