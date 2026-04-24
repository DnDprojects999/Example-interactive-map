import { getElements } from "./modules/dom.js";
import { state } from "./modules/state.js";
import { loadData } from "./modules/data.js";
import { createUI } from "./modules/ui.js";
import { createMapModule } from "./modules/map.js";
import { createEditorModule } from "./modules/editor.js";
import { applyChanges, createChangesManager, validateChangesPayload } from "./modules/changes.js";
import { setupTimelineScrollControls } from "./modules/timelineScroll.js";
import { createCompactTopbarMenusController } from "./modules/app/compactTopbarMenus.js";
import { createLanguageSwitcherController } from "./modules/app/languageSwitcher.js";
import { createLoadingScreenAdminController } from "./modules/app/loadingScreenAdminController.js";
import { createMapViewAdminController } from "./modules/app/mapViewAdminController.js";
import { createTechConsoleController } from "./modules/app/techConsoleController.js";
import { createAudioManager } from "./modules/audio/audioManager.js";
import { createHomebrewController } from "./modules/homebrew/homebrewController.js";
import { applySiteTheme, BUILTIN_SITE_THEMES, DEFAULT_SITE_THEME_ID, getSiteThemeLabel } from "./modules/siteThemes.js";
import {
  DEFAULT_SECTION_VISIBILITY,
  DEFAULT_WORLD_INFO,
  normalizeSectionVisibility,
  renameWorldInfo,
  resolveWorldInfoForLanguage,
} from "./modules/worldInfo.js";
import {
  getLanguageLabel,
  getLanguages,
  normalizeLanguageCode,
  removeLanguageFromWorld,
  resolveLanguage,
} from "./modules/localization.js";
import { applyUiLocale, getLoadingFlavorLines, getUiText } from "./modules/uiLocale.js";

const MIN_LOADING_SCREEN_MS = 2400;
const LOADING_MESSAGE_ROTATE_MS = 1350;
const USER_LANGUAGE_STORAGE_KEY = "serkonia:user-language";
const DEFAULT_FAVICON_URL = "assets/favicon.svg";
const OPTIONAL_SECTION_BUTTONS = Object.freeze({
  timeline: "timelineOpenButton",
  archive: "archiveOpenButton",
  homebrew: "homebrewOpenButton",
  heroes: "heroesOpenButton",
});

// Build the rotating loading-screen lines from world settings first and
// fall back to UI locale defaults when the project does not provide custom copy.
function buildLoadingFlavorLines(worldInfo) {
  const customLines = Array.isArray(worldInfo?.loadingFlavorLines)
    ? worldInfo.loadingFlavorLines.map((entry) => String(entry || "").trim()).filter(Boolean)
    : [];
  return customLines.length ? customLines : getLoadingFlavorLines(state, worldInfo?.name || DEFAULT_WORLD_INFO.name);
}

function applyWorldBranding(els, worldInfo, currentLanguage = worldInfo.defaultLanguage) {
  const localizedWorldInfo = resolveWorldInfoForLanguage(worldInfo, currentLanguage);
  state.currentSiteTheme = localizedWorldInfo.siteThemeId || DEFAULT_SITE_THEME_ID;
  applySiteTheme(document.body, localizedWorldInfo);
  document.title = localizedWorldInfo.appTitle;
  applyFavicon(localizedWorldInfo.faviconUrl || worldInfo?.faviconUrl || DEFAULT_FAVICON_URL);
  document.documentElement.lang = resolveLanguage(worldInfo, currentLanguage);
  els.brandMain.textContent = localizedWorldInfo.name;
  els.loadingKicker.textContent = localizedWorldInfo.loadingKicker;
  els.loadingTitle.textContent = localizedWorldInfo.loadingTitle;
  els.loadingSigil.textContent = localizedWorldInfo.initial;
  els.heroesKicker.textContent = localizedWorldInfo.heroesKicker;
  els.heroesTitle.textContent = localizedWorldInfo.heroesTitle;
  els.heroesIntro.textContent = localizedWorldInfo.heroesIntro;
  els.globalSearchLabel.textContent = localizedWorldInfo.searchLabel;
  els.globalSearchButton.title = localizedWorldInfo.searchButtonTitle;

  if (!state.currentMarker) {
    els.panelTitle.textContent = localizedWorldInfo.panelTitle;
  }
}

