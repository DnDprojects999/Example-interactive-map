const MODE_STATE_KEYS = ["timelineMode", "archiveMode", "homebrewMode", "heroesMode"];
const BODY_MODE_CLASSES = ["timeline-mode", "archive-mode", "homebrew-mode", "heroes-mode"];

export function createUiModeController(options) {
  const {
    state,
    getUiText,
    setModeWord,
    setTopModeButton,
    setSidebarTitle,
    togglePanel,
    closeMapTextToolbar,
    setMapEditorControlsVisible,
    refreshEditorActionButtons,
    swapSidebarContent,
    getHomebrewController,
    getRenderMapSidebarButtons,
    getRenderBaseMapMarkers,
    timelineSidebar,
    archiveSidebar,
    archiveController,
    heroesController,
    renderTimeline,
    renderArchive,
    renderHeroes,
  } = options;

  function setExclusiveMode(activeKey = null) {
    MODE_STATE_KEYS.forEach((key) => {
      state[key] = key === activeKey;
    });
  }

  // Body classes power most view-level CSS changes. Keeping them centralized
  // avoids scattered class toggles across unrelated feature modules.
  function setBodyMode(activeClass = null) {
    BODY_MODE_CLASSES.forEach((className) => {
      document.body.classList.toggle(className, className === activeClass);
    });
  }

  function openTimelineMode() {
    setExclusiveMode("timelineMode");
    setModeWord(getUiText("mode_timeline"), false);
    setTopModeButton(getUiText("mode_map"));
    setBodyMode("timeline-mode");
    togglePanel(false);
    heroesController.collapseExpandedCards();
    closeMapTextToolbar();
    setMapEditorControlsVisible(false, false);
    setSidebarTitle(getUiText("sidebar_events"));
    renderTimeline();
    swapSidebarContent(timelineSidebar.renderButtons);
    refreshEditorActionButtons();
    setTimeout(() => setModeWord(getUiText("mode_timeline"), true), 120);
  }

  function openArchiveMode() {
    setExclusiveMode("archiveMode");
    setModeWord(getUiText("mode_archive"), true);
    setTopModeButton(getUiText("mode_map"));
    setBodyMode("archive-mode");
    togglePanel(false);
    closeMapTextToolbar();
    heroesController.collapseExpandedCards();
    setMapEditorControlsVisible(false, false);
    setSidebarTitle(getUiText("sidebar_sections"));
    archiveController.collapseExpandedCards();
    renderArchive();
    swapSidebarContent(archiveSidebar.renderButtons);
    refreshEditorActionButtons();
  }

  function openMapMode() {
    setExclusiveMode(null);
    setModeWord(getUiText("mode_map"), true);
    setTopModeButton(getUiText("mode_timeline"));
    setBodyMode(null);
    togglePanel(false);
    setSidebarTitle(getUiText("sidebar_layers"));
    archiveController.collapseExpandedCards();
    swapSidebarContent(getRenderMapSidebarButtons());
    getRenderBaseMapMarkers()();
    setMapEditorControlsVisible(state.editMode, state.drawMode);
    refreshEditorActionButtons();
  }

  function openHomebrewMode() {
    setExclusiveMode("homebrewMode");
    setModeWord(getUiText("mode_homebrew"), true);
    setTopModeButton(getUiText("mode_map"));
    setBodyMode("homebrew-mode");
    togglePanel(false);
    closeMapTextToolbar();
    archiveController.collapseExpandedCards();
    heroesController.collapseExpandedCards();
    setMapEditorControlsVisible(false, false);
    getHomebrewController().render();
    refreshEditorActionButtons();
  }

  function openHeroesMode() {
    setExclusiveMode("heroesMode");
    setModeWord(getUiText("mode_heroes"), false);
    setBodyMode("heroes-mode");
    togglePanel(false);
    closeMapTextToolbar();
    archiveController.collapseExpandedCards();
    setMapEditorControlsVisible(false, false);
    renderHeroes();
    refreshEditorActionButtons();
  }

  function rerenderCurrentMode() {
    getRenderBaseMapMarkers()();

    if (state.timelineMode) {
      setModeWord(getUiText("mode_timeline"), true);
      setTopModeButton(getUiText("mode_map"));
      renderTimeline();
      setSidebarTitle(getUiText("sidebar_events"));
      swapSidebarContent(timelineSidebar.renderButtons);
    } else if (state.archiveMode) {
      setModeWord(getUiText("mode_archive"), true);
      setTopModeButton(getUiText("mode_map"));
      renderArchive();
      setSidebarTitle(getUiText("sidebar_sections"));
      swapSidebarContent(archiveSidebar.renderButtons);
    } else if (state.homebrewMode) {
      setModeWord(getUiText("mode_homebrew"), true);
      setTopModeButton(getUiText("mode_map"));
      getHomebrewController().render();
    } else if (state.heroesMode) {
      setModeWord(getUiText("mode_heroes"), true);
      renderHeroes();
    } else {
      setModeWord(getUiText("mode_map"), true);
      setTopModeButton(getUiText("mode_timeline"));
      setSidebarTitle(getUiText("sidebar_layers"));
      swapSidebarContent(getRenderMapSidebarButtons());
    }

    refreshEditorActionButtons();
  }

  return {
    openArchiveMode,
    openHeroesMode,
    openHomebrewMode,
    openMapMode,
    openTimelineMode,
    rerenderCurrentMode,
  };
}
