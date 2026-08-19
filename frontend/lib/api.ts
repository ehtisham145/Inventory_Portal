import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const ACCESS_TOKEN_KEY = "almerak_access_token";
export const REFRESH_TOKEN_KEY = "almerak_refresh_token";

// "Remember me" controls where tokens live: localStorage survives closing the browser,
// sessionStorage is cleared as soon as the tab/browser closes. Both are checked on read so a
// session started either way keeps working after a refresh.
export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(access: string, refresh: string, remember: boolean = true) {
  clearTokens();
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(ACCESS_TOKEN_KEY, access);
  storage.setItem(REFRESH_TOKEN_KEY, refresh);
}

function wasRemembered() {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(REFRESH_TOKEN_KEY) !== null;
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

export const api = axios.create({
  baseURL: API_URL,
});

// Public client for unauthenticated endpoints (e.g. /review/{token}/).
export const publicApi = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<() => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        redirectToLogin();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingQueue.push(() => resolve(api(originalRequest)));
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh/`, { refresh: refreshToken });
        setTokens(data.access, refreshToken, wasRemembered());
        pendingQueue.forEach((cb) => cb());
        pendingQueue = [];
        return api(originalRequest);
      } catch (refreshError) {
        clearTokens();
        redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

function redirectToLogin() {
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

export function extractFieldErrors(error: unknown): Record<string, string> | null {
  if (!axios.isAxiosError(error)) return null;
  const data = error.response?.data as { error?: { details?: Record<string, string[]> | null } } | undefined;
  const details = data?.error?.details;
  if (!details || typeof details !== "object") return null;

  const fieldErrors: Record<string, string> = {};
  for (const [field, messages] of Object.entries(details)) {
    if (field === "non_field_errors" || field === "detail") continue;
    if (Array.isArray(messages) && messages.length > 0) {
      fieldErrors[field] = messages.join(" ");
    }
  }
  return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
}

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { error?: { message?: string; details?: Record<string, string[]> | null } }
      | undefined;
    const details = data?.error?.details;
    if (details && typeof details === "object") {
      const firstField = Object.keys(details)[0];
      const firstMessage = details[firstField]?.[0];
      if (firstMessage) {
        if (firstField === "non_field_errors" || firstField === "detail") return firstMessage;
        const label = firstField.replace(/_/g, " ");
        return `${label.charAt(0).toUpperCase()}${label.slice(1)}: ${firstMessage}`;
      }
    }
    if (data?.error?.message) return data.error.message;
    if (error.message === "Network Error") return "Cannot reach the server. Please try again.";
  }
  return "Something went wrong. Please try again.";
}
