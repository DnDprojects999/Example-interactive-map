export function createEditorChromeController(options) {
  const {
    els,
    state,
    getUiText,
    playerSidebar,
    mapControls,
    drawLayerHost,
  } = options;

  let syncTopbar = () => {};

  function syncShellExpandedState(expanded) {
    document.body.classList.toggle("editor-shell-collapsed", !expanded);
    if (!els.editorShellToggleButton) return;
    els.editorShellToggleButton.setAttribute("aria-expanded", expanded ? "true" : "false");
    els.editorShellToggleButton.textContent = expanded ? "\u25be" : "\u25b4";
    els.editorShellToggleButton.title = getUiText(expanded ? "editor_shell_collapse" : "editor_shell_expand");
  }

  function syncDrawLayerPanelHost(visible, drawModeActive) {
    if (!els.drawLayerPanel) return;
    const inline = Boolean(visible && drawModeActive && drawLayerHost.editorShellGrid);

    if (inline) {
      if (els.drawLayerPanel.parentElement !== drawLayerHost.editorShellGrid) {
        const mapSection = els.editorMapSection || null;
        const anchor = mapSection?.nextElementSibling || null;
        if (anchor) drawLayerHost.editorShellGrid.insertBefore(els.drawLayerPanel, anchor);
        else drawLayerHost.editorShellGrid.appendChild(els.drawLayerPanel);
      }
      els.drawLayerPanel.classList.add("draw-layer-panel-inline");
      els.drawLayerPanel.hidden = false;
      return;
    }

    if (drawLayerHost.originalParent && els.drawLayerPanel.parentElement !== drawLayerHost.originalParent) {
      if (
        drawLayerHost.originalNextSibling
        && drawLayerHost.originalNextSibling.parentNode === drawLayerHost.originalParent
      ) {
        drawLayerHost.originalParent.insertBefore(els.drawLayerPanel, drawLayerHost.originalNextSibling);
      } else {
        drawLayerHost.originalParent.appendChild(els.drawLayerPanel);
      }
    }
    els.drawLayerPanel.classList.remove("draw-layer-panel-inline");
    els.drawLayerPanel.hidden = true;
  }

  function refreshTopbarActionButtons() {
    // The same topbar shell is reused by multiple modes, so this function is
    // the single place that decides which controls are relevant right now.
    if (els.homebrewOpenButton) {
      els.homebrewOpenButton.classList.toggle("active", Boolean(state.homebrewMode));
    }
    els.renameWorldButton.hidden = !state.editMode;
    playerSidebar.renderFavorites();
    playerSidebar.renderPlayers();
    els.mapReturnButton.hidden = true;
    const inHomebrew = Boolean(state.homebrewMode);
    const inMap = !state.timelineMode
      && !state.archiveMode
      && !state.homebrewMode
      && !state.heroesMode;
    if (els.mapViewEditorTools) els.mapViewEditorTools.hidden = !state.editMode || !inMap;
    els.uploadMapTextureButton.hidden = !state.editMode || state.timelineMode || state.archiveMode || state.homebrewMode || state.heroesMode;
    els.exportDataButton.hidden = !state.editMode || state.homebrewMode;
    els.importDataButton.hidden = !state.editMode || state.homebrewMode;
    mapControls.renderViewSwitcher();
    if (els.mapViewSwitcher && inHomebrew) els.mapViewSwitcher.hidden = true;
    syncTopbar();
  }

  function refreshEditorActionButtons() {
    // Editor actions are mode-specific. Instead of maintaining separate toolbars
    // per section, we reveal only the actions that make sense in the current mode.
    const editEnabled = state.editMode;
    const inTimeline = editEnabled && state.timelineMode;
    const inArchive = editEnabled && state.archiveMode;
    const inHeroes = editEnabled && state.heroesMode;
    const inHomebrew = editEnabled && state.homebrewMode;
    const inMap = editEnabled
      && !state.timelineMode
      && !state.archiveMode
      && !state.homebrewMode
      && !state.heroesMode;

    if (els.editorActions) els.editorActions.classList.toggle("editor-shell-draw-mode", Boolean(inMap && state.drawMode));
    if (drawLayerHost.editorShellGrid) {
      drawLayerHost.editorShellGrid.classList.toggle("editor-shell-grid-draw", Boolean(inMap && state.drawMode));
    }
    els.editorActions.hidden = !editEnabled || inHomebrew || inHeroes;
    els.addRegionLabelButton.hidden = !inMap || Boolean(state.drawMode);
    els.toggleTextMoveModeButton.hidden = true;
    els.toggleDrawModeButton.hidden = !inMap;
    els.editLoadingScreenButton.hidden = !editEnabled;
    els.previewLoadingScreenButton.hidden = !editEnabled;
    if (els.uploadLoadingScreenImageButton) els.uploadLoadingScreenImageButton.hidden = !editEnabled;
    if (els.uploadFaviconButton) els.uploadFaviconButton.hidden = !editEnabled;
    els.addTimelineEventButton.hidden = !inTimeline;
    els.addArchiveGroupButton.hidden = !inArchive;
    els.addArchiveItemButton.hidden = !inArchive;
    els.addHeroGroupButton.hidden = !inHeroes;
    els.addHeroCardButton.hidden = !inHeroes;
    els.validateDataButton.hidden = !editEnabled;
    if (els.openRuntimeLogsButton) els.openRuntimeLogsButton.hidden = !editEnabled;
    if (els.openRuntimeNotificationsButton) els.openRuntimeNotificationsButton.hidden = !editEnabled;
    if (els.toggleEditorHintsButton) els.toggleEditorHintsButton.hidden = !editEnabled;
    if (els.editorManageMapViewsButton) els.editorManageMapViewsButton.hidden = true;
    if (els.editorToggleMapViewSwitcherButton) {
      els.editorToggleMapViewSwitcherButton.hidden = true;
      els.editorToggleMapViewSwitcherButton.textContent = getUiText(
        state.worldData?.mapViewSwitcherVisible === false ? "map_views_show_for_users" : "map_views_hide_for_users",
      );
    }
    if (els.editorUploadMapTextureButton) els.editorUploadMapTextureButton.hidden = true;
    if (els.editorExportDataButton) els.editorExportDataButton.hidden = true;
    if (els.editorImportDataButton) els.editorImportDataButton.hidden = true;
    if (els.editorLegendButton) els.editorLegendButton.hidden = !inMap || Boolean(state.drawMode);
    if (els.editorAddTimelineActButton) {
      els.editorAddTimelineActButton.hidden = !inTimeline || Boolean(els.addTimelineActButton?.hidden);
    }
    if (els.editorEditTimelineActButton) {
      els.editorEditTimelineActButton.hidden = !inTimeline || Boolean(els.editTimelineActButton?.hidden);
    }
    if (els.editorDeleteTimelineActButton) {
      els.editorDeleteTimelineActButton.hidden = !inTimeline || Boolean(els.deleteTimelineActButton?.hidden);
    }
    if (els.editorTimelineBackdropButton) {
      els.editorTimelineBackdropButton.hidden = !inTimeline || Boolean(els.timelineActImageButton?.hidden);
      if (!els.editorTimelineBackdropButton.hidden) {
        els.editorTimelineBackdropButton.textContent = els.timelineActImageButton.textContent;
      }
    }
    if (els.editorAddHomebrewCategoryButton) els.editorAddHomebrewCategoryButton.hidden = !inHomebrew;
    if (els.editorAddHomebrewArticleButton) els.editorAddHomebrewArticleButton.hidden = !inHomebrew;
    if (els.editorDiagnosticsSection) els.editorDiagnosticsSection.hidden = !editEnabled;
    if (els.editorWorldSection) els.editorWorldSection.hidden = !inMap || Boolean(state.drawMode);
    if (els.editorMapSection) {
      els.editorMapSection.hidden = !inMap;
      els.editorMapSection.classList.toggle("editor-shell-section-draw-host", Boolean(inMap && state.drawMode));
    }
    if (els.editorTimelineSection) els.editorTimelineSection.hidden = !inTimeline;
    if (els.editorArchiveSection) els.editorArchiveSection.hidden = !inArchive;
    if (els.editorHeroesSection) els.editorHeroesSection.hidden = !inHeroes;
    if (els.editorHomebrewSection) els.editorHomebrewSection.hidden = true;
    if (els.homebrewEditorTools) els.homebrewEditorTools.hidden = !inHomebrew;
    if (els.heroesEditorTools) els.heroesEditorTools.hidden = !inHeroes;
    if (els.editorHeroesSection) els.editorHeroesSection.hidden = true;
    refreshTopbarActionButtons();
  }

  function setMapEditorControlsVisible(visible, drawModeActive) {
    syncDrawLayerPanelHost(visible, drawModeActive);
    els.toggleDrawModeButton.classList.toggle("active", Boolean(drawModeActive));
    els.toggleTextMoveModeButton.classList.remove("active");
    refreshEditorActionButtons();
  }

  function setTopbarSync(syncFn) {
    syncTopbar = typeof syncFn === "function" ? syncFn : () => {};
  }

  function setup() {
    syncShellExpandedState(true);
    els.editorShellToggleButton?.addEventListener("click", () => {
      const expanded = !document.body.classList.contains("editor-shell-collapsed");
      syncShellExpandedState(!expanded);
    });
  }

  return {
    refreshTopbarActionButtons,
    refreshEditorActionButtons,
    setMapEditorControlsVisible,
    setTopbarSync,
    setup,
    syncShellExpandedState,
  };
}
