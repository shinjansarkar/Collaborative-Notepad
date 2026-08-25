const rawApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || 'http://localhost:8000';

// Normalize once so all callers build consistent URLs.
export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE_URL) {
    return normalizedPath;
  }
  return `${API_BASE_URL}${normalizedPath}`;
}

export function getSocketConfig(): { origin: string | undefined; path: string } {
  if (!API_BASE_URL) {
    return { origin: undefined, path: '/socket.io' };
  }
  try {
    const parsed = new URL(API_BASE_URL);
    const origin = parsed.origin;
    const prefix = parsed.pathname.replace(/\/+$/, '');
    const path = prefix ? `${prefix}/socket.io` : '/socket.io';
    return { origin, path };
  } catch {
    return { origin: API_BASE_URL, path: '/socket.io' };
  }
}

export const SOCKET_IO_PATH = '/socket.io';

