function createTimestampLabel(date = new Date()) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export function stringifyRuntimeValue(value) {
  if (value == null) return "";
  if (value instanceof Error) return value.stack || value.message || String(value);
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function createRuntimeSignature(entry) {
  return [entry.level, entry.source, entry.title, entry.message].map((part) => String(part || "")).join("::");
}

export function formatRuntimeEntry(entry) {
  return {
    level: entry.level || "info",
    title: String(entry.title || "Runtime event"),
    message: String(entry.message || ""),
    details: String(entry.details || ""),
    source: String(entry.source || "runtime"),
    timeLabel: entry.timeLabel || createTimestampLabel(),
    createdAt: entry.createdAt || Date.now(),
  };
}

export function createLogLevelLabel(level) {
  if (level === "error") return "ERROR";
  if (level === "warning") return "WARN";
  return "INFO";
}
