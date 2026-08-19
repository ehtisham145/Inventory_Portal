import { UserRole } from "@/types";

interface DecodedToken {
  user_id: string;
  role: UserRole;
  name: string;
  exp: number;
}

export function decodeToken(token: string): DecodedToken | null {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded) return true;
  return decoded.exp * 1000 < Date.now();
}

export function roleHomePath(role: UserRole): string {
  switch (role) {
    case "MAIN_ADMIN":
      return "/admin/dashboard";
    case "MANAGER":
      return "/manager/dashboard";
    case "COMPANY_USER":
      return "/company/dashboard";
    default:
      return "/login";
  }
}
