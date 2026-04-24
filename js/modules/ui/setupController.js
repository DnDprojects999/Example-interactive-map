export function createUiSetupController(options) {
  const {
    els,
    state,
    editorChrome,
    mapControls,
    mapTextToolbar,
    paletteController,
    sidebarLegend,
    searchController,
    dataQualityController,
    playerSidebar,
    timelineActs,
    timelineSurface,
    editorActions,
    shellEvents,
    readFileToDataUrl,
    getSuggestedAssetPath,
    getChangeRecorder,
    getArchiveShortLabel,
    renderTimeline,
    renderArchive,
    renderHeroes,
    remapArchiveItemReferences,
    remapHeroReferences,
    renderTimelineSidebarButtons,
    syncTimelineTrackAlignment,
    setupPanelImageInteractions,
    setupInlineEditingInteractions,
    setupHeroInteractions,
  } = options;

  function setup() {
    editorChrome.setup();
    mapControls.setupViewSwitcher();
    mapControls.setDisplayMode(state.mapViewMode || "author", { rerenderArchive: false });
    setupPanelImageInteractions({
      els,
      state,
      readFileToDataUrl,
      getSuggestedAssetPath,
      getChangeRecorder,
    });
    mapTextToolbar.setup();
    mapControls.setupDrawBrushPalette();
    paletteController.setup();
    sidebarLegend.setup();
    searchController.setup();
    dataQualityController.setup();
    playerSidebar.setup();
    timelineActs.setup();
    timelineSurface.setup();
    editorActions.setupButtons();
    setupInlineEditingInteractions({
      els,
      state,
      readFileToDataUrl,
      getChangeRecorder,
      getArchiveShortLabel,
      renderTimeline,
      renderArchive,
      remapArchiveItemReferences,
      renderTimelineSidebarButtons,
      syncTimelineTrackAlignment,
    });
    setupHeroInteractions({
      els,
      state,
      readFileToDataUrl,
      getChangeRecorder,
      remapHeroReferences,
      renderHeroes,
    });
    shellEvents.setup();
  }

  return { setup };
}
