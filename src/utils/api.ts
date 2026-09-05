/// <reference types="vite/client" />

import { Capacitor } from "@capacitor/core";

/**
 * Global API URL and configuration utility for Shads AI
 * Automatically routes API requests to the appropriate backend:
 * - When in browser/cloud preview: uses relative path ("/api/...")
 * - When in Capacitor native container: uses configured URL or custom user URL
 */

const STORAGE_CUSTOM_API_KEY = "shads_ai_custom_api_base_url";

export function getCustomApiBaseUrl(): string {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const stored = localStorage.getItem(STORAGE_CUSTOM_API_KEY);
      if (stored && stored.trim()) {
        return stored.trim().replace(/\/+$/, "");
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }
  return "";
}

export function setCustomApiBaseUrl(url: string): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      if (!url || !url.trim()) {
        localStorage.removeItem(STORAGE_CUSTOM_API_KEY);
      } else {
        localStorage.setItem(STORAGE_CUSTOM_API_KEY, url.trim().replace(/\/+$/, ""));
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }
}

/**
 * Returns the base API URL for all backend requests.
 */
export function getApiBaseUrl(): string {
  // 1. Check if user set a custom API URL in Settings
  const custom = getCustomApiBaseUrl();
  if (custom) {
    return custom;
  }

  // 2. Check if an explicit environment variable is set at build/run time
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (typeof envUrl === "string" && envUrl.trim() !== "") {
    return envUrl.trim().replace(/\/+$/, "");
  }

  // 3. If running inside web browser / cloud preview / iframe, use relative endpoints
  if (typeof window !== "undefined") {
    const isCapacitorNative = Capacitor.isNativePlatform() || 
      window.location.protocol === "capacitor:" || 
      window.location.protocol === "ionic:" || 
      window.location.protocol === "file:";

    if (!isCapacitorNative) {
      return "";
    }
  }

  return "";
}

/**
 * Resolves a full API endpoint URL from a relative path.
 * Example: getApiUrl("/api/scan") -> "/api/scan"
 */
export function getApiUrl(endpoint: string): string {
  const base = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  if (!base) {
    return cleanEndpoint;
  }

  return `${base}${cleanEndpoint}`;
}


