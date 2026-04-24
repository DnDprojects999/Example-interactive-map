import { DEFAULT_AUDIO_SETTINGS, normalizeAudioSettings } from "../worldInfo.js";

const USER_AUDIO_STORAGE_KEY = "serkonia:user-audio";

export function readFileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Failed to read audio file"));
    reader.readAsDataURL(file);
  });
}

export function clamp01(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(1, Math.max(0, numeric));
}

export function readUserAudioSettings() {
  try {
    const raw = window.localStorage?.getItem(USER_AUDIO_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

export function writeUserAudioSettings(value) {
  try {
    window.localStorage?.setItem(USER_AUDIO_STORAGE_KEY, JSON.stringify(value || {}));
  } catch (error) {
    // Ignore storage failures and keep audio settings in memory only.
  }
}

export function clearUserAudioSettings() {
  try {
    window.localStorage?.removeItem(USER_AUDIO_STORAGE_KEY);
  } catch (error) {
    // Ignore storage failures.
  }
}

export function mergeAudioSettings(worldDefaults, userSettings) {
  return normalizeAudioSettings({
    ...DEFAULT_AUDIO_SETTINGS,
    ...(worldDefaults || {}),
    ...(userSettings || {}),
  });
}
