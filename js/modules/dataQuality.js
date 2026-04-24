import { runAudit } from "./quality/runAudit.js";
import { formatIssue } from "./quality/formatIssue.js";
import { fixMojibake } from "./quality/utils.js";
import { createErrorBus } from "./diagnostics/errorBus.js";
import { createNotificationStore } from "./diagnostics/notificationStore.js";
import { createLogLevelLabel } from "./diagnostics/logFormatter.js";

const INFO_VIEWS = new Set(["audit", "logs", "notifications", "hints"]);

function renderAuditFilters(els, scopes, activeScope, selectScope, getUiText = null) {
  const t = (key, params = {}) => (typeof getUiText === "function" ? getUiText(key, params) : key);
  els.dataQualityFilters.innerHTML = "";
  els.dataQualityFilters.hidden = false;

  const makeButton = (label, value) => {
    const button = document.createElement("button");
    button.className = "data-quality-filter";
    button.type = "button";
    button.textContent = label;
    button.classList.toggle("is-active", value === activeScope);
    button.addEventListener("click", () => selectScope(value));
    els.dataQualityFilters.appendChild(button);
  };

  makeButton(t("audit_filter_all"), "all");
  scopes.forEach((scope) => {
    const fixedScope = fixMojibake(scope.value);
    makeButton(scope.label || fixedScope, fixedScope);
  });
}

function renderIssuesList(els, issues, onNavigate, close, getUiText = null, state = null) {
  els.dataQualityList.innerHTML = "";
  const t = (key, params = {}) => (typeof getUiText === "function" ? getUiText(key, params) : key);

  if (!issues.length) {
    const empty = document.createElement("div");
    empty.className = "data-quality-empty";
    empty.textContent = t("audit_empty_text");
    els.dataQualityList.appendChild(empty);
    return;
  }

  issues.forEach((issue) => {
    const formatted = formatIssue(issue, state, getUiText);
    const button = document.createElement("button");
    button.className = "data-quality-item";
    button.type = "button";

    const scope = document.createElement("span");
    scope.textContent = formatted.scopeLabel;

    const title = document.createElement("strong");
    title.textContent = formatted.title;

    const message = document.createElement("em");
    message.textContent = formatted.targetLabel;

    button.append(scope, title, message);
    button.addEventListener("click", () => {
      close();
      if (issue.target) onNavigate(issue.target);
    });
    els.dataQualityList.appendChild(button);
  });
}

function renderRuntimeList(els, entries, emptyText) {
  els.dataQualityList.innerHTML = "";

  if (!entries.length) {
    const empty = document.createElement("div");
    empty.className = "data-quality-empty";
    empty.textContent = emptyText;
    els.dataQualityList.appendChild(empty);
    return;
  }

  entries.forEach((entry) => {
    const article = document.createElement("article");
    article.className = `data-quality-log data-quality-log-${entry.level}`;

    const meta = document.createElement("div");
    meta.className = "data-quality-log-meta";

    const level = document.createElement("span");
    level.className = "data-quality-log-level";
    level.textContent = createLogLevelLabel(entry.level);

    const source = document.createElement("span");
    source.className = "data-quality-log-source";
    source.textContent = entry.source || "runtime";

    const time = document.createElement("span");
    time.className = "data-quality-log-time";
    time.textContent = entry.timeLabel;

    meta.append(level, source, time);

    const title = document.createElement("strong");
    title.className = "data-quality-log-title";
    title.textContent = entry.title;

    const message = document.createElement("p");
    message.className = "data-quality-log-message";
    message.textContent = entry.message;

    article.append(meta, title, message);

    if (entry.details) {
      const details = document.createElement("pre");
      details.className = "data-quality-log-details";
      details.textContent = entry.details;
      article.appendChild(details);
    }

    els.dataQualityList.appendChild(article);
  });
}

function resetFilters(els) {
  els.dataQualityFilters.hidden = true;
  els.dataQualityFilters.innerHTML = "";
}

function applyPanelHeading(els, kicker, title, summary) {
  els.dataQualityKicker.textContent = kicker;
  els.dataQualityTitle.textContent = title;
  els.dataQualitySummary.textContent = summary;
}

