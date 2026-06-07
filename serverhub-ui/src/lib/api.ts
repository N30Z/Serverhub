import { useStore } from '../store/useStore';

class ApiError extends Error {}

async function authedFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = useStore.getState().authToken;
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(text || `Request failed (${res.status})`);
  }
  return res;
}

export type ServiceAction = 'start' | 'stop' | 'restart';
export type DockerAction = 'start' | 'stop' | 'restart' | 'remove';

export async function serviceAction(name: string, action: ServiceAction): Promise<void> {
  await authedFetch('/api/services/action', {
    method: 'POST',
    body: JSON.stringify({ name, action }),
  });
}

export async function dockerAction(id: string, action: DockerAction): Promise<void> {
  await authedFetch('/api/docker/action', {
    method: 'POST',
    body: JSON.stringify({ id, action }),
  });
}

export { ApiError };
