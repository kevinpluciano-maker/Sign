// Fetch helper with JWT + error handling for admin calls.
import { BACKEND_URL } from '@/config/api';

const TOKEN_KEY = 'auth_token';

export const getAuthToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setAuthToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearAuthToken = () => localStorage.removeItem(TOKEN_KEY);

interface ApiOptions extends RequestInit {
  auth?: boolean;
  json?: unknown;
}

export async function apiFetch<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  const { auth, json, headers, ...rest } = options;
  const url = path.startsWith('http') ? path : `${BACKEND_URL}${path}`;

  const h = new Headers(headers);
  if (json !== undefined) h.set('Content-Type', 'application/json');
  if (auth) {
    const token = getAuthToken();
    if (token) h.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...rest,
    headers: h,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  if (!res.ok) {
    let detail: string;
    try {
      const data = await res.json();
      detail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
    } catch {
      detail = res.statusText;
    }
    // Auto-logout on 401
    if (res.status === 401) clearAuthToken();
    throw new Error(detail || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
