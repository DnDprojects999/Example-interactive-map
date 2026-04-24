export function createUiShellEventsController(options) {
  const {
    els,
    state,
    dataQualityController,
    searchController,
    playerSidebar,
    sidebarLegend,
    mapTextToolbar,
    togglePanel,
    openMapMode,
  } = options;

  function isTypingTarget(target) {
    if (!(target instanceof Element)) return false;
    if (target.closest("#globalSearchPanel")) return false;
    if (target.closest("#dataQualityPanel")) return false;
    return Boolean(
      target.closest("input, textarea, select, [contenteditable='true'], [contenteditable='']")
      || target.matches("input, textarea, select, [contenteditable='true'], [contenteditable='']"),
    );
  }

  function handleEscape() {
    if (!els.dataQualityPanel.hidden) {
      dataQualityController.close();
      return true;
    }

    if (!els.globalSearchPanel.hidden) {
      searchController.close();
      return true;
    }

    if (!els.favoritesPanel.hidden || !els.notesPanel.hidden || !els.playersPanel.hidden) {
      playerSidebar.close();
      return true;
    }

    if (!els.sidebarLegendPanel.hidden) {
      sidebarLegend.close();
      return true;
    }

    if (!els.mapTextToolbar.hidden) {
      mapTextToolbar.close();
      return true;
    }

    if (state.archiveMode || state.timelineMode || state.homebrewMode || state.heroesMode) {
      openMapMode();
      return true;
    }

    if (els.content.classList.contains("panel-open")) {
      togglePanel(false);
      return true;
    }

    return false;
  }

  function setup() {
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (isTypingTarget(event.target)) return;
      if (handleEscape()) event.preventDefault();
    });
  }

  return {
    handleEscape,
    setup,
  };
}
