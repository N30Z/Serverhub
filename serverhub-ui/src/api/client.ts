import { useStore } from '../store/useStore';

export async function apiRequest<T = void>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = useStore.getState().authToken;
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || res.statusText);
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function apiRequestRaw(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = useStore.getState().authToken;
  return fetch(path, {
    ...init,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers as Record<string, string> | undefined),
    },
  });
}
