import { createRuntimeSignature, formatRuntimeEntry } from "./logFormatter.js";

export function createErrorBus(options = {}) {
  const {
    limit = 120,
    dedupeWindowMs = 1400,
  } = options;

  const listeners = new Set();
  const entries = [];
  const recentSignatures = new Map();

  function emit(entry) {
    const normalized = formatRuntimeEntry(entry);
    const signature = createRuntimeSignature(normalized);
    const now = Date.now();
    const previousAt = recentSignatures.get(signature) || 0;
    if (now - previousAt < dedupeWindowMs) return null;

    recentSignatures.set(signature, now);
    entries.unshift(normalized);
    if (entries.length > limit) entries.length = limit;

    listeners.forEach((listener) => {
      try {
        listener(normalized);
      } catch {
        // Diagnostics listeners must never break the app.
      }
    });

    return normalized;
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function getEntries() {
    return [...entries];
  }

  return {
    emit,
    subscribe,
    getEntries,
  };
}