function applyFavicon(source) {
  const href = String(source || "").trim() || DEFAULT_FAVICON_URL;
  let link = document.querySelector('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = href;
  link.type = href.startsWith("data:image/")
    ? (href.slice(5, href.indexOf(";")) || "image/png")
    : "image/svg+xml";
}

// The loading experience is intentionally isolated from the rest of startup.
// That keeps the boot sequence readable and gives us one place to control
// minimum display time, rotating flavor text, preview, and failure state.
function createLoadingExperience(els) {
  const startedAt = Date.now();
  let rotationTimer = null;
  let activeLine = "";
  let worldInfo = { ...DEFAULT_WORLD_INFO, initial: "S" };
  let flavorLines = buildLoadingFlavorLines(worldInfo);

  const stopRotation = () => {
    if (rotationTimer) {
      window.clearInterval(rotationTimer);
      rotationTimer = null;
    }
  };

  const startRotation = () => {
    stopRotation();
    pickNextLine();
    rotationTimer = window.setInterval(pickNextLine, LOADING_MESSAGE_ROTATE_MS);
  };

  const pickNextLine = () => {
    const available = flavorLines.filter((line) => line !== activeLine);
    const pool = available.length ? available : flavorLines;
    activeLine = pool[Math.floor(Math.random() * pool.length)];
    els.loadingSubtitle.textContent = activeLine;
  };

  startRotation();

  return {
    setWorldInfo(nextWorldInfo) {
      worldInfo = resolveWorldInfoForLanguage(nextWorldInfo || worldInfo, state.currentLanguage);
      flavorLines = buildLoadingFlavorLines(worldInfo);
      els.loadingKicker.textContent = worldInfo.loadingKicker;
      els.loadingTitle.textContent = worldInfo.loadingTitle;
      els.loadingSigil.textContent = worldInfo.initial;
      els.loadingNote.textContent = worldInfo.loadingPrepareNote;
      pickNextLine();
    },
    async finish({ failed = false } = {}) {
      const elapsed = Date.now() - startedAt;
      const waitMs = Math.max(0, MIN_LOADING_SCREEN_MS - elapsed);

      if (failed) {
        els.loadingKicker.textContent = worldInfo.loadingKicker;
        els.loadingTitle.textContent = worldInfo.loadingFailureTitle;
        els.loadingSubtitle.textContent = worldInfo.loadingFailSubtitle;
        els.loadingNote.textContent = worldInfo.loadingFailNote;
      } else {
        els.loadingNote.textContent = worldInfo.loadingReadyNote;
      }

      stopRotation();

      await new Promise((resolve) => window.setTimeout(resolve, waitMs));
      window.setTimeout(() => document.body.classList.add("app-loaded"), 140);
    },
    async preview(durationMs = MIN_LOADING_SCREEN_MS) {
      this.setWorldInfo(state.worldData);
      els.loadingNote.textContent = worldInfo.loadingPrepareNote;
      document.body.classList.remove("app-loaded");
      startRotation();
      await new Promise((resolve) => window.setTimeout(resolve, durationMs));
      stopRotation();
      document.body.classList.add("app-loaded");
    },
  };
}

function assertModuleApi(moduleName, moduleObject, methods) {
  methods.forEach((methodName) => {
    if (typeof moduleObject?.[methodName] !== "function") {
      throw new Error(`${moduleName} init error: missing method "${methodName}".`);
    }
  });
}

// If anything fails during boot, we still want a readable UI instead of an
// endless loading screen. This handler switches the app into a recoverable
// "show the error in the side panel" state.
async function handleFatalStartupError(error) {
  window.__serkoniaBootError = error;
  console.error("Fatal startup error:", error);

  if (els) {
    try {
      els.panelTitle.textContent = getUiText(state, "error_title");
      els.panelSubtitle.textContent = getUiText(state, "error_subtitle");
      const details = String(error?.message || "").trim();
      els.panelText.textContent = details
        ? `${getUiText(state, "error_text")}\n\n${details}`
        : getUiText(state, "error_text");
      els.fact1.textContent = getUiText(state, "error_fact_1");
      els.fact2.textContent = getUiText(state, "error_fact_2");
      els.fact3.textContent = getUiText(state, "error_fact_3");
      if (ui?.togglePanel) ui.togglePanel(true);
    } catch (panelError) {
      console.error("Failed to render fatal startup state:", panelError);
    }
  }

  if (loadingExperience?.finish) {
    try {
      await loadingExperience.finish({ failed: true });
      return;
    } catch (loadingError) {
      console.error("Failed to finish loading screen after startup error:", loadingError);
    }
  }

  document.body.classList.add("app-loaded");
}

function pruneLanguageTranslation(entity, languageCode) {
  if (!entity || typeof entity !== "object" || !entity.translations || typeof entity.translations !== "object") {
    return false;
  }

  if (!(languageCode in entity.translations)) return false;
  delete entity.translations[languageCode];
  if (!Object.keys(entity.translations).length) delete entity.translations;
  return true;
}

function cloneValue(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

// Lightweight client-side ids are enough here because entities are stored
// locally and merged through changes.json, not by a central backend.
function generateEntityId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

let els;
let ui;
let mapModule;
let changesManager;
let editor;
let loadingExperience;
let languageSwitcher;
let compactTopbarMenus;
let mapViewAdmin;
let loadingScreenAdmin;
let audioManager;
let homebrewController;
let techConsoleController;
let panelEditableFields = [];

// The shell wires together every major module once the base DOM and base data
// exist. Most later features receive their dependencies from here instead of
// importing each other directly.
function initializeAppShell() {
  els = getElements();
  applyUiLocale(els, state);
  applyWorldBranding(els, state.worldData, state.currentLanguage);
  renderSiteThemePicker();
  setTopbarTechReadout(null);

  techConsoleController = createTechConsoleController({
    els,
    state,
    resolveWorldName: () => resolveWorldInfoForLanguage(state.worldData, state.currentLanguage)?.name || DEFAULT_WORLD_INFO.name,
    formatToken: formatTopbarReadoutToken,
  });
  ui = createUI(els, state);
  mapModule = createMapModule(els, state, ui);
  changesManager = createChangesManager();
  editor = createEditorModule(els, state, ui, mapModule, changesManager);
  loadingExperience = createLoadingExperience(els);
  languageSwitcher = createLanguageSwitcherController({
    els,
    state,
    persistCurrentLanguage,
    syncLocalizedUi,
    persistWorldInfo,
    removeLanguageLayer,
  });
  mapViewAdmin = createMapViewAdminController({
    els,
    state,
    persistWorldInfo,
    rerenderMapDisplay: (mode) => ui.setMapDisplayMode(mode, { rerenderArchive: true }),
  });
  loadingScreenAdmin = createLoadingScreenAdminController({
    els,
    state,
    persistWorldInfo,
    previewLoadingScreen: () => loadingExperience.preview(),
  });
  loadingScreenAdmin.setup?.();
  audioManager = createAudioManager({
    els,
    state,
    persistWorldInfo,
  });
  homebrewController = createHomebrewController({
    els,
    state,
    generateEntityId,
    getChangeRecorder: () => changesManager,
    openMapMode: () => ui.openMapMode(),
    onLanguageChange: (languageCode) => {
      state.currentLanguage = languageCode;
      syncLocalizedUi();
    },
  });
  compactTopbarMenus = createCompactTopbarMenusController({ els, state });
  assertModuleApi("ui", ui, [
    "setSidebarRenderers",
    "setHomebrewController",
    "setupMapEditorCallbacks",
    "setChangeRecorder",
    "setPalette",
    "togglePalettePopover",
    "toggleSidebarLegend",
    "closeSidebarLegend",
    "setTopbarSync",
    "setPanelEditable",
    "setModeWord",
    "refreshEditorActionButtons",
    "togglePanel",
    "renderTimeline",
    "openTimelineMode",
    "openArchiveMode",
    "openHomebrewMode",
    "openMapMode",
    "openHeroesMode",
    "openMapTextToolbar",
    "closeMapTextToolbar",
    "setMapEditorControlsVisible",
    "savePanelToCurrentMarker",
    "updatePanelFromMarker",
    "updatePanelFromTimelineEvent",
    "renderHomebrew",
    "renderHeroes",
    "refreshTopbarActionButtons",
    "rerenderCurrentMode",
  ]);
  assertModuleApi("mapModule", mapModule, ["applyMapTransform", "setupMapNavigation", "getMapPercentFromClient"]);
  assertModuleApi("editor", editor, [
    "renderGroups",
    "renderMarkers",
    "renderRegionLabels",
    "renderDrawLayers",
    "setupEditorInteractions",
    "deleteCurrentMarker",
  ]);

  ui.setSidebarRenderers({
    mapButtonsRenderer: editor.renderGroups,
    mapMarkersRenderer: editor.renderMarkers,
  });
  ui.setHomebrewController(homebrewController);
  ui.setChangeRecorder({
    upsert: (entity, id, value, extra) => changesManager.upsert(entity, id, value, extra),
    remove: (entity, id, extra) => changesManager.remove(entity, id, extra),
  });

  panelEditableFields = [
    els.panelTitle,
    els.panelSubtitle,
    els.panelImageCaption,
    els.panelText,
    els.fact1,
    els.fact2,
    els.fact3,
  ];
}

function persistCurrentLanguage(languageCode) {
  try {
    window.localStorage?.setItem(USER_LANGUAGE_STORAGE_KEY, String(languageCode || ""));
  } catch (error) {
    // Ignore storage failures and keep the language only in memory.
  }
}

function readPersistedLanguage() {
  try {
    return String(window.localStorage?.getItem(USER_LANGUAGE_STORAGE_KEY) || "").trim();
  } catch (error) {
    return "";
  }
}

// Keep the language menu consistent with map-view visibility and the compact
// topbar menus. This is the main bridge between world settings and the header.
function syncMapViewEditorButtons() {
  mapViewAdmin?.syncButtons();
  if (els.toggleLanguageVisibilityButton) {
    els.toggleLanguageVisibilityButton.hidden = true;
    els.toggleLanguageVisibilityButton.style.display = "none";
  }
  compactTopbarMenus?.sync();
  return;

  if (!els?.toggleMapViewSwitcherButton || !els?.editMapViewsButton) return;

  const visibleForUsers = state.worldData?.mapViewSwitcherVisible !== false;
  els.toggleMapViewSwitcherButton.textContent = visibleForUsers
    ? "Скрыть у игроков"
    : "Показать игрокам";
  els.editMapViewsButton.textContent = "Режимы карты";
  if (els.mapViewEditorTools) {
    els.mapViewEditorTools.hidden = !state.editMode;
  }
  if (els.toggleLanguageVisibilityButton) {
    els.toggleLanguageVisibilityButton.hidden = true;
    els.toggleLanguageVisibilityButton.style.display = "none";
  }
  compactTopbarMenus?.sync();
}

// World-level settings are stored as one logical entity in changes.json.
// Any rename, loading-screen edit, language change, or map-view tweak ends up here.
function persistWorldInfo() {
  changesManager.upsert("worldInfo", "world", state.worldData);
  syncLocalizedUi();
  syncMapViewEditorButtons();
}

function getSectionVisibility() {
  return normalizeSectionVisibility(state.worldData?.sectionVisibility);
}

function getCurrentSectionKey() {
  if (state.timelineMode) return "timeline";
  if (state.archiveMode) return "archive";
  if (state.homebrewMode) return "homebrew";
  if (state.heroesMode) return "heroes";
  return "";
}

function isSectionVisibleForCurrentAudience(sectionKey) {
  if (state.editMode) return true;
  return getSectionVisibility()[sectionKey] !== false;
}

function setSectionVisibilityPanelOpen(open) {
  if (!els.sectionVisibilityPanel || !els.sectionVisibilityToggleButton) return;
  const expanded = Boolean(open && state.editMode);
  els.sectionVisibilityPanel.hidden = !expanded;
  els.sectionVisibilityToggleButton.setAttribute("aria-expanded", expanded ? "true" : "false");
}

function syncSectionVisibilityControls() {
  if (!els.sectionVisibilityDrawer) return;
  const visibility = getSectionVisibility();
  els.sectionVisibilityDrawer.hidden = !state.editMode;
  if (!state.editMode) setSectionVisibilityPanelOpen(false);

  Object.entries(OPTIONAL_SECTION_BUTTONS).forEach(([sectionKey, elementKey]) => {
    const button = els[elementKey];
    if (button) button.hidden = !state.editMode && visibility[sectionKey] === false;
  });

  const inputs = els.sectionVisibilityOptions?.querySelectorAll?.("[data-section-visibility]") || [];
  inputs.forEach((input) => {
    input.checked = visibility[input.dataset.sectionVisibility] !== false;
  });
}

function updateSectionVisibility(sectionKey, visible) {
  if (!Object.prototype.hasOwnProperty.call(DEFAULT_SECTION_VISIBILITY, sectionKey)) return;
  state.worldData.sectionVisibility = {
    ...getSectionVisibility(),
    [sectionKey]: Boolean(visible),
  };
  persistWorldInfo();
}

function setupSectionVisibilityControls() {
  if (!els.sectionVisibilityDrawer) return;

  els.sectionVisibilityToggleButton?.addEventListener("click", () => {
    setSectionVisibilityPanelOpen(els.sectionVisibilityPanel?.hidden !== false);
  });

  els.sectionVisibilityOptions?.addEventListener("change", (event) => {
    const input = event.target?.closest?.("[data-section-visibility]");
    if (!input) return;
    updateSectionVisibility(input.dataset.sectionVisibility, input.checked);
  });

  document.addEventListener("click", (event) => {
    if (els.sectionVisibilityDrawer.hidden || els.sectionVisibilityDrawer.contains(event.target)) return;
    setSectionVisibilityPanelOpen(false);
  });
}

function readFileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

async function uploadFaviconFromEditor(file) {
  if (!state.editMode || !file || !String(file.type || "").startsWith("image/")) return;
  const dataUrl = await readFileToDataUrl(file);
  state.worldData.faviconUrl = dataUrl;
  persistWorldInfo();
  els.panelSubtitle.textContent = getUiText(state, "upload_favicon_updated_subtitle");
  els.panelText.textContent = getUiText(state, "upload_favicon_updated_text", { file: file.name });
}

function setSiteTheme(themeId) {
  const nextThemeId = BUILTIN_SITE_THEMES.some((theme) => theme.id === themeId) ? themeId : DEFAULT_SITE_THEME_ID;
  state.worldData.siteThemeId = nextThemeId;
  state.currentSiteTheme = nextThemeId;
  toggleSiteThemePopover(false);
  persistWorldInfo();
}

function renderSiteThemePicker() {
  if (!els?.editorThemeButton || !els?.editorThemeButtonLabel || !els?.editorThemeOptions) return;

  const currentThemeId = state.worldData?.siteThemeId || state.currentSiteTheme || DEFAULT_SITE_THEME_ID;
  const currentThemeLabel = getSiteThemeLabel(currentThemeId, state.currentLanguage);
  const buttonTitle = getUiText(state, "editor_theme_button_title");

  els.editorThemeButtonLabel.textContent = getUiText(state, "editor_theme_button", { theme: currentThemeLabel });
  els.editorThemeButton.title = buttonTitle;
  els.editorThemeButton.setAttribute("aria-label", buttonTitle);
  if (els.editorThemeTitle) {
    els.editorThemeTitle.textContent = getUiText(state, "editor_theme_title");
  }

  const optionNodes = BUILTIN_SITE_THEMES.map((theme) => {
    const button = document.createElement("button");
    const label = document.createElement("span");
    const mark = document.createElement("span");
    const isActive = theme.id === currentThemeId;

    button.type = "button";
    button.className = `editor-theme-option${isActive ? " active" : ""}`;
    button.dataset.siteThemeOption = theme.id;
    button.setAttribute("aria-pressed", isActive ? "true" : "false");

    label.className = "editor-theme-option-name";
    label.textContent = getSiteThemeLabel(theme.id, state.currentLanguage);

    mark.className = "editor-theme-option-mark";
    mark.textContent = isActive ? "\u2713" : "";
    mark.setAttribute("aria-hidden", "true");

    button.append(label, mark);
    return button;
  });

  els.editorThemeOptions.replaceChildren(...optionNodes);
}

function toggleSiteThemePopover(force) {
  if (!els?.editorThemePopover || !els?.editorThemeButton) return;

  const shouldOpen = typeof force === "boolean" ? force : els.editorThemePopover.hidden;
  els.editorThemePopover.hidden = !shouldOpen;
  els.editorThemeButton.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
  if (shouldOpen) renderSiteThemePicker();
}

function formatTopbarReadoutToken(rawValue) {
  return String(rawValue || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\b(Button|Input|Popover|Panel|Toggle|Label|Menu|Link|Wrap|Open)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((token) => token.toUpperCase())
    .slice(0, 3)
    .join(".");
}

function setTopbarTechReadout(source) {
  if (!els?.topbarTechReadout) return;

  if (!source) {
    els.topbarTechReadout.textContent = "SYS//READY";
    return;
  }

  const candidate = source.dataset?.techLabel
    || (source.id ? formatTopbarReadoutToken(source.id) : "")
    || formatTopbarReadoutToken(source.getAttribute?.("aria-label"))
    || formatTopbarReadoutToken(source.title)
    || formatTopbarReadoutToken(source.textContent);

  els.topbarTechReadout.textContent = candidate ? `SYS//${candidate}` : "SYS//READY";
}

function toggleMapViewSwitcherVisibility() {
  mapViewAdmin?.toggleVisibility();
}

function editMapViews() {
  mapViewAdmin?.editViews();
  return;

  const views = getMapViews(state.worldData);
  const menu = [
    "Какой режим карты изменить?",
    ...views.map((view, index) => `${index + 1}. ${view.label} [id: ${view.id}, texture: ${view.textureKey}]`),
    `${views.length + 1}. + Новый режим`,
  ].join("\n");

  const selectedRaw = window.prompt(menu, "1");
  if (selectedRaw == null) return;

  const selectedIndex = Number(selectedRaw) - 1;
  const nextViews = views.map((entry) => ({ ...entry }));
  const selectedView = nextViews[selectedIndex] || null;
  const isNew = selectedIndex === views.length;
  if (!selectedView && !isNew) return;

  if (!isNew) {
    const action = window.prompt("Действие: edit / delete", "edit");
    if (action == null) return;
    if (String(action).trim().toLowerCase() === "delete") {
      if (nextViews.length <= 1) {
        window.alert("Нужно оставить хотя бы один режим карты.");
        return;
      }
      if (!window.confirm(`Удалить режим "${selectedView.label || selectedView.id}"?`)) return;

      const filteredViews = nextViews.filter((entry) => entry.id !== selectedView.id);
      state.worldData.mapViews = normalizeMapViews(filteredViews);
      state.mapViewMode = resolveMapViewMode(state.worldData, state.mapViewMode === selectedView.id ? filteredViews[0]?.id : state.mapViewMode);
      persistWorldInfo();
      ui.setMapDisplayMode(state.mapViewMode, { rerenderArchive: true });
      return;
    }
  }

  const currentId = selectedView?.id || "";
  const nextId = window.prompt("ID режима", currentId || "satellite");
  if (nextId == null) return;

  const currentLabel = selectedView?.label || "";
  const nextLabel = window.prompt("Название режима", currentLabel || "Спутник");
  if (nextLabel == null) return;

  const currentTextureKey = selectedView?.textureKey || "";
  const nextTextureKey = window.prompt("Ключ текстуры для этого режима", currentTextureKey || nextId || "satellite");
  if (nextTextureKey == null) return;

  const currentVisibleAnswer = selectedView?.userVisible === false ? "n" : "y";
  const nextVisibleAnswer = window.prompt("Показывать игрокам? y/n", currentVisibleAnswer);
  if (nextVisibleAnswer == null) return;

  const draft = {
    id: nextId,
    label: String(nextLabel).trim(),
    textureKey: String(nextTextureKey).trim(),
    userVisible: !/^n/i.test(String(nextVisibleAnswer).trim()),
    translations: selectedView?.translations || {},
  };

  if (isNew) {
    nextViews.push(draft);
  } else {
    nextViews[selectedIndex] = draft;
  }

  state.worldData.mapViews = normalizeMapViews(nextViews);
  const preferredMode = isNew
    ? draft.id
    : (state.mapViewMode === currentId ? draft.id : state.mapViewMode);
  state.mapViewMode = resolveMapViewMode(state.worldData, preferredMode || draft.id);
  persistWorldInfo();
  ui.setMapDisplayMode(state.mapViewMode, { rerenderArchive: true });
}

function syncLocalizedUi() {
  // Re-resolve the language every time because the available language list can
  // change while editing the project.
  state.currentLanguage = resolveLanguage(state.worldData, state.currentLanguage || state.worldData.defaultLanguage);
  persistCurrentLanguage(state.currentLanguage);
  applyUiLocale(els, state);
  applyWorldBranding(els, state.worldData, state.currentLanguage);
  ui?.syncPaletteTheme?.();
  renderSiteThemePicker();
  setTopbarTechReadout(null);
  techConsoleController?.syncThemeState?.();
  loadingExperience.setWorldInfo(state.worldData);
  languageSwitcher.render();
  syncMapViewEditorButtons();
  syncSectionVisibilityControls();
  audioManager?.syncUi?.();
  ui.rerenderCurrentMode();

  if (state.currentPanelEntity?.entity === "timelineEvent" && state.currentTimelineEvent) {
    ui.updatePanelFromTimelineEvent(state.currentTimelineEvent);
  } else if (state.currentMarker) {
    ui.updatePanelFromMarker(state.currentMarker);
  }
}

function renameWorldFromEditor() {
  const localizedWorldInfo = resolveWorldInfoForLanguage(state.worldData, state.currentLanguage);
  const nextName = window.prompt(
    getUiText(state, "prompt_world_name"),
    localizedWorldInfo?.name || DEFAULT_WORLD_INFO.name,
  );
  if (nextName == null) return;

  const trimmedName = String(nextName).trim();
  if (!trimmedName) {
    window.alert(getUiText(state, "alert_world_name_empty"));
    return;
  }

  state.worldData = renameWorldInfo(state.worldData, trimmedName, { languageCode: state.currentLanguage });
  changesManager.upsert("worldInfo", "world", state.worldData);
  syncLocalizedUi();

  if (!state.currentMarker) {
    els.panelSubtitle.textContent = getUiText(state, "world_renamed_subtitle");
    els.panelText.textContent = getUiText(state, "world_renamed_text", { name: trimmedName });
  }
}

function removeLanguageLayer(languageCode) {
  const normalizedCode = normalizeLanguageCode(languageCode);
  if (normalizedCode === state.worldData.defaultLanguage) {
    window.alert(getUiText(state, "alert_default_language_delete"));
    return;
  }

  const label = getLanguageLabel(state.worldData, normalizedCode);
  if (!window.confirm(getUiText(state, "confirm_delete_language", { label }))) return;

  if (!removeLanguageFromWorld(state.worldData, normalizedCode)) return;

  (state.markersData || []).forEach((marker) => {
    if (pruneLanguageTranslation(marker, normalizedCode)) {
      changesManager.upsert("marker", marker.id, marker);
    }
  });

  (state.eventsData || []).forEach((event) => {
    if (pruneLanguageTranslation(event, normalizedCode)) {
      changesManager.upsert("timelineEvent", event.id, event);
    }
  });

  (state.archiveData || []).forEach((group) => {
    if (pruneLanguageTranslation(group, normalizedCode)) {
      changesManager.upsert("archiveGroup", group.id, group);
    }
    (group.items || []).forEach((item) => {
      if (pruneLanguageTranslation(item, normalizedCode)) {
        changesManager.upsert("archiveItem", item.id, item, { groupId: group.id });
      }
    });
  });

  (state.heroesData || []).forEach((group) => {
    if (pruneLanguageTranslation(group, normalizedCode)) {
      changesManager.upsert("heroGroup", group.id, group);
    }
    (group.items || []).forEach((hero) => {
      if (pruneLanguageTranslation(hero, normalizedCode)) {
        changesManager.upsert("heroItem", hero.id, hero, { groupId: group.id });
      }
    });
  });

  (state.homebrewCategoriesData || []).forEach((category) => {
    if (pruneLanguageTranslation(category, normalizedCode)) {
      changesManager.upsert("homebrewCategory", category.id, category);
    }
  });

  (state.homebrewArticlesData || []).forEach((article) => {
    if (pruneLanguageTranslation(article, normalizedCode)) {
      changesManager.upsert("homebrewArticle", article.id, article);
    }
  });

  if (state.currentLanguage === normalizedCode) {
    state.currentLanguage = resolveLanguage(state.worldData, state.worldData.defaultLanguage);
  }

  if (getLanguages(state.worldData).length <= 1) {
    state.worldData.languagesEnabled = false;
  }

  changesManager.upsert("worldInfo", "world", state.worldData);
  languageSwitcher.close();
  syncLocalizedUi();
}

function hydrateStateFromData(data) {
  state.baseDataSnapshot = data.baseData ? cloneValue(data.baseData) : state.baseDataSnapshot;
  state.worldData = data.worldData || state.worldData;
  state.currentSiteTheme = state.worldData?.siteThemeId || DEFAULT_SITE_THEME_ID;
  const persistedLanguage = readPersistedLanguage();
  state.currentLanguage = resolveLanguage(
    state.worldData,
    persistedLanguage || state.currentLanguage || state.worldData?.defaultLanguage,
  );
  state.playersData = data.playersData || [];
  state.groupsData = data.groupsData;
  state.markersData = data.markersData;
  state.timelineActsData = data.timelineActsData || [];
  state.eventsData = data.eventsData;
  state.archiveData = data.archiveData;
  state.heroesData = data.heroesData;
  state.homebrewCategoriesData = data.homebrewCategoriesData || [];
  state.homebrewArticlesData = data.homebrewArticlesData || [];
  state.regionLabelsData = data.regionLabelsData || [];
  state.drawLayersData = data.drawLayersData || [];
  state.mapTextureByType = data.mapTexturesData && typeof data.mapTexturesData === "object"
    ? Object.fromEntries(
        Object.entries(data.mapTexturesData).map(([key, value]) => [String(key || "").trim(), String(value || "")]),
      )
    : {};
  state.editorGroupId = state.groupsData[0]?.id || null;

  changesManager.setBaseVersion(data.loadedChanges?.meta?.baseVersion || "base-local-json");
  if (data.loadedChanges) changesManager.loadPayload(data.loadedChanges);
}

function resetTransientSelections() {
  state.currentMarker = null;
  state.currentRegionLabel = null;
  state.currentTimelineEvent = null;
  state.currentTimelineEventId = null;
  state.currentTimelineActId = "";
  state.currentArchiveItemId = null;
  state.currentHeroId = null;
  state.currentHomebrewArticleId = null;
  state.currentHomebrewCategoryId = "all";
  state.currentHomebrewType = "change";
  state.homebrewSearchQuery = "";
  state.currentPanelEntity = { entity: "marker" };
}

function renderInitialViews() {
  editor.renderGroups();
  editor.renderMarkers();
  editor.renderRegionLabels();
  editor.renderDrawLayers();
  ui.renderTimeline();
  ui.renderHeroes();
  ui.renderHomebrew();
}

function setupTopLevelInteractions() {
  compactTopbarMenus.setup();
  languageSwitcher.setup();
  audioManager?.setup?.();
  techConsoleController?.setup?.();
  els.panelHandle.addEventListener("click", () => ui.togglePanel());
  els.deleteMarkerButton.addEventListener("click", () => editor.deleteCurrentMarker());
  if (els.toggleLanguageVisibilityButton) {
    els.toggleLanguageVisibilityButton.hidden = true;
    els.toggleLanguageVisibilityButton.style.display = "none";
  }

  els.paletteToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    ui.togglePalettePopover();
  });

  els.palettePopover.addEventListener("click", (event) => {
    const button = event.target.closest(".palette-option");
    if (!button) return;
    const palette = button.dataset.paletteValue;
    if (!palette) return;
    ui.setPalette(palette);
    ui.togglePalettePopover(false);
  });

  els.editorThemeButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!state.editMode) return;
    toggleSiteThemePopover();
  });

  els.editorThemePopover?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-site-theme-option]");
    if (!button) return;
    event.stopPropagation();
    setSiteTheme(button.dataset.siteThemeOption);
  });

  els.topbar?.addEventListener("mouseover", (event) => {
    const interactive = event.target.closest("button, input, select, [role='button']");
    if (!interactive || !els.topbar.contains(interactive)) return;
    setTopbarTechReadout(interactive);
  });

  els.topbar?.addEventListener("focusin", (event) => {
    const interactive = event.target.closest("button, input, select, [role='button']");
    if (!interactive || !els.topbar.contains(interactive)) return;
    setTopbarTechReadout(interactive);
  });

  els.topbar?.addEventListener("mouseleave", () => {
    setTopbarTechReadout(null);
  });

  els.topbar?.addEventListener("focusout", (event) => {
    if (els.topbar.contains(event.relatedTarget)) return;
    setTopbarTechReadout(null);
  });

  els.toggleMapViewSwitcherButton?.addEventListener("click", () => {
    if (!state.editMode) return;
    mapViewAdmin.toggleVisibility();
    compactTopbarMenus.close();
  });

  els.editMapViewsButton?.addEventListener("click", () => {
    if (!state.editMode) return;
    mapViewAdmin.editViews();
    compactTopbarMenus.close();
  });

  els.deleteMapViewModeButton?.addEventListener("click", () => {
    if (!state.editMode) return;
    mapViewAdmin.deleteView();
    compactTopbarMenus.close();
  });

  els.editLoadingScreenButton?.addEventListener("click", () => {
    if (!state.editMode) return;
    loadingScreenAdmin?.edit();
  });

  els.previewLoadingScreenButton?.addEventListener("click", async () => {
    if (!state.editMode) return;
    await loadingScreenAdmin?.preview();
  });
  els.uploadLoadingScreenImageButton?.addEventListener("click", () => {
    if (!state.editMode) return;
    loadingScreenAdmin?.promptImageUpload?.();
  });
  els.uploadFaviconButton?.addEventListener("click", () => {
    if (!state.editMode) return;
    els.faviconInput.click();
  });
  els.faviconInput?.addEventListener("change", async (event) => {
    const [file] = Array.from(event.target.files || []);
    await uploadFaviconFromEditor(file);
    els.faviconInput.value = "";
  });

  const proxyEditorAction = (proxyElement, targetElement, options = {}) => {
    proxyElement?.addEventListener("click", async () => {
      if (!state.editMode) return;
      if (typeof options.beforeClick === "function") options.beforeClick();
      if (!targetElement || (!options.allowHidden && targetElement.hidden)) return;
      if (typeof options.invoke === "function") {
        await options.invoke(targetElement);
        return;
      }
      targetElement.click();
    });
  };

  proxyEditorAction(els.editorManageMapViewsButton, els.editMapViewsButton, {
    beforeClick: () => compactTopbarMenus.close(),
  });
  proxyEditorAction(els.editorToggleMapViewSwitcherButton, els.toggleMapViewSwitcherButton, {
    beforeClick: () => compactTopbarMenus.close(),
  });
  proxyEditorAction(els.editorUploadMapTextureButton, els.uploadMapTextureButton, {
    beforeClick: () => compactTopbarMenus.close(),
  });
  proxyEditorAction(els.editorExportDataButton, els.exportDataButton, {
    beforeClick: () => compactTopbarMenus.close(),
  });
  proxyEditorAction(els.editorImportDataButton, els.importDataButton, {
    beforeClick: () => compactTopbarMenus.close(),
    invoke: () => els.importDataInput.click(),
  });
  proxyEditorAction(els.editorLegendButton, els.sidebarLegendEditButton, { allowHidden: true });
  proxyEditorAction(els.editorAddTimelineActButton, els.addTimelineActButton);
  proxyEditorAction(els.editorEditTimelineActButton, els.editTimelineActButton);
  proxyEditorAction(els.editorDeleteTimelineActButton, els.deleteTimelineActButton);
  proxyEditorAction(els.editorTimelineBackdropButton, els.timelineActImageButton);
  proxyEditorAction(els.editorAddHomebrewCategoryButton, els.addHomebrewCategoryButton);
  proxyEditorAction(els.editorAddHomebrewArticleButton, els.addHomebrewArticleButton);
  proxyEditorAction(els.heroesAddHeroGroupButton, els.addHeroGroupButton);
  proxyEditorAction(els.heroesAddHeroCardButton, els.addHeroCardButton);

  document.addEventListener("click", (event) => {
    if (!els.paletteWidget.contains(event.target)) ui.togglePalettePopover(false);
    if (els.editorThemePicker && !els.editorThemePicker.contains(event.target)) {
      toggleSiteThemePopover(false);
    }
    if (
      els.sidebarLegendPanel.contains(event.target)
      || els.sidebarLegendToggle.contains(event.target)
    ) return;
    ui.closeSidebarLegend();
  });

  document.addEventListener("serkonia:edit-mode-changed", () => {
    languageSwitcher.render();
    syncMapViewEditorButtons();
    syncSectionVisibilityControls();
    if (!state.editMode) {
      toggleSiteThemePopover(false);
      const activeSection = getCurrentSectionKey();
      if (activeSection && !isSectionVisibleForCurrentAudience(activeSection)) ui.openMapMode();
    }
  });

  els.timelineOpenButton.addEventListener("click", () => {
    if (!isSectionVisibleForCurrentAudience("timeline")) return;
    if (state.timelineMode || state.archiveMode || state.homebrewMode) {
      ui.openMapMode();
      return;
    }
    if (!state.timelineMode) ui.openTimelineMode();
  });

  els.archiveOpenButton.addEventListener("click", () => {
    if (!isSectionVisibleForCurrentAudience("archive")) return;
    if (state.archiveMode) {
      ui.openMapMode();
      return;
    }
    ui.openArchiveMode();
  });
  els.homebrewOpenButton.addEventListener("click", () => {
    if (!isSectionVisibleForCurrentAudience("homebrew")) return;
    if (state.homebrewMode) {
      ui.openMapMode();
      return;
    }
    ui.openHomebrewMode();
  });

  els.heroesOpenButton.addEventListener("click", () => {
    if (!isSectionVisibleForCurrentAudience("heroes")) return;
    ui.openHeroesMode();
  });
  els.renameWorldButton.addEventListener("click", renameWorldFromEditor);
  els.heroesHomeButton.addEventListener("click", () => ui.openMapMode());
  els.mapReturnButton.addEventListener("click", () => ui.openMapMode());
  els.importDataButton.addEventListener("click", () => {
    compactTopbarMenus.close();
    els.importDataInput.click();
  });
  els.uploadMapTextureButton.addEventListener("click", () => compactTopbarMenus.close());
  els.exportDataButton.addEventListener("click", () => compactTopbarMenus.close());
  setupTimelineScrollControls(els);
  panelEditableFields.forEach((element) => element.addEventListener("input", ui.savePanelToCurrentMarker));
}

