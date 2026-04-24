import { UI_STRINGS } from "./uiLocaleStrings.js";

function interpolate(template, params = {}) {
  return String(template || "").replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? ""));
}

export function resolveUiLanguage(context) {
  const raw = String(
    context?.currentLanguage
    || context?.worldData?.defaultLanguage
    || context?.defaultLanguage
    || "ru",
  ).trim().toLowerCase();
  if (raw.startsWith("en")) return "en";
  if (raw.startsWith("ru")) return "ru";
  return "ru";
}

export function getUiText(context, key, params = {}) {
  const language = resolveUiLanguage(context);
  const template = UI_STRINGS[language]?.[key] ?? UI_STRINGS.ru[key] ?? key;
  return interpolate(template, params);
}

export function getLoadingFlavorLines(context, worldName) {
  if (resolveUiLanguage(context) === "en") {
    return [
      `Tracing old routes back into ${worldName}.`,
      "Sharpening the map, the rumors, and the trouble spots.",
      "Lifting the archive dust off people, factions, and unfinished promises.",
      "Checking whether anyone rewrote the history of this world overnight.",
      "Putting the table back together one chronicle at a time.",
    ];
  }

  return [
    `\u041d\u0430\u0441\u0442\u0440\u0430\u0438\u0432\u0430\u0435\u043c \u0432\u0440\u0430\u0442\u0430 \u043e\u0431\u0440\u0430\u0442\u043d\u043e \u0432 \u043c\u0438\u0440 \"${worldName}\".`,
    "\u041f\u0440\u0438\u0432\u043e\u0434\u0438\u043c \u0432 \u0447\u0443\u0432\u0441\u0442\u0432\u043e \u043a\u0430\u0440\u0442\u0443, \u0441\u043b\u0443\u0445\u0438 \u0438 \u043f\u0440\u043e\u0431\u043b\u0435\u043c\u043d\u044b\u0435 \u0442\u043e\u0447\u043a\u0438.",
    "\u0421\u043d\u0438\u043c\u0430\u0435\u043c \u043f\u044b\u043b\u044c \u0441 \u0430\u0440\u0445\u0438\u0432\u043e\u0432, \u0433\u0435\u0440\u043e\u0435\u0432 \u0438 \u043d\u0435\u0434\u043e\u0441\u043a\u0430\u0437\u0430\u043d\u043d\u044b\u0445 \u043b\u0435\u0433\u0435\u043d\u0434.",
    "\u041f\u0440\u043e\u0432\u0435\u0440\u044f\u0435\u043c, \u043d\u0435 \u043f\u0435\u0440\u0435\u043f\u0438\u0441\u0430\u043b \u043b\u0438 \u043a\u0442\u043e-\u0442\u043e \u0438\u0441\u0442\u043e\u0440\u0438\u044e \u0437\u0430 \u0432\u0430\u0448\u0435\u0439 \u0441\u043f\u0438\u043d\u043e\u0439.",
    "\u0421\u043e\u0431\u0438\u0440\u0430\u0435\u043c \u0441\u0442\u043e\u043b, \u043f\u0430\u0440\u0442\u0438\u044e \u0438 \u0445\u0440\u043e\u043d\u0438\u043a\u0443 \u043e\u0431\u0440\u0430\u0442\u043d\u043e \u0432\u043c\u0435\u0441\u0442\u0435.",
  ];
}

