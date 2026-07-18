import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ??
  (__DEV__ ? 'http://localhost:8333' : 'https://api.harmoni.cc');

console.log('[api] BASE_URL:', BASE_URL);

const TOKEN_KEY = 'harmoni_jwt';

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  let res: Response;
  try {
    console.log('[api] →', options.method ?? 'GET', `${BASE_URL}${path}`);
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers, signal: controller.signal });
    console.log('[api] ←', res.status, `${BASE_URL}${path}`);
  } catch (err: any) {
    console.error('[api] fetch error:', err?.name, err?.message);
    throw new Error(err?.name === 'AbortError' ? 'Request timed out — is the server running?' : err?.message ?? 'Network error');
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  get:    <T>(path: string) => request<T>(path),
  post:   <T>(path: string, body: unknown) => request<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: <T>(path: string)                => request<T>(path, { method: 'DELETE' }),
};