function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read JSON file."));
    reader.readAsText(file, "utf-8");
  });
}

async function importChangesFromFile(file) {
  if (!file) return;

  const sourceText = await readTextFile(file);
  const payload = JSON.parse(sourceText);
  validateChangesPayload(payload);

  const baseData = cloneValue(state.baseDataSnapshot);
  if (!baseData) {
    throw new Error("Base data snapshot is missing.");
  }

  const resolvedData = applyChanges(baseData, payload);
  changesManager.loadPayload(payload);
  resetTransientSelections();
  hydrateStateFromData({
    ...resolvedData,
    baseData,
    loadedChanges: payload,
  });
  renderInitialViews();
  syncLocalizedUi();
}

async function init() {
  let failed = false;

  try {
    const data = await loadData();
    hydrateStateFromData(data);
    renderInitialViews();
    syncLocalizedUi();
  } catch (error) {
    failed = true;
    console.error(getUiText(state, "load_error_console"), error);
    els.panelTitle.textContent = getUiText(state, "error_title");
    els.panelSubtitle.textContent = getUiText(state, "error_subtitle");
    const details = String(error?.message || "").trim();
    els.panelText.textContent = details
      ? `${getUiText(state, "error_text")}\n\n${details}`
      : getUiText(state, "error_text");
    els.fact1.textContent = getUiText(state, "error_fact_1");
    els.fact2.textContent = getUiText(state, "error_fact_2");
    els.fact3.textContent = getUiText(state, "error_fact_3");
    ui.togglePanel(true);
  } finally {
    await loadingExperience.finish({ failed });
  }
}

async function bootstrap() {
  try {
    initializeAppShell();

    ui.setPalette(state.currentPalette);
    ui.togglePalettePopover(false);
    ui.setPanelEditable(false);
    ui.setTopbarSync(() => compactTopbarMenus.sync());
    ui.refreshTopbarActionButtons();
    languageSwitcher.render();
    syncMapViewEditorButtons();
    syncSectionVisibilityControls();
    ui.setModeWord(getUiText(state, "mode_map"), true);
    ui.togglePanel(true);
    mapModule.applyMapTransform();

    setupTopLevelInteractions();
    setupSectionVisibilityControls();
    mapModule.setupMapNavigation();
    editor.setupEditorInteractions();
    homebrewController.setup();

    els.importDataInput.addEventListener("change", async (event) => {
      const [file] = Array.from(event.target.files || []);
      try {
        await importChangesFromFile(file);
      } catch (error) {
        console.error(error);
    window.alert("Не удалось импортировать JSON. Проверь файл changes.json и его структуру.");
      } finally {
        els.importDataInput.value = "";
      }
    });

    await init();
  } catch (error) {
    await handleFatalStartupError(error);
  }
}

void bootstrap();
