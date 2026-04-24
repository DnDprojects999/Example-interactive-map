import { createRuntimeSignature, formatRuntimeEntry } from "./logFormatter.js";

export function installRuntimeReporter(options) {
  const {
    onEntry,
    translateTitle,
    formatArgument,
    formatDetails,
  } = options;

  let installed = false;
  let guard = 0;
  const recentSignatures = new Map();

  function emit(entry) {
    if (guard > 0) return;
    guard += 1;
    try {
      const normalized = formatRuntimeEntry(entry);
      const signature = createRuntimeSignature(normalized);
      const now = Date.now();
      const previousAt = recentSignatures.get(signature) || 0;
      if (now - previousAt < 1400) return;
      recentSignatures.set(signature, now);
      onEntry?.(normalized);
    } finally {
      guard -= 1;
    }
  }

  return function start() {
    if (installed) return;
    installed = true;

    const originalWarn = console.warn.bind(console);
    const originalError = console.error.bind(console);

    console.warn = (...args) => {
      originalWarn(...args);
      emit({
        level: "warning",
        title: translateTitle("warning"),
        message: args.map(formatArgument).filter(Boolean).join(" ").trim() || "Warning without message",
        details: args.map(formatDetails).filter(Boolean).join("\n\n"),
        source: "console.warn",
      });
    };

    console.error = (...args) => {
      originalError(...args);
      emit({
        level: "error",
        title: translateTitle("error"),
        message: args.map(formatArgument).filter(Boolean).join(" ").trim() || "Error without message",
        details: args.map(formatDetails).filter(Boolean).join("\n\n"),
        source: "console.error",
      });
    };

    window.addEventListener("error", (event) => {
      emit({
        level: "error",
        title: event.message || translateTitle("window"),
        message: [event.filename, event.lineno, event.colno].filter(Boolean).join(": ") || "Unhandled window error",
        details: formatDetails(event.error || event.message),
        source: "window.error",
      });
    });

    window.addEventListener("unhandledrejection", (event) => {
      emit({
        level: "error",
        title: translateTitle("promise"),
        message: formatArgument(event.reason) || "Unhandled promise rejection",
        details: formatDetails(event.reason),
        source: "window.unhandledrejection",
      });
    });
  };
}