function renderHintsView(els, getUiText = null, hintsEnabled = false, state = null) {
  const t = (key, params = {}) => (typeof getUiText === "function" ? getUiText(key, params) : key);
  els.dataQualityList.innerHTML = "";

  const card = document.createElement("section");
  card.className = "data-quality-hints-card";

  const title = document.createElement("strong");
  title.className = "data-quality-hints-title";
  title.textContent = t("info_hints_title");

  const text = document.createElement("p");
  text.className = "data-quality-hints-text";
  text.textContent = t("info_hints_empty");

  const button = document.createElement("button");
  button.className = "data-quality-hints-action";
  button.type = "button";
  button.textContent = t(hintsEnabled ? "info_hints_toggle_disable" : "info_hints_toggle_enable");
  button.dataset.hintsToggle = "true";

  const resetButton = document.createElement("button");
  resetButton.className = "data-quality-hints-action";
  resetButton.type = "button";
  resetButton.textContent = t("info_hints_reset");
  resetButton.dataset.hintsReset = "true";

  card.append(title, text, button, resetButton);
  els.dataQualityList.appendChild(card);
}

export function createDataQualityController(options) {
  const {
    els,
    state,
    getUiText,
    onNavigate,
    onHintsEnabledChange,
    onResetHints,
    initialHintsEnabled = true,
  } = options;

  const errorBus = createErrorBus();
  const notificationStore = createNotificationStore();

  let activeView = "audit";
  let auditFilter = "all";
  let panelHideTimer = null;
  let hintsEnabled = Boolean(initialHintsEnabled);

  function t(key, params = {}) {
    return typeof getUiText === "function" ? getUiText(key, params) : key;
  }

  function syncHintsButtons() {
    if (els.toggleEditorHintsButton) {
      els.toggleEditorHintsButton.textContent = t(hintsEnabled ? "info_hints_on" : "info_hints_off");
    }
    if (els.dataQualityHintsToggleButton) {
      els.dataQualityHintsToggleButton.textContent = t(
        hintsEnabled ? "info_hints_toggle_disable" : "info_hints_toggle_enable",
      );
    }
    state.editorHintsEnabled = hintsEnabled;
  }

  function showToast(notification) {
    if (!els.runtimeToastStack) return;
    els.runtimeToastStack.hidden = false;
    const toast = document.createElement("button");
    toast.className = `runtime-toast runtime-toast-${notification.level}`;
    toast.type = "button";

    const title = document.createElement("strong");
    title.textContent = notification.title;
    const text = document.createElement("span");
    text.textContent = notification.message;
    const action = document.createElement("em");
    action.textContent = t("info_open_diagnostics");

    toast.append(title, text, action);
    toast.addEventListener("click", () => {
      open("notifications");
      toast.remove();
      if (!els.runtimeToastStack.children.length) els.runtimeToastStack.hidden = true;
    });

    els.runtimeToastStack.appendChild(toast);
    window.setTimeout(() => toast.classList.add("is-visible"), 20);
    window.setTimeout(() => {
      toast.classList.remove("is-visible");
      window.setTimeout(() => {
        toast.remove();
        if (!els.runtimeToastStack.children.length) els.runtimeToastStack.hidden = true;
      }, 220);
    }, 5200);
  }

  function addNotification(entry, options = {}) {
    const notification = notificationStore.add(entry);
    if (!notification) return null;
    if (options.toast !== false) showToast(notification);
    if (activeView === "notifications" && !els.dataQualityPanel.hidden) render();
    return notification;
  }

  errorBus.subscribe((entry) => {
    addNotification(
      {
        level: entry.level,
        title: entry.title,
        message: entry.message || entry.source,
        source: entry.source,
        details: entry.details,
      },
      { toast: entry.level !== "info" },
    );
    if (activeView === "logs" && !els.dataQualityPanel.hidden) render();
  });

  function getAuditIssues() {
    const issues = runAudit(state);
    if (auditFilter === "all") return issues;
    return issues.filter((issue) => fixMojibake(issue.scope) === auditFilter);
  }

  function renderAuditView() {
    const allIssues = runAudit(state);
    const scopes = [...new Set(allIssues.map((issue) => fixMojibake(issue.scope)).filter(Boolean))]
      .map((scope) => ({
        value: scope,
        label: formatIssue({ scope, code: "", message: "" }, state, getUiText).scopeLabel,
      }));
    renderAuditFilters(els, scopes, auditFilter, (nextScope) => {
      auditFilter = nextScope;
      render();
    }, getUiText);

    applyPanelHeading(
      els,
      t("info_center_kicker"),
      t("audit_title"),
      allIssues.length ? t("audit_summary", { count: allIssues.length }) : t("audit_empty_text"),
    );
    renderIssuesList(els, getAuditIssues(), onNavigate, close, getUiText, state);
  }

  function renderLogsView() {
    resetFilters(els);
    applyPanelHeading(els, t("info_center_kicker"), t("info_logs_title"), t("info_logs_summary"));
    renderRuntimeList(els, errorBus.getEntries(), t("info_logs_empty"));
  }

  function renderNotificationsView() {
    resetFilters(els);
    applyPanelHeading(
      els,
      t("info_center_kicker"),
      t("info_notifications_title"),
      t("info_notifications_summary"),
    );
    renderRuntimeList(els, notificationStore.getAll(), t("info_notifications_empty"));
  }

  function renderHintsTab() {
    resetFilters(els);
    applyPanelHeading(els, t("info_center_kicker"), t("info_hints_title"), t("info_hints_summary"));
    renderHintsView(els, getUiText, hintsEnabled, state);
  }

  function render() {
    const tabs = els.dataQualityTabs?.querySelectorAll?.("[data-info-view]") || [];
    tabs.forEach((button) => button.classList.toggle("is-active", button.dataset.infoView === activeView));
    syncHintsButtons();

    if (activeView === "audit") return renderAuditView();
    if (activeView === "logs") return renderLogsView();
    if (activeView === "notifications") return renderNotificationsView();
    return renderHintsTab();
  }

  function close() {
    els.dataQualityPanel.classList.remove("is-open");
    window.clearTimeout(panelHideTimer);
    panelHideTimer = window.setTimeout(() => {
      els.dataQualityPanel.hidden = true;
    }, 220);
  }

  function open(view = "audit") {
    activeView = INFO_VIEWS.has(view) ? view : "audit";
    els.dataQualityPanel.hidden = false;
    window.clearTimeout(panelHideTimer);
    render();
    requestAnimationFrame(() => {
      els.dataQualityPanel.classList.add("is-open");
    });
  }

  function toggleHints() {
    hintsEnabled = !hintsEnabled;
    syncHintsButtons();
    onHintsEnabledChange?.(hintsEnabled);
    if (!els.dataQualityPanel.hidden && activeView === "hints") render();
  }

  function setHintsEnabled(nextValue) {
    hintsEnabled = Boolean(nextValue);
    syncHintsButtons();
    if (!els.dataQualityPanel.hidden && activeView === "hints") render();
  }

  function reportRuntimeEvent(entry) {
    return errorBus.emit(entry);
  }

  function setup() {
    els.validateDataButton.addEventListener("click", () => open("audit"));
    els.openRuntimeLogsButton?.addEventListener("click", () => open("logs"));
    els.openRuntimeNotificationsButton?.addEventListener("click", () => open("notifications"));
    els.toggleEditorHintsButton?.addEventListener("click", toggleHints);
    els.dataQualityHintsToggleButton?.addEventListener("click", toggleHints);
    els.dataQualityCloseButton.addEventListener("click", close);
    els.dataQualityPanel.addEventListener("click", (event) => {
      if (event.target === els.dataQualityPanel) close();
    });
    els.dataQualityTabs?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-info-view]");
      if (!button) return;
      open(button.dataset.infoView || "audit");
    });
    els.dataQualityList.addEventListener("click", (event) => {
      const toggleButton = event.target.closest("[data-hints-toggle='true']");
      if (toggleButton) {
        toggleHints();
        return;
      }
      const resetButton = event.target.closest("[data-hints-reset='true']");
      if (resetButton) {
        onResetHints?.();
        render();
      }
    });
    syncHintsButtons();
  }

  return {
    close,
    open,
    setup,
    refresh: render,
    reportRuntimeEvent,
    setHintsEnabled,
  };
}
