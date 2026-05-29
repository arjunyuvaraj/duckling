import { authHeader } from './user';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...authHeader(),
    ...(init.headers ?? {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });
  const data = (await response.json().catch(() => ({}))) as T & { detail?: string; message?: string };

  if (!response.ok) {
    throw new Error(data.detail ?? data.message ?? `Request failed: ${response.status}`);
  }

  return data;
}
