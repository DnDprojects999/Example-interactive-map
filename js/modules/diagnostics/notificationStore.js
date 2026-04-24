import { createRuntimeSignature, formatRuntimeEntry } from "./logFormatter.js";

export function createNotificationStore(limit = 80, dedupeWindowMs = 1400) {
  let notifications = [];
  const recentSignatures = new Map();

  function add(entry) {
    const normalized = formatRuntimeEntry(entry);
    const signature = createRuntimeSignature(normalized);
    const now = Date.now();
    const previousAt = recentSignatures.get(signature) || 0;
    if (now - previousAt < dedupeWindowMs) return null;

    recentSignatures.set(signature, now);
    const notification = {
      ...normalized,
      id: normalized.id || `note-${normalized.createdAt}-${Math.random().toString(36).slice(2, 7)}`,
    };
    notifications = [notification, ...notifications].slice(0, limit);
    return notification;
  }

  function getAll() {
    return [...notifications];
  }

  return {
    add,
    getAll,
  };
}
