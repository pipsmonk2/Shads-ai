import { ScanResult } from "../types";

export interface AppSettings {
  audioEnabled: boolean;
  voiceEnabled: boolean;
  selectedPair: string;
  selectedTimeframe: string;
  activeTab: "home" | "news" | "history";
}

const STORAGE_KEYS = {
  SCANS: "shads_ai_scans_v2",
  LEGACY_SCANS: "shads_ai_scans",
  SETTINGS: "shads_ai_settings_v2",
};

export const defaultSettings: AppSettings = {
  audioEnabled: true,
  voiceEnabled: true,
  selectedPair: "EUR/USD",
  selectedTimeframe: "H1",
  activeTab: "home",
};

// In-memory fallback if localStorage is disabled or throws QuotaExceededError
let memoryScansFallback: ScanResult[] = [];
let memorySettingsFallback: AppSettings = { ...defaultSettings };

function isStorageAvailable(): boolean {
  if (typeof window === "undefined" || !window.localStorage) return false;
  try {
    const testKey = "__shads_storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Loads user configuration settings from persistent storage
 */
export function loadAppSettings(): AppSettings {
  if (!isStorageAvailable()) {
    return memorySettingsFallback;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...defaultSettings,
        ...parsed,
      };
    }
  } catch (err) {
    console.warn("Failed to load app settings from localStorage:", err);
  }
  return defaultSettings;
}

/**
 * Saves user settings safely to localStorage
 */
export function saveAppSettings(settings: Partial<AppSettings>): void {
  const current = loadAppSettings();
  const updated = { ...current, ...settings };
  memorySettingsFallback = updated;

  if (!isStorageAvailable()) return;

  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to save app settings to localStorage:", err);
  }
}

/**
 * Loads saved scans from persistent localStorage
 */
export function loadScansFromStorage(): ScanResult[] {
  if (!isStorageAvailable()) {
    return memoryScansFallback;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SCANS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryScansFallback = parsed;
        return parsed;
      }
    }

    // Fallback: check legacy storage
    const legacyRaw = localStorage.getItem(STORAGE_KEYS.LEGACY_SCANS);
    if (legacyRaw) {
      const legacyParsed = JSON.parse(legacyRaw);
      if (Array.isArray(legacyParsed) && legacyParsed.length > 0) {
        // Migrate to new storage key
        try {
          localStorage.setItem(STORAGE_KEYS.SCANS, JSON.stringify(legacyParsed));
        } catch (_) {}
        memoryScansFallback = legacyParsed;
        return legacyParsed;
      }
    }
  } catch (err) {
    console.warn("Failed to load scans from localStorage:", err);
  }
  return memoryScansFallback;
}

/**
 * Saves scans to persistent localStorage with automatic quota management & pruning
 */
export function saveScansToStorage(scans: ScanResult[]): void {
  memoryScansFallback = scans;
  if (!isStorageAvailable()) return;

  try {
    // Keep max 40 scans to prevent mobile localStorage exhaustion
    const trimmed = scans.slice(0, 40);
    localStorage.setItem(STORAGE_KEYS.SCANS, JSON.stringify(trimmed));
  } catch (err: any) {
    console.warn("Failed to save scans to localStorage. Attempting quota pruning...", err);
    try {
      // If quota exceeded, prune down to 15 newest scans and strip base64 screenshot if needed
      const reduced = scans.slice(0, 15).map(scan => ({
        ...scan,
        image: "" // Strip large image payload to preserve critical trade analysis data
      }));
      localStorage.setItem(STORAGE_KEYS.SCANS, JSON.stringify(reduced));
    } catch (e) {
      console.warn("Storage quota pruning failed, keeping in session memory:", e);
    }
  }
}

/**
 * Clears all saved scans from persistent localStorage
 */
export function clearScansStorage(): void {
  memoryScansFallback = [];
  if (!isStorageAvailable()) return;

  try {
    localStorage.removeItem(STORAGE_KEYS.SCANS);
    localStorage.removeItem(STORAGE_KEYS.LEGACY_SCANS);
  } catch (err) {
    console.warn("Failed to clear scans from localStorage:", err);
  }
}
