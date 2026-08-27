/// <reference types="vite/client" />

/**
 * Global API URL and configuration utility for Shads AI
 * Automatically routes API requests to the live backend on Vercel:
 * https://shads-ai-wheat.vercel.app
 * Supports runtime and build-time configuration via VITE_API_BASE_URL.
 */

export const DEFAULT_API_BASE_URL = "https://shads-ai-wheat.vercel.app";

/**
 * Returns the base API URL for all backend requests.
 */
export function getApiBaseUrl(): string {
  // 1. Check if an explicit environment variable is set at build/run time
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (typeof envUrl === "string" && envUrl.trim() !== "") {
    return envUrl.trim().replace(/\/+$/, "");
  }

  // 2. Default to the live Vercel backend
  return DEFAULT_API_BASE_URL;
}

/**
 * Resolves a full API endpoint URL from a relative path.
 * Example: getApiUrl("/api/scan") -> "https://shads-ai-wheat.vercel.app/api/scan"
 */
export function getApiUrl(endpoint: string): string {
  const base = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  if (!base) {
    return cleanEndpoint;
  }

  return `${base}${cleanEndpoint}`;
}

