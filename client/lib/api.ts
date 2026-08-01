const rawApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim() ?? '';

// Normalize once so all callers build consistent URLs.
export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE_URL) {
    return normalizedPath;
  }
  return `${API_BASE_URL}${normalizedPath}`;
}

export const SOCKET_IO_PATH = '/socket.io';
