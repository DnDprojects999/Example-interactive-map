export const HINTS_ENABLED_STORAGE_KEY = "serkonia:hints:enabled";
export const HINTS_SEEN_STORAGE_KEY = "serkonia:hints:hover-seen";

export function readBooleanStorage(key, fallback = false) {
  try {
    const raw = window.localStorage?.getItem(key);
    if (raw === "true") return true;
    if (raw === "false") return false;
    return fallback;
  } catch {
    return fallback;
  }
}

export function writeBooleanStorage(key, value) {
  try {
    window.localStorage?.setItem(key, value ? "true" : "false");
  } catch {
    // Ignore storage failures.
  }
}

export function readJsonStorage(key, fallback = null) {
  try {
    const raw = window.localStorage?.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJsonStorage(key, value) {
  try {
    window.localStorage?.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures.
  }
}
