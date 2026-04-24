import {
  HINTS_ENABLED_STORAGE_KEY,
  HINTS_SEEN_STORAGE_KEY,
  readBooleanStorage,
  readJsonStorage,
  writeBooleanStorage,
  writeJsonStorage,
} from "./hintsStorage.js";

const HOVER_READ_DELAY = 1000;
const SHOW_DELAY = 160;
const VIEWER_SCOPE = "viewer";
const EDITOR_SCOPE = "editor";
const TOPBAR_BOTTOM_EDGE = 180;
const SIDEBAR_RIGHT_EDGE = 180;
const EDITOR_TOP_EDGE_RATIO = 0.68;

function isVisibleElement(element) {
  return Boolean(
    element
    && element.isConnected
    && !element.hidden
    && element.getClientRects().length
    && window.getComputedStyle(element).display !== "none"
    && window.getComputedStyle(element).visibility !== "hidden",
  );
}

function createTooltip() {
  const tooltip = document.createElement("aside");
  tooltip.className = "hover-hint-card";
  tooltip.hidden = true;
  tooltip.setAttribute("role", "tooltip");

  const kicker = document.createElement("p");
  kicker.className = "hover-hint-kicker";

  const title = document.createElement("h3");
  title.className = "hover-hint-title";

  const text = document.createElement("p");
  text.className = "hover-hint-text";

  tooltip.append(kicker, title, text);
  document.body.appendChild(tooltip);

  return {
    tooltip,
    kicker,
    title,
    text,
  };
}

