import { api, clearTokens, getRefreshToken, setTokens } from "@/lib/api";
import { User } from "@/types";

export async function login(email: string, password: string, remember: boolean = true) {
  const { data } = await api.post("/auth/login/", { email, password });
  setTokens(data.access, data.refresh, remember);
  return data.user as User;
}

export async function logout() {
  const refresh = getRefreshToken();
  try {
    await api.post("/auth/logout/", { refresh });
  } finally {
    clearTokens();
  }
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await api.get("/auth/me/");
  return data;
}