export function applyUiLocale(els, context) {
  const uiLanguage = resolveUiLanguage(context);
  const setText = (element, value) => {
    if (element) element.textContent = value;
  };
  const setLabel = (element, value) => {
    if (!element) return;
    element.title = value;
    element.setAttribute("aria-label", value);
  };

  setText(els.renameWorldButton, getUiText(context, "rename_world_button"));
  if (els.renameWorldButton) {
    const title = getUiText(context, "rename_world_title");
    els.renameWorldButton.title = title;
    els.renameWorldButton.setAttribute("aria-label", title);
  }

  setText(els.timelineOpenButton, getUiText(context, "mode_timeline"));
  setText(els.archiveOpenButton, getUiText(context, "mode_archive"));
  setText(els.homebrewOpenButton, getUiText(context, "mode_homebrew"));
  setText(els.heroesOpenButton, getUiText(context, "mode_heroes"));
  setText(els.sectionVisibilityToggleLabel, getUiText(context, "section_visibility_toggle"));
  setText(els.sectionVisibilityTitle, getUiText(context, "section_visibility_title"));
  setText(els.sectionVisibilityHint, getUiText(context, "section_visibility_hint"));
  setText(els.sectionVisibilityTimelineLabel, getUiText(context, "section_visibility_timeline"));
  setText(els.sectionVisibilityArchiveLabel, getUiText(context, "section_visibility_archive"));
  setText(els.sectionVisibilityHomebrewLabel, getUiText(context, "section_visibility_homebrew"));
  setText(els.sectionVisibilityHeroesLabel, getUiText(context, "section_visibility_heroes"));
  setText(els.mapReturnButton, getUiText(context, "mode_map"));
  setText(els.heroesHomeButton, getUiText(context, "heroes_home"));
  setText(els.addLanguageButton, getUiText(context, "add_language"));
  setText(els.deleteLanguageButton, getUiText(context, "delete_language"));
  setText(els.sidebarTitle, getUiText(context, "sidebar_layers"));
  setText(els.uploadMapTextureButton, getUiText(context, "upload_map_texture"));
  setText(els.exportDataButton, getUiText(context, "export_json"));
  setText(els.importDataButton, getUiText(context, "import_json"));
  setText(els.editorShellKicker, getUiText(context, "editor_shell_kicker"));
  setText(els.editorShellTitle, getUiText(context, "editor_shell_title"));
  if (els.editorShellToggleButton) {
    els.editorShellToggleButton.title = getUiText(
      context,
      document.body.classList.contains("editor-shell-collapsed") ? "editor_shell_expand" : "editor_shell_collapse",
    );
  }
  setText(els.editorDiagnosticsLabel, getUiText(context, "editor_section_diagnostics"));
  setText(els.openRuntimeLogsButton, getUiText(context, "info_logs"));
  setText(els.openRuntimeNotificationsButton, getUiText(context, "info_notifications"));
  setText(
    els.toggleEditorHintsButton,
    getUiText(context, context?.editorHintsEnabled ? "info_hints_on" : "info_hints_off"),
  );
  setText(els.editorWorldLabel, getUiText(context, "editor_section_world"));
  setText(els.editorMapLabel, getUiText(context, "editor_section_map"));
  setText(els.editorTimelineLabel, getUiText(context, "editor_section_timeline"));
  setText(els.editorArchiveLabel, getUiText(context, "editor_section_archive"));
  setText(els.editorHeroesLabel, getUiText(context, "editor_section_heroes"));
  setText(els.editorHomebrewLabel, getUiText(context, "editor_section_homebrew"));
  setText(els.addRegionLabelButton, getUiText(context, "add_region_label"));
  setText(els.toggleTextMoveModeButton, getUiText(context, "move_text"));
  setText(els.toggleDrawModeButton, getUiText(context, "draw_mode"));
  setText(els.validateDataButton, getUiText(context, "validate_data"));
  setText(els.editLoadingScreenButton, getUiText(context, "edit_loading_screen"));
  setText(els.previewLoadingScreenButton, getUiText(context, "preview_loading_screen"));
  setText(els.uploadLoadingScreenImageButton, getUiText(context, "loading_editor_upload_image"));
  setText(els.uploadFaviconButton, getUiText(context, "upload_favicon"));
  setText(els.editorManageMapViewsButton, getUiText(context, "map_views_manage"));
  setText(els.editorToggleMapViewSwitcherButton, getUiText(context, "map_views_hide_for_users"));
  setText(els.editorUploadMapTextureButton, getUiText(context, "upload_map_texture"));
  setText(els.editorExportDataButton, getUiText(context, "export_json"));
  setText(els.editorImportDataButton, getUiText(context, "import_json"));
  setText(els.editorLegendButton, getUiText(context, "sidebar_legend_edit"));
  setText(els.addTimelineEventButton, getUiText(context, "add_timeline_event"));
  setText(els.editorAddTimelineActButton, getUiText(context, "timeline_add_act"));
  setText(els.editorEditTimelineActButton, getUiText(context, "timeline_edit_act"));
  setText(els.editorDeleteTimelineActButton, getUiText(context, "timeline_delete_act"));
  setText(els.editorTimelineBackdropButton, getUiText(context, "timeline_act_bg_add"));
  setText(els.addArchiveGroupButton, getUiText(context, "add_archive_group"));
  setText(els.addArchiveItemButton, getUiText(context, "add_archive_card"));
  setText(els.addHeroGroupButton, getUiText(context, "add_hero_group"));
  setText(els.addHeroCardButton, getUiText(context, "add_hero"));
  setText(els.heroesAddHeroGroupButton, getUiText(context, "add_hero_group"));
  setText(els.heroesAddHeroCardButton, getUiText(context, "add_hero"));
  setText(els.editorAddHomebrewCategoryButton, getUiText(context, "homebrew_add_category"));
  setText(els.editorAddHomebrewArticleButton, getUiText(context, "homebrew_add_article"));
  setText(els.dataQualityKicker, getUiText(context, "info_center_kicker"));
  if (els.dataQualityHintsToggleButton) {
    els.dataQualityHintsToggleButton.textContent = getUiText(
      context,
      context?.editorHintsEnabled ? "info_hints_toggle_disable" : "info_hints_toggle_enable",
    );
  }
  setText(els.dataQualityAuditTab, getUiText(context, "validate_data"));
  setText(els.dataQualityLogsTab, getUiText(context, "info_logs"));
  setText(els.dataQualityNotificationsTab, getUiText(context, "info_notifications"));
  setText(els.dataQualityHintsTab, getUiText(context, "info_hints_label"));
  if (els.globalSearchButton) {
    els.globalSearchButton.textContent = "⌕";
    setLabel(els.globalSearchButton, getUiText(context, "search_title"));
  }
  if (els.globalSearchCloseButton) {
    els.globalSearchCloseButton.textContent = "×";
    setLabel(els.globalSearchCloseButton, getUiText(context, "heroes_close"));
  }
  if (els.paletteToggle) {
    els.paletteToggle.textContent = "🎨";
    setLabel(els.paletteToggle, uiLanguage === "en" ? "Palette" : "Палитра");
  }
  if (els.favoritesToggleButton) {
    els.favoritesToggleButton.textContent = "★";
    setLabel(els.favoritesToggleButton, getUiText(context, "favorites_title"));
  }
  if (els.notesToggleButton) {
    els.notesToggleButton.textContent = "✎";
    setLabel(els.notesToggleButton, getUiText(context, "notes_title"));
  }
  if (els.playersToggleButton) {
    els.playersToggleButton.textContent = "P";
    setLabel(els.playersToggleButton, getUiText(context, "players_title"));
  }
  if (els.sidebarLegendToggle) {
    els.sidebarLegendToggle.textContent = "‹";
    setLabel(els.sidebarLegendToggle, uiLanguage === "en" ? "Toggle legend" : "Показать или скрыть легенду");
  }
  if (els.favoritesCloseButton) setText(els.favoritesCloseButton, "×");
  if (els.notesCloseButton) setText(els.notesCloseButton, "×");
  if (els.playersCloseButton) setText(els.playersCloseButton, "×");
  if (els.deleteNotesPageButton) setText(els.deleteNotesPageButton, "×");
  if (els.dataQualityCloseButton) setText(els.dataQualityCloseButton, "×");
  if (els.loadingEditorCloseButton) setText(els.loadingEditorCloseButton, "×");
  if (els.panelHandle && !context.panelOpen) els.panelHandle.textContent = "▸";
  if (els.globalSearchInput) els.globalSearchInput.placeholder = getUiText(context, "search_placeholder");

  const mapViewButtons = els.mapViewSwitcher?.querySelectorAll?.("[data-map-view]") || [];
  mapViewButtons.forEach((button) => {
    if (button.dataset.mapView === "author") button.textContent = getUiText(context, "map_view_author");
    if (button.dataset.mapView === "vector") button.textContent = getUiText(context, "map_view_vector");
    if (button.dataset.mapView === "vector-colored") button.textContent = getUiText(context, "map_view_vector_colored");
  });

  const timelineTitle = document.querySelector(".timeline-title");
  setText(timelineTitle, getUiText(context, "mode_timeline"));
  setText(els.timelineSubtitle, getUiText(context, "timeline_subtitle"));
  setText(els.addTimelineActButton, getUiText(context, "timeline_add_act"));
  setText(els.editTimelineActButton, getUiText(context, "timeline_edit_act"));
  setText(els.deleteTimelineActButton, getUiText(context, "timeline_delete_act"));
  setText(els.timelineActImageButton, getUiText(context, "timeline_act_bg_add"));
  if (els.timelineScrollRange) els.timelineScrollRange.setAttribute("aria-label", getUiText(context, "timeline_scroll_aria"));

  setText(els.sidebarLegendTitle, getUiText(context, "sidebar_layers"));
  setText(els.sidebarLegendEditButton, getUiText(context, "sidebar_legend_edit"));
  setText(document.querySelector("#favoritesPanel h3"), getUiText(context, "favorites_title"));
  setText(els.favoritesHint, getUiText(context, "favorites_hint"));
  setText(els.addFavoriteButton, getUiText(context, "favorites_add"));
  setText(document.querySelector("#playersPanel h3"), getUiText(context, "players_title"));
  setText(document.querySelector("#playersPanel .player-popout-copy"), getUiText(context, "players_copy"));
  setText(els.playersEditorHint, getUiText(context, "players_editor_hint"));
  setText(els.addPlayerButton, getUiText(context, "players_add"));
  setText(document.querySelector("#notesPanel h3"), getUiText(context, "notes_title"));
  setText(document.querySelector("#notesPanel .player-popout-copy"), getUiText(context, "notes_copy"));
  if (els.notesTextarea) els.notesTextarea.placeholder = getUiText(context, "notes_placeholder");
  setText(els.notesStatus, getUiText(context, "notes_status"));
  setText(els.clearNotesButton, getUiText(context, "notes_clear"));
  setText(els.panelSubtitle, getUiText(context, "panel_subtitle_default"));
  setText(els.deleteMarkerButton, getUiText(context, "delete_marker"));
  setText(els.panelImageCaption, getUiText(context, "image_caption_placeholder"));
  setText(els.applyImageUrlButton, getUiText(context, "apply_image_url"));
  setText(document.querySelector("label[for='panelImageFileInput']"), getUiText(context, "upload_file"));
  setText(els.linkTimelineEventButton, getUiText(context, "link_timeline"));
  setText(els.linkArchiveItemButton, getUiText(context, "link_archive"));
  setText(els.panelImageHint, getUiText(context, "image_hint"));
  setText(els.panelText, getUiText(context, "panel_text_default"));
  setText(els.panelTimelineEventButton, getUiText(context, "open_timeline_event"));
  setText(els.fact1, getUiText(context, "fact_label_1"));
  setText(els.fact2, getUiText(context, "fact_label_2"));
  setText(els.fact3, getUiText(context, "fact_label_3"));
  setText(document.querySelector(".draw-layer-header"), getUiText(context, "draw_layers_title"));

  const brushLabel = document.querySelector(".draw-tools label");
  if (brushLabel) {
    brushLabel.childNodes[0].textContent = `${getUiText(context, "brush_label")} `;
  }

  if (els.drawBrushColorSelect) {
    const brushOptionLabels = {
      "#7dd3fc": uiLanguage === "en" ? "Ice" : "Ледяной",
      "#60a5fa": uiLanguage === "en" ? "Blue" : "Синий",
      "#fca5a5": uiLanguage === "en" ? "Scarlet" : "Алый",
      "#fbbf24": uiLanguage === "en" ? "Gold" : "Золотой",
      "#86efac": uiLanguage === "en" ? "Green" : "Зелёный",
      "#c4b5fd": uiLanguage === "en" ? "Violet" : "Фиалковый",
      "#f9fafb": uiLanguage === "en" ? "Light" : "Светлый",
    };
    Array.from(els.drawBrushColorSelect.options || []).forEach((option) => {
      option.textContent = brushOptionLabels[option.value] || option.textContent;
    });
  }
}
