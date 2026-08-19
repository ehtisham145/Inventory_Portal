import { api } from "@/lib/api";
import { Paginated, User, UserRole } from "@/types";

export interface UserInput {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  company?: string | null;
  password?: string;
  is_active?: boolean;
}

export async function listUsers(params?: Record<string, string>): Promise<Paginated<User>> {
  const { data } = await api.get("/users/", { params });
  return data;
}

export async function getUser(id: string): Promise<User> {
  const { data } = await api.get(`/users/${id}/`);
  return data;
}

export async function createUser(input: UserInput): Promise<User> {
  const { data } = await api.post("/users/", input);
  return data;
}

export async function updateUser(id: string, input: Partial<UserInput>): Promise<User> {
  const { data } = await api.patch(`/users/${id}/`, input);
  return data;
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}/`);
}

/** Permanently removes the user record. Cannot be undone — separate from the soft-delete above. */
export async function permanentlyDeleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}/permanent/`);
}

export async function bulkDeleteUsers(ids: string[]): Promise<{ detail: string; deleted_count: number; skipped_count: number }> {
  const { data } = await api.post("/users/bulk-delete/", { ids });
  return data;
}