function buildHintDefinitions(els) {
  return [
    {
      id: "topbar-navigation",
      scope: VIEWER_SCOPE,
      target: () => els.topbar,
      titleKey: "hover_hint_topbar_title",
      textKey: "hover_hint_topbar_text",
      placement: "bottom",
    },
    {
      id: "language-switcher",
      scope: VIEWER_SCOPE,
      target: () => els.languageSwitcher,
      titleKey: "hover_hint_language_title",
      textKey: "hover_hint_language_text",
      placement: "bottom",
    },
    {
      id: "audio-switcher",
      scope: VIEWER_SCOPE,
      target: () => els.audioSwitcher,
      titleKey: "hover_hint_audio_title",
      textKey: "hover_hint_audio_text",
      placement: "bottom",
    },
    {
      id: "homebrew-navigation",
      scope: VIEWER_SCOPE,
      target: () => els.homebrewOpenButton,
      titleKey: "hover_hint_homebrew_title",
      textKey: "hover_hint_homebrew_text",
      placement: "bottom",
    },
    {
      id: "map-view-switcher",
      scope: VIEWER_SCOPE,
      target: () => els.mapViewSwitcher,
      titleKey: "hover_hint_map_views_title",
      textKey: "hover_hint_map_views_text",
      placement: "bottom",
    },
    {
      id: "editor-map-modes-button",
      scope: EDITOR_SCOPE,
      target: () => els.editMapViewsButton || els.editorManageMapViewsButton,
      titleKey: "hover_hint_editor_map_modes_title",
      textKey: "hover_hint_editor_map_modes_text",
      editorOnly: true,
      placement: "bottom",
    },
    {
      id: "editor-hide-map-modes-button",
      scope: EDITOR_SCOPE,
      target: () => els.toggleMapViewSwitcherButton || els.editorToggleMapViewSwitcherButton,
      titleKey: "hover_hint_editor_hide_map_modes_title",
      textKey: "hover_hint_editor_hide_map_modes_text",
      editorOnly: true,
      placement: "bottom",
    },
    {
      id: "editor-map-texture-button",
      scope: EDITOR_SCOPE,
      target: () => els.uploadMapTextureButton || els.editorUploadMapTextureButton,
      titleKey: "hover_hint_editor_map_texture_title",
      textKey: "hover_hint_editor_map_texture_text",
      editorOnly: true,
      placement: "bottom",
    },
    {
      id: "palette",
      scope: VIEWER_SCOPE,
      target: () => els.paletteWidget,
      titleKey: "hover_hint_palette_title",
      textKey: "hover_hint_palette_text",
      placement: "right",
    },
    {
      id: "search",
      scope: VIEWER_SCOPE,
      target: () => els.globalSearchButton,
      titleKey: "hover_hint_search_title",
      textKey: "hover_hint_search_text",
      placement: "right",
    },
    {
      id: "layers",
      scope: VIEWER_SCOPE,
      target: () => els.toolButtonsContainer,
      titleKey: "hover_hint_layers_title",
      textKey: "hover_hint_layers_text",
      placement: "right",
    },
    {
      id: "sidebar-legend",
      scope: VIEWER_SCOPE,
      target: () => els.sidebarLegendToggle,
      titleKey: "hover_hint_legend_title",
      textKey: "hover_hint_legend_text",
      placement: "right",
    },
    {
      id: "favorites",
      scope: VIEWER_SCOPE,
      target: () => els.favoritesToggleButton,
      titleKey: "hover_hint_favorites_title",
      textKey: "hover_hint_favorites_text",
      placement: "right",
    },
    {
      id: "notes",
      scope: VIEWER_SCOPE,
      target: () => els.notesToggleButton,
      titleKey: "hover_hint_notes_title",
      textKey: "hover_hint_notes_text",
      placement: "right",
    },
    {
      id: "players",
      scope: VIEWER_SCOPE,
      target: () => els.playersToggleButton,
      titleKey: "hover_hint_players_title",
      textKey: "hover_hint_players_text",
      placement: "right",
    },
    {
      id: "details-panel",
      scope: VIEWER_SCOPE,
      target: () => els.panelHandle,
      titleKey: "hover_hint_panel_title",
      textKey: "hover_hint_panel_text",
      placement: "left",
    },
    {
      id: "editor-shell",
      scope: EDITOR_SCOPE,
      target: () => els.editorActions,
      titleKey: "hover_hint_editor_shell_title",
      textKey: "hover_hint_editor_shell_text",
      editorOnly: true,
      placement: "top",
    },
    {
      id: "editor-collapse",
      scope: EDITOR_SCOPE,
      target: () => els.editorShellToggleButton,
      titleKey: "hover_hint_editor_collapse_title",
      textKey: "hover_hint_editor_collapse_text",
      editorOnly: true,
      placement: "top",
    },
    {
      id: "editor-styles",
      scope: EDITOR_SCOPE,
      target: () => els.editorThemePicker,
      titleKey: "hover_hint_editor_styles_title",
      textKey: "hover_hint_editor_styles_text",
      editorOnly: true,
      placement: "top",
    },
    {
      id: "editor-section-visibility",
      scope: EDITOR_SCOPE,
      target: () => els.sectionVisibilityDrawer,
      titleKey: "hover_hint_editor_section_visibility_title",
      textKey: "hover_hint_editor_section_visibility_text",
      editorOnly: true,
      placement: "bottom",
    },
    {
      id: "editor-information",
      scope: EDITOR_SCOPE,
      target: () => els.editorDiagnosticsSection,
      titleKey: "hover_hint_editor_information_title",
      textKey: "hover_hint_editor_information_text",
      editorOnly: true,
      placement: "top",
    },
    {
      id: "editor-world",
      scope: EDITOR_SCOPE,
      target: () => els.editorWorldSection,
      titleKey: "hover_hint_editor_world_title",
      textKey: "hover_hint_editor_world_text",
      editorOnly: true,
      placement: "top",
    },
    {
      id: "editor-map",
      scope: EDITOR_SCOPE,
      target: () => els.editorMapSection,
      titleKey: "hover_hint_editor_map_title",
      textKey: "hover_hint_editor_map_text",
      editorOnly: true,
      placement: "top",
    },
    {
      id: "editor-timeline",
      scope: EDITOR_SCOPE,
      target: () => els.editorTimelineSection,
      titleKey: "hover_hint_editor_mode_section_title",
      textKey: "hover_hint_editor_mode_section_text",
      editorOnly: true,
      placement: "top",
    },
    {
      id: "editor-archive",
      scope: EDITOR_SCOPE,
      target: () => els.editorArchiveSection,
      titleKey: "hover_hint_editor_mode_section_title",
      textKey: "hover_hint_editor_mode_section_text",
      editorOnly: true,
      placement: "top",
    },
    {
      id: "editor-heroes",
      scope: EDITOR_SCOPE,
      target: () => els.editorHeroesSection,
      titleKey: "hover_hint_editor_mode_section_title",
      textKey: "hover_hint_editor_mode_section_text",
      editorOnly: true,
      placement: "top",
    },
    {
      id: "editor-homebrew",
      scope: EDITOR_SCOPE,
      target: () => els.editorHomebrewSection,
      titleKey: "hover_hint_editor_mode_section_title",
      textKey: "hover_hint_editor_mode_section_text",
      editorOnly: true,
      placement: "top",
    },
    {
      id: "panel-language-menu",
      scope: VIEWER_SCOPE,
      target: () => els.languagePopover,
      titleKey: "hover_hint_language_panel_title",
      textKey: "hover_hint_language_panel_text",
      placement: "left",
      persistent: true,
      isOpen: () => Boolean(els.languagePopover && !els.languagePopover.hidden),
      watch: () => els.languagePopover,
    },
    {
      id: "panel-audio-menu",
      scope: VIEWER_SCOPE,
      target: () => els.audioPopover,
      titleKey: "hover_hint_audio_panel_title",
      textKey: "hover_hint_audio_panel_text",
      placement: "left",
      persistent: true,
      isOpen: () => Boolean(els.audioPopover && !els.audioPopover.hidden),
      watch: () => els.audioPopover,
    },
    {
      id: "panel-palette-menu",
      scope: VIEWER_SCOPE,
      target: () => els.palettePopover,
      titleKey: "hover_hint_palette_panel_title",
      textKey: "hover_hint_palette_panel_text",
      placement: "right",
      persistent: true,
      isOpen: () => Boolean(els.palettePopover && !els.palettePopover.hidden),
      watch: () => els.palettePopover,
    },
    {
      id: "panel-legend-menu",
      scope: VIEWER_SCOPE,
      target: () => els.sidebarLegendPanel,
      titleKey: "hover_hint_legend_panel_title",
      textKey: "hover_hint_legend_panel_text",
      placement: "right",
      persistent: true,
      isOpen: () => Boolean(els.sidebarLegendPanel && !els.sidebarLegendPanel.hidden),
      watch: () => els.sidebarLegendPanel,
    },
    {
      id: "panel-loading-editor",
      scope: EDITOR_SCOPE,
      target: () => els.loadingEditorPanel?.querySelector?.(".loading-editor-card") || els.loadingEditorPanel,
      titleKey: "hover_hint_loading_editor_panel_title",
      textKey: "hover_hint_loading_editor_panel_text",
      editorOnly: true,
      placement: "left",
      persistent: true,
      isOpen: () => Boolean(els.loadingEditorPanel && !els.loadingEditorPanel.hidden),
      watch: () => els.loadingEditorPanel,
    },
  ];
}

