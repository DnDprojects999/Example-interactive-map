const COMMAND_THEME_ID = "serkonia-command";
const MAX_LINES = 18;
const HOVER_DEBOUNCE_MS = 280;
const ACTION_DEBOUNCE_MS = 420;
const INTERACTIVE_SELECTOR = "button, input, select, [role='button'], .palette-option";
const HIDDEN_SURFACE_MODES = new Set(["timeline", "archive", "homebrew", "heroes"]);

function normalizeCommandText(rawValue) {
  return String(rawValue || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b(button|input|popover|panel|toggle|label|menu|link|wrap|option)\b/gi, " ")
    .replace(/[^\p{L}\p{N}\s+.:/]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function toCommandPath(value) {
  return normalizeCommandText(value).replace(/\s+/g, ".");
}

function isMeaningfulLabel(value) {
  return Boolean(value && value.length >= 2);
}

export function createTechConsoleController(options) {
  const {
    els,
    resolveWorldName,
    formatToken,
  } = options;

  const state = {
    initialized: false,
    queue: [],
    activeJob: null,
    typingTimer: 0,
    observer: null,
    lastThemeActive: false,
    lastMode: "map",
    lastPanelOpen: false,
    lastHoverKey: "",
    lastHoverAt: 0,
    lastActionKey: "",
    lastActionAt: 0,
  };

  function isCommandThemeActive() {
    return document.body.dataset.siteTheme === COMMAND_THEME_ID;
  }

  function resolveSurfaceMode() {
    if (document.body.classList.contains("timeline-mode")) return "timeline";
    if (document.body.classList.contains("archive-mode")) return "archive";
    if (document.body.classList.contains("homebrew-mode")) return "homebrew";
    if (document.body.classList.contains("heroes-mode")) return "heroes";
    return "map";
  }

  function shouldShowConsole() {
    return isCommandThemeActive() && !HIDDEN_SURFACE_MODES.has(resolveSurfaceMode());
  }

  function syncVisibility() {
    if (!els?.techConsole) return;
    const shouldShow = shouldShowConsole();
    els.techConsole.hidden = !shouldShow;
    els.techConsole.setAttribute("aria-hidden", shouldShow ? "false" : "true");
  }

  function trimHistory() {
    const linesRoot = els?.techConsoleLines;
    if (!linesRoot) return;
    while (linesRoot.children.length > MAX_LINES) {
      linesRoot.removeChild(linesRoot.firstChild);
    }
    linesRoot.scrollTop = linesRoot.scrollHeight;
  }

  function stopTyping() {
    if (state.typingTimer) {
      window.clearTimeout(state.typingTimer);
      state.typingTimer = 0;
    }
    state.activeJob = null;
  }

  function clearHistory() {
    stopTyping();
    state.queue = [];
    els?.techConsoleLines?.replaceChildren();
  }

  function processQueue() {
    if (!els?.techConsoleLines || state.activeJob || !state.queue.length) return;

    const entry = state.queue.shift();
    const line = document.createElement("div");
    const prefix = document.createElement("span");
    const content = document.createElement("span");

    line.className = `tech-console-line tech-console-line-${entry.tone || "system"} typing`;
    prefix.className = "tech-console-prefix";
    content.className = "tech-console-content";

    prefix.textContent = entry.prefix || ">//";
    line.append(prefix, content);
    els.techConsoleLines.append(line);
    trimHistory();

    state.activeJob = {
      entry,
      line,
      content,
      index: 0,
    };

    const typeNextCharacter = () => {
      if (!state.activeJob) return;
      const job = state.activeJob;
      if (job.index >= job.entry.text.length) {
        job.line.classList.remove("typing");
        state.activeJob = null;
        trimHistory();
        processQueue();
        return;
      }

      job.content.textContent += job.entry.text.charAt(job.index);
      job.index += 1;
      els.techConsoleLines.scrollTop = els.techConsoleLines.scrollHeight;
      state.typingTimer = window.setTimeout(typeNextCharacter, job.entry.speed || 12);
    };

    typeNextCharacter();
  }

  function enqueueLine(text, options = {}) {
    if (!els?.techConsoleLines || !text) return;
    state.queue.push({
      text: String(text),
      tone: options.tone || "system",
      speed: options.speed || 12,
      prefix: options.prefix || ">//",
    });
    processQueue();
  }

  function buildBootSequence() {
    const worldName = String(resolveWorldName?.() || "unknown map").trim() || "unknown map";
    return [
      { text: `link::connect target="${worldName}"`, tone: "system", speed: 14 },
      { text: "auth::login operator=guest", tone: "system", speed: 12 },
      { text: "auth::password *****", tone: "system", speed: 10 },
      { text: "auth::status accepted", tone: "success", speed: 10 },
      { text: `surface::open ${toCommandPath(worldName) || "map"}`, tone: "success", speed: 10 },
      { text: "sys::ready", tone: "success", speed: 10 },
    ];
  }

  function runBootSequence() {
    clearHistory();
    buildBootSequence().forEach((entry) => enqueueLine(entry.text, entry));
  }

  function resolveElementLabel(element) {
    if (!element) return "";

    const fieldLabel = element.closest("label")?.querySelector("span")?.textContent
      || element.closest("label")?.textContent
      || "";

    const tokenFromId = typeof formatToken === "function" && element.id
      ? String(formatToken(element.id) || "").replace(/[.]+/g, " ")
      : "";

    const candidates = [
      element.dataset?.techLabel,
      element.getAttribute?.("aria-label"),
      element.title,
      fieldLabel,
      element.textContent,
      tokenFromId,
      element.id,
    ];

    for (const candidate of candidates) {
      const normalized = normalizeCommandText(candidate);
      if (isMeaningfulLabel(normalized)) return normalized;
    }

    return "";
  }

  function resolveActionVerb(element, label) {
    const source = `${label} ${element?.id || ""} ${element?.getAttribute?.("aria-label") || ""}`.toLowerCase();
    if (/(close|hide|disable|clear|delete|reset|return|back|collapse)/.test(source)) return "close";
    if (/(toggle|switch)/.test(source)) return "toggle";
    if (/(preview|edit|rename|upload|import|export|save|create|add|new)/.test(source)) return "exec";
    return "open";
  }

  function logHoverForElement(element) {
    if (!isCommandThemeActive()) return;
    const label = resolveElementLabel(element);
    if (!label) return;

    const commandKey = `hover:${label}`;
    const now = Date.now();
    if (state.lastHoverKey === commandKey && now - state.lastHoverAt < HOVER_DEBOUNCE_MS) return;

    state.lastHoverKey = commandKey;
    state.lastHoverAt = now;
    enqueueLine(`prep::${resolveActionVerb(element, label)} ${toCommandPath(label)}`, {
      tone: "preview",
      speed: 7,
    });
  }

  function isModeControl(element) {
    return [
      "timelineOpenButton",
      "archiveOpenButton",
      "homebrewOpenButton",
      "heroesOpenButton",
      "mapReturnButton",
      "heroesHomeButton",
    ].includes(element?.id);
  }

  function isPanelControl(element) {
    return element?.id === "panelHandle";
  }

  function logActionForElement(element) {
    if (!isCommandThemeActive() || !element || isModeControl(element) || isPanelControl(element)) return;
    const label = resolveElementLabel(element);
    if (!label) return;

    const commandKey = `action:${element.id || label}`;
    const now = Date.now();
    if (state.lastActionKey === commandKey && now - state.lastActionAt < ACTION_DEBOUNCE_MS) return;

    state.lastActionKey = commandKey;
    state.lastActionAt = now;
    enqueueLine(`exec::${resolveActionVerb(element, label)} ${toCommandPath(label)}`, {
      tone: "action",
      speed: 9,
    });
  }

  function logModeTransition(nextMode) {
    if (nextMode === state.lastMode) return;

    enqueueLine(`surface::close ${toCommandPath(state.lastMode) || "map"}`, {
      tone: "warning",
      speed: 10,
    });
    enqueueLine(`surface::open ${toCommandPath(nextMode) || "map"}`, {
      tone: "success",
      speed: 10,
    });
    state.lastMode = nextMode;
  }

  function logPanelTransition(isOpen) {
    if (isOpen === state.lastPanelOpen) return;
    enqueueLine(`panel::${isOpen ? "open" : "close"} marker-brief`, {
      tone: isOpen ? "action" : "warning",
      speed: 9,
    });
    state.lastPanelOpen = isOpen;
  }

  function handleShellMutation() {
    const themeActive = isCommandThemeActive();
    const nextMode = resolveSurfaceMode();
    const nextPanelOpen = Boolean(els?.content?.classList.contains("panel-open"));

    if (themeActive && !state.lastThemeActive) {
      runBootSequence();
    }

    state.lastThemeActive = themeActive;
    logModeTransition(nextMode);
    logPanelTransition(nextPanelOpen);
    syncVisibility();
  }

  function setupMutationObserver() {
    if (!window.MutationObserver) return;
    state.observer = new MutationObserver(() => handleShellMutation());
    state.observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "data-site-theme"],
    });
    if (els?.content) {
      state.observer.observe(els.content, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }
  }

  function handleInteractiveHover(event) {
    const interactive = event.target.closest(INTERACTIVE_SELECTOR);
    if (!interactive || interactive.closest("#techConsole")) return;
    logHoverForElement(interactive);
  }

  function handleInteractiveAction(event) {
    const interactive = event.target.closest(INTERACTIVE_SELECTOR);
    if (!interactive || interactive.closest("#techConsole")) return;
    logActionForElement(interactive);
  }

  function setup() {
    if (state.initialized) return;
    state.initialized = true;

    state.lastThemeActive = isCommandThemeActive();
    state.lastMode = resolveSurfaceMode();
    state.lastPanelOpen = Boolean(els?.content?.classList.contains("panel-open"));

    syncVisibility();
    if (state.lastThemeActive) runBootSequence();

    document.addEventListener("mouseover", handleInteractiveHover, true);
    document.addEventListener("focusin", handleInteractiveHover, true);
    document.addEventListener("click", handleInteractiveAction, true);
    setupMutationObserver();
  }

  function syncThemeState() {
    handleShellMutation();
  }

  return {
    setup,
    syncThemeState,
  };
}
