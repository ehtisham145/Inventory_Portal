import { publicApi } from "@/lib/api";

export interface InviteInfo {
  name: string;
  email: string;
  company_name: string | null;
}

export async function getInviteInfo(token: string): Promise<InviteInfo> {
  const { data } = await publicApi.get(`/invite/${token}/`);
  return data;
}

export async function setInvitePassword(token: string, password: string): Promise<{ detail: string }> {
  const { data } = await publicApi.post(`/invite/${token}/set-password/`, { password });
  return data;
}