export function createHintsController(options) {
  const {
    els,
    state,
    getUiText,
    onHintsEnabledChange,
  } = options;

  const ui = createTooltip();
  const definitions = buildHintDefinitions(els);
  const storedSeenHints = readJsonStorage(HINTS_SEEN_STORAGE_KEY, []);
  let hintsEnabled = readBooleanStorage(HINTS_ENABLED_STORAGE_KEY, true);
  let seenHints = new Set(Array.isArray(storedSeenHints) ? storedSeenHints : []);
  let activeHint = null;
  let hoveredHint = null;
  let showTimer = 0;
  let readTimer = 0;
  let hideTimer = 0;

  function t(key, params = {}) {
    return typeof getUiText === "function" ? getUiText(key, params) : key;
  }

  function getHintTarget(hint) {
    const target = hint?.target?.();
    return isVisibleElement(target) ? target : null;
  }

  function canShowHint(hint) {
    if (!hint || !hintsEnabled || seenHints.has(hint.id)) return false;
    if (hint.editorOnly && !state.editMode) return false;
    if (hint.persistent && !hint.isOpen?.()) return false;
    return Boolean(getHintTarget(hint));
  }

  function clampCoordinate(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function getAutomaticPlacement(rect) {
    if (rect.bottom <= TOPBAR_BOTTOM_EDGE) return "bottom";
    if (rect.top >= window.innerHeight * EDITOR_TOP_EDGE_RATIO) return "top";
    if (rect.right <= SIDEBAR_RIGHT_EDGE) return "right";
    if (rect.left >= window.innerWidth - 360) return "left";
    return "bottom";
  }

  function getPlacementCandidates(preferredPlacement, rect) {
    const preferred = preferredPlacement || getAutomaticPlacement(rect);
    return [preferred, "bottom", "top", "right", "left"].filter((placement, index, list) => (
      list.indexOf(placement) === index
    ));
  }

  function getPositionForPlacement(placement, rect, tooltipRect, gap) {
    if (placement === "bottom") {
      return {
        left: rect.left + rect.width / 2 - tooltipRect.width / 2,
        top: rect.bottom + gap,
      };
    }
    if (placement === "top") {
      return {
        left: rect.left + rect.width / 2 - tooltipRect.width / 2,
        top: rect.top - tooltipRect.height - gap,
      };
    }
    if (placement === "left") {
      return {
        left: rect.left - tooltipRect.width - gap,
        top: rect.top + rect.height / 2 - tooltipRect.height / 2,
      };
    }
    return {
      left: rect.right + gap,
      top: rect.top + rect.height / 2 - tooltipRect.height / 2,
    };
  }

  function positionTooltip(target, hint = activeHint) {
    const rect = target.getBoundingClientRect();
    const tooltipRect = ui.tooltip.getBoundingClientRect();
    const gap = 12;
    const viewportPadding = 12;
    const maxLeft = window.innerWidth - tooltipRect.width - viewportPadding;
    const maxTop = window.innerHeight - tooltipRect.height - viewportPadding;
    const candidates = getPlacementCandidates(hint?.placement, rect);
    let resolvedPosition = null;

    for (const placement of candidates) {
      const position = getPositionForPlacement(placement, rect, tooltipRect, gap);
      const fitsHorizontally = position.left >= viewportPadding && position.left <= maxLeft;
      const fitsVertically = position.top >= viewportPadding && position.top <= maxTop;
      if (fitsHorizontally && fitsVertically) {
        resolvedPosition = position;
        break;
      }
    }

    const fallbackPosition = resolvedPosition || getPositionForPlacement(candidates[0], rect, tooltipRect, gap);
    const left = clampCoordinate(fallbackPosition.left, viewportPadding, maxLeft);
    const top = clampCoordinate(fallbackPosition.top, viewportPadding, maxTop);

    ui.tooltip.style.left = `${Math.round(left)}px`;
    ui.tooltip.style.top = `${Math.round(top)}px`;
  }

  function persistSeenHints() {
    writeJsonStorage(HINTS_SEEN_STORAGE_KEY, Array.from(seenHints));
  }

  function markSeen(hint) {
    if (!hint || seenHints.has(hint.id)) return;
    seenHints.add(hint.id);
    persistSeenHints();
  }

  function clearTimers() {
    window.clearTimeout(showTimer);
    window.clearTimeout(readTimer);
    window.clearTimeout(hideTimer);
    showTimer = 0;
    readTimer = 0;
    hideTimer = 0;
  }

  function hideHint({ mark = false } = {}) {
    if (mark && activeHint) markSeen(activeHint);
    clearTimers();
    hoveredHint = null;
    activeHint = null;
    ui.tooltip.classList.remove("is-open");
    hideTimer = window.setTimeout(() => {
      if (!activeHint) ui.tooltip.hidden = true;
    }, 160);
  }

  function showHint(hint) {
    if (!canShowHint(hint)) return;
    const target = getHintTarget(hint);
    if (!target) return;

    activeHint = hint;
    activeHint.hasReadLongEnough = Boolean(hint.persistent);
    ui.kicker.textContent = t(hint.scope === EDITOR_SCOPE ? "hover_hint_editor_kicker" : "hover_hint_viewer_kicker");
    ui.title.textContent = t(hint.titleKey);
    ui.text.textContent = t(hint.textKey);
    ui.tooltip.hidden = false;
    ui.tooltip.classList.remove("is-open");
    positionTooltip(target, hint);
    requestAnimationFrame(() => ui.tooltip.classList.add("is-open"));

    window.clearTimeout(readTimer);
    if (!hint.persistent) {
      readTimer = window.setTimeout(() => {
        if (hoveredHint?.id === hint.id && activeHint?.id === hint.id) {
          activeHint.hasReadLongEnough = true;
        }
      }, HOVER_READ_DELAY);
    }
  }

  function queueHint(hint) {
    if (activeHint?.persistent) return;
    if (!canShowHint(hint)) return;
    clearTimers();
    hoveredHint = hint;
    showTimer = window.setTimeout(() => {
      if (hoveredHint?.id === hint.id) showHint(hint);
    }, SHOW_DELAY);
  }

  function handleLeave(hint) {
    if (activeHint?.persistent) return;
    if (hoveredHint?.id !== hint.id && activeHint?.id !== hint.id) return;
    hideHint({ mark: Boolean(activeHint?.hasReadLongEnough) });
  }

  function attachHint(hint) {
    const target = hint.target?.();
    if (!target || target.dataset.hoverHintBound === "true") return;
    target.dataset.hoverHintBound = "true";
    target.addEventListener("pointerenter", () => queueHint(hint));
    target.addEventListener("pointerleave", () => handleLeave(hint));
    target.addEventListener("focusin", () => queueHint(hint));
    target.addEventListener("focusout", () => handleLeave(hint));
  }

  function bindVisibleHints() {
    definitions.forEach(attachHint);
  }

  function checkPersistentHint(hint) {
    if (!hint.persistent) return;
    const isOpen = Boolean(hint.isOpen?.());
    if (isOpen && canShowHint(hint)) {
      showHint(hint);
      return;
    }
    if (!isOpen && activeHint?.id === hint.id) {
      hideHint({ mark: true });
    }
  }

  function bindPersistentHints() {
    definitions.filter((hint) => hint.persistent).forEach((hint) => {
      const watchedElement = hint.watch?.();
      if (!watchedElement || watchedElement.dataset.persistentHintBound === "true") return;
      watchedElement.dataset.persistentHintBound = "true";
      const observer = new MutationObserver(() => checkPersistentHint(hint));
      observer.observe(watchedElement, {
        attributes: true,
        attributeFilter: ["hidden", "style", "class"],
      });
      watchedElement.addEventListener("transitionend", () => checkPersistentHint(hint));
    });
  }

  function resetProgress(scope = null) {
    if (!scope) {
      seenHints = new Set();
    } else {
      const scopedIds = new Set(definitions.filter((hint) => hint.scope === scope).map((hint) => hint.id));
      seenHints = new Set(Array.from(seenHints).filter((id) => !scopedIds.has(id)));
    }
    persistSeenHints();
  }

  function setHintsEnabled(nextValue, options = {}) {
    const { silent = false } = options;
    hintsEnabled = Boolean(nextValue);
    writeBooleanStorage(HINTS_ENABLED_STORAGE_KEY, hintsEnabled);
    state.editorHintsEnabled = hintsEnabled;
    if (!hintsEnabled) hideHint();
    if (!silent) onHintsEnabledChange?.(hintsEnabled);
  }

  function setup() {
    state.editorHintsEnabled = hintsEnabled;
    onHintsEnabledChange?.(hintsEnabled);
    bindVisibleHints();
    bindPersistentHints();

    document.addEventListener("serkonia:edit-mode-changed", () => {
      hideHint();
      bindVisibleHints();
      bindPersistentHints();
    });
    document.addEventListener("serkonia:hints:refresh", () => {
      bindVisibleHints();
      bindPersistentHints();
    });
    window.addEventListener("resize", () => {
      const target = getHintTarget(activeHint);
      if (target) positionTooltip(target, activeHint);
    });
    window.addEventListener("scroll", () => {
      const target = getHintTarget(activeHint);
      if (target) positionTooltip(target, activeHint);
    }, true);
  }

  return {
    setup,
    startViewerTour(options = {}) {
      if (options.force) resetProgress(VIEWER_SCOPE);
      setHintsEnabled(true);
      return true;
    },
    startEditorTour(options = {}) {
      if (options.force) resetProgress(EDITOR_SCOPE);
      setHintsEnabled(true);
      return true;
    },
    maybeStartViewerTour() {
      return true;
    },
    toggleHintsEnabled() {
      setHintsEnabled(!hintsEnabled);
    },
    setHintsEnabled,
    getHintsEnabled() {
      return hintsEnabled;
    },
    resetProgress,
    getProgress() {
      return {
        seen: seenHints.size,
        total: definitions.length,
      };
    },
  };
}
