const DEFAULT_API_BASE_URL = 'http://localhost:8080/api';

const rawApiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).trim();

function normalizeBaseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export const API_BASE_URL = normalizeBaseUrl(rawApiBaseUrl);


