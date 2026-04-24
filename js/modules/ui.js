import { createArchiveController } from "./archive/archiveController.js";
import {
  createArchiveSidebarController,
  getArchiveShortLabel,
} from "./archive/archiveSidebar.js";
import { setupInlineEditingInteractions } from "./inlineEditing.js";
import { createHeroesController } from "./heroes/heroesController.js";
import { setupHeroInteractions } from "./heroes/heroesInteractions.js";
import { createEditorActionsController } from "./editorActions.js";
import { createDataQualityController } from "./dataQuality.js";
import { createGlobalSearchController } from "./globalSearch.js";
import { setupPanelImageInteractions } from "./panelImages.js";
import { createPanelDetailsController } from "./panelDetails.js";
import { createMapControlsController } from "./mapControls.js";
import { createMapTextToolbarController } from "./mapTextToolbar.js";
import { createPaletteController } from "./paletteControls.js";
import { createSidebarLegendController } from "./sidebarLegend.js";
import { createTimelineSidebarController } from "./timelineSidebar.js";
import { createTimelineActsController } from "./ui/timelineActsController.js";
import { createEditorChromeController } from "./ui/editorChromeController.js";
import { createUiModeController } from "./ui/modeController.js";
import { createUiNavigationController } from "./ui/navigationController.js";
import { createUiReferenceRemapper } from "./ui/referenceRemapper.js";
import { createUiShellScaffoldController } from "./ui/shellScaffoldController.js";
import { createUiShellEventsController } from "./ui/shellEventsController.js";
import { createUiSetupController } from "./ui/setupController.js";
import { createTimelineSurfaceController } from "./ui/timelineSurfaceController.js";
import { syncTimelineTrackAlignment as syncTimelineAxisTrackAlignment } from "./timelineAxis.js";
import { createPlayerSidebarController } from "./players/playerSidebar.js";
import { createHintsController } from "./app/hintsController.js";
import { getUiText } from "./uiLocale.js";

export function createUI(els, state) {
  // These setters are injected later by app.js so UI can coordinate feature
  // modules without hard-coding imports in every direction.
  let renderMapSidebarButtons = () => {};
  let renderBaseMapMarkers = () => {};
  let changeRecorder = {
    upsert: () => {},
    remove: () => {},
  };
  let homebrewController = {
    render: () => {},
    focusArticle: () => {},
  };
  let editorChrome = {
    refreshEditorActionButtons: () => {},
    refreshTopbarActionButtons: () => {},
    setMapEditorControlsVisible: () => {},
    setTopbarSync: () => {},
    setup: () => {},
  };
  let modeController = {
    openArchiveMode: () => {},
    openHeroesMode: () => {},
    openHomebrewMode: () => {},
    openMapMode: () => {},
    openTimelineMode: () => {},
    rerenderCurrentMode: () => {},
  };
  let navigationController = {
    navigateToEntity: () => {},
    updateTimelineCurrentSelection: () => {},
  };
  let referenceRemapper = {
    remapArchiveItemReferences: () => {},
    remapHeroReferences: () => {},
  };
  let shellEvents = {
    handleEscape: () => false,
    setup: () => {},
  };
  let shellScaffold = {
    editLegendGroup: () => {},
    getSuggestedAssetPath: () => "",
    readFileToDataUrl: () => Promise.reject(new Error("Not initialized")),
    setModeWord: () => {},
    setSidebarTitle: () => {},
    setTopModeButton: () => {},
    swapSidebarContent: () => {},
    togglePanel: () => {},
  };
  let timelineSurface = {
    renderTimeline: () => {},
    setup: () => {},
  };
  let mapEditorCallbacks = {
    onCreateRegionLabel: () => {},
    onToggleTextMoveMode: () => {},
    onToggleDrawMode: () => {},
    onTextStyleChange: () => {},
    onBrushChange: () => {},
    onMapViewModeChange: () => {},
  };
  let hintsController = null;
  const mapTextToolbar = createMapTextToolbarController({
    els,
    state,
    getCallbacks: () => mapEditorCallbacks,
  });
  const paletteController = createPaletteController(els, state);
  const sidebarLegend = createSidebarLegendController({
    els,
    state,
    getUiText: (key) => getUiText(state, key),
    onEditGroup: (groupId) => shellScaffold.editLegendGroup(groupId),
  });
  const playerSidebar = createPlayerSidebarController({
    els,
    state,
    getChangeRecorder: () => changeRecorder,
    getUiText: (key, params) => getUiText(state, key, params),
    onNavigate: (target) => navigationController.navigateToEntity(target),
    onPlayersChanged: () => renderHeroes(),
  });
  const timelineSidebar = createTimelineSidebarController({
    els,
    state,
    getChangeRecorder: () => changeRecorder,
    renderTimeline,
  });
  const timelineActs = createTimelineActsController({
    els,
    state,
    readFileToDataUrl: (...args) => shellScaffold.readFileToDataUrl(...args),
    getChangeRecorder: () => changeRecorder,
    navigateToEntity: (target) => navigationController.navigateToEntity(target),
    renderTimeline: () => renderTimeline(),
    renderTimelineSidebarButtons: () => timelineSidebar.renderButtons(),
    updatePanelFromTimelineEvent: (timelineEvent) => panelDetails.updateFromTimelineEvent(timelineEvent),
  });
  const archiveSidebar = createArchiveSidebarController(els, state, {
    onSelectGroup: playerSidebar.setPlayerTarget,
  });
  const archiveController = createArchiveController({
    els,
    state,
    setActiveSidebarGroup: archiveSidebar.setActiveGroup,
    onSelectItem: playerSidebar.setPlayerTarget,
  });
  const heroesController = createHeroesController({
    els,
    state,
    onNavigate: (target) => navigationController.navigateToEntity(target),
    onSelectItem: playerSidebar.setPlayerTarget,
  });
  const searchController = createGlobalSearchController({
    els,
    state,
    onNavigate: (target) => navigationController.navigateToEntity(target),
  });
  const dataQualityController = createDataQualityController({
    els,
    state,
    getUiText: (key, params) => getUiText(state, key, params),
    onNavigate: (target) => navigationController.navigateToEntity(target),
    onHintsEnabledChange: (enabled) => hintsController?.setHintsEnabled(enabled, { silent: true }),
    onResetHints: () => hintsController?.resetProgress(),
    initialHintsEnabled: state.editorHintsEnabled !== false,
  });
  hintsController = createHintsController({
    els,
    state,
    getUiText: (key, params) => getUiText(state, key, params),
    onHintsEnabledChange: (enabled) => dataQualityController.setHintsEnabled(enabled),
  });
  hintsController.setup();
  const editorActions = createEditorActionsController({
    els,
    state,
    generateEntityId,
    getChangeRecorder: () => changeRecorder,
    getMapEditorCallbacks: () => mapEditorCallbacks,
    renderArchive,
    renderArchiveSidebarButtons: archiveSidebar.renderButtons,
    renderHeroes,
    renderTimeline,
    renderTimelineSidebarButtons: timelineSidebar.renderButtons,
    openDataQualityReport: dataQualityController.open,
    getUiText: (key, params) => getUiText(state, key, params),
    reportRuntimeEvent: dataQualityController.reportRuntimeEvent,
  });
  const mapControls = createMapControlsController({
    els,
    state,
    getMapEditorCallbacks: () => mapEditorCallbacks,
    renderArchive,
  });
  const panelDetails = createPanelDetailsController({
    els,
    state,
    getChangeRecorder: () => changeRecorder,
    onSelectTarget: playerSidebar.setPlayerTarget,
    togglePanel: (...args) => shellScaffold.togglePanel(...args),
    setMapEditorControlsVisible: (...args) => editorChrome.setMapEditorControlsVisible(...args),
    refreshEditorActionButtons: () => editorChrome.refreshEditorActionButtons(),
    rerenderMapMarkers: () => renderBaseMapMarkers(),
  });
  const editorShellGrid = els.editorActions?.querySelector?.(".editor-shell-grid") || null;
  const drawLayerOriginalParent = els.drawLayerPanel?.parentElement || null;
  const drawLayerOriginalNextSibling = els.drawLayerPanel?.nextSibling || null;

  function generateEntityId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function setSidebarRenderers({ mapButtonsRenderer, mapMarkersRenderer }) {
    renderMapSidebarButtons = typeof mapButtonsRenderer === "function" ? mapButtonsRenderer : () => {};
    renderBaseMapMarkers = typeof mapMarkersRenderer === "function" ? mapMarkersRenderer : () => {};
  }

  function setupMapEditorCallbacks(callbacks) {
    mapEditorCallbacks = { ...mapEditorCallbacks, ...(callbacks || {}) };
  }

  function normalizeRecorder(recorder) {
    if (typeof recorder === "function") {
      return {
        upsert: recorder,
        remove: () => {},
      };
    }

    return {
      upsert: typeof recorder?.upsert === "function" ? recorder.upsert : () => {},
      remove: typeof recorder?.remove === "function" ? recorder.remove : () => {},
    };
  }

  function setChangeRecorder(recorder) {
    const normalizedRecorder = normalizeRecorder(recorder);

    changeRecorder = {
      upsert: normalizedRecorder.upsert,
      remove: normalizedRecorder.remove,
    };
  }

  function togglePalettePopover(force) {
    paletteController.togglePopover(force);
  }

  function setPalette(paletteName) {
    paletteController.setPalette(paletteName);
  }

  function syncPaletteTheme() {
    paletteController.syncThemeGroup();
  }

  function openMapTextToolbar(label, rect) {
    mapTextToolbar.open(label, rect);
  }

  function closeMapTextToolbar() {
    mapTextToolbar.close();
  }

  function setHomebrewController(controller) {
    homebrewController = controller && typeof controller.render === "function"
      ? controller
      : { render: () => {}, focusArticle: () => {} };
  }

  shellScaffold = createUiShellScaffoldController({
    els,
    state,
    getUiText: (key, params) => getUiText(state, key, params),
    getChangeRecorder: () => changeRecorder,
    getRenderMapSidebarButtons: () => renderMapSidebarButtons,
    getRenderBaseMapMarkers: () => renderBaseMapMarkers,
    onSidebarLegendRender: () => sidebarLegend.render(),
  });

  function getSuggestedAssetPath(filename = "image") {
    return shellScaffold.getSuggestedAssetPath(filename);
  }

  function readFileToDataUrl(...args) {
    return shellScaffold.readFileToDataUrl(...args);
  }

  function togglePanel(force) {
    shellScaffold.togglePanel(force);
  }

  function setModeWord(text, visible) {
    shellScaffold.setModeWord(text, visible);
  }

  function setTopModeButton(label) {
    shellScaffold.setTopModeButton(label);
  }

  function setSidebarTitle(text) {
    shellScaffold.setSidebarTitle(text);
  }

  function swapSidebarContent(renderer) {
    shellScaffold.swapSidebarContent(renderer);
  }

  function syncTimelineTrackAlignment() {
    syncTimelineAxisTrackAlignment(els.timelineContainer);
  }

  function renderTimeline() {
    timelineSurface.renderTimeline();
  }

  function renderArchive() {
    archiveController.render();
  }

  function renderHeroes() {
    heroesController.render();
  }

  editorChrome = createEditorChromeController({
    els,
    state,
    getUiText: (key, params) => getUiText(state, key, params),
    playerSidebar,
    mapControls,
    drawLayerHost: {
      editorShellGrid,
      originalParent: drawLayerOriginalParent,
      originalNextSibling: drawLayerOriginalNextSibling,
    },
  });

  referenceRemapper = createUiReferenceRemapper({
    state,
    playerSidebar,
    getChangeRecorder: () => changeRecorder,
  });

  modeController = createUiModeController({
    state,
    getUiText: (key, params) => getUiText(state, key, params),
    setModeWord,
    setTopModeButton,
    setSidebarTitle,
    togglePanel,
    closeMapTextToolbar,
    setMapEditorControlsVisible: (...args) => editorChrome.setMapEditorControlsVisible(...args),
    refreshEditorActionButtons: () => editorChrome.refreshEditorActionButtons(),
    swapSidebarContent,
    getHomebrewController: () => homebrewController,
    getRenderMapSidebarButtons: () => renderMapSidebarButtons,
    getRenderBaseMapMarkers: () => renderBaseMapMarkers,
    timelineSidebar,
    archiveSidebar,
    archiveController,
    heroesController,
    renderTimeline,
    renderArchive,
    renderHeroes,
  });

  navigationController = createUiNavigationController({
    els,
    state,
    playerSidebar,
    panelDetails,
    archiveController,
    heroesController,
    getHomebrewController: () => homebrewController,
    openMapMode: () => modeController.openMapMode(),
    openTimelineMode: () => modeController.openTimelineMode(),
    openArchiveMode: () => modeController.openArchiveMode(),
    openHeroesMode: () => modeController.openHeroesMode(),
    openHomebrewMode: () => modeController.openHomebrewMode(),
  });

  timelineSurface = createTimelineSurfaceController({
    els,
    state,
    getUiText: (key, params) => getUiText(state, key, params),
    timelineActs,
    timelineSidebar,
    editorActions,
    panelDetails,
    playerSidebar,
    updateSelection: () => navigationController.updateTimelineCurrentSelection(),
    syncTimelineTrackAlignment,
  });

  shellEvents = createUiShellEventsController({
    els,
    state,
    dataQualityController,
    searchController,
    playerSidebar,
    sidebarLegend,
    mapTextToolbar,
    togglePanel,
    openMapMode: () => modeController.openMapMode(),
  });

  function setTopbarSync(syncFn) {
    editorChrome.setTopbarSync(syncFn);
  }

  function refreshTopbarActionButtons() {
    editorChrome.refreshTopbarActionButtons();
  }

  function refreshEditorActionButtons() {
    editorChrome.refreshEditorActionButtons();
  }

  function setMapEditorControlsVisible(visible, drawModeActive) {
    editorChrome.setMapEditorControlsVisible(visible, drawModeActive);
  }

  function remapHeroReferences(...args) {
    referenceRemapper.remapHeroReferences(...args);
  }

  function remapArchiveItemReferences(...args) {
    referenceRemapper.remapArchiveItemReferences(...args);
  }

  function openTimelineMode() {
    modeController.openTimelineMode();
  }

  function openArchiveMode() {
    modeController.openArchiveMode();
  }

  function openMapMode() {
    modeController.openMapMode();
  }

  function openHomebrewMode() {
    modeController.openHomebrewMode();
  }

  function openHeroesMode() {
    modeController.openHeroesMode();
  }

  function rerenderCurrentMode() {
    modeController.rerenderCurrentMode();
  }

  function handleEscape() {
    return shellEvents.handleEscape();
  }

  const setupController = createUiSetupController({
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
    getChangeRecorder: () => changeRecorder,
    getArchiveShortLabel,
    renderTimeline,
    renderArchive,
    renderHeroes,
    remapArchiveItemReferences,
    remapHeroReferences,
    renderTimelineSidebarButtons: timelineSidebar.renderButtons,
    syncTimelineTrackAlignment,
    setupPanelImageInteractions,
    setupInlineEditingInteractions,
    setupHeroInteractions,
  });
  setupController.setup();

  return {
    setHomebrewController,
    setSidebarRenderers,
    setupMapEditorCallbacks,
    setChangeRecorder,
    setPalette,
    syncPaletteTheme,
    togglePalettePopover,
    toggleSidebarLegend: sidebarLegend.toggle,
    closeSidebarLegend: sidebarLegend.close,
    setTopbarSync,
    togglePanel,
    setModeWord,
    refreshEditorActionButtons,
    refreshTopbarActionButtons,
    renderMapViewSwitcher: mapControls.renderViewSwitcher,
    setMapDisplayMode: mapControls.setDisplayMode,
    openTimelineMode,
    openArchiveMode,
    openHomebrewMode,
    openMapMode,
    openHeroesMode,
    handleEscape,
    openMapTextToolbar,
    closeMapTextToolbar,
    setMapEditorControlsVisible,
    updatePanelFromMarker: panelDetails.updateFromMarker,
    updatePanelFromTimelineEvent: panelDetails.updateFromTimelineEvent,
    setPanelEditable: panelDetails.setEditable,
    savePanelToCurrentMarker: panelDetails.saveCurrentMarker,
    renderTimeline,
    renderArchive,
    renderHomebrew: () => homebrewController.render(),
    renderHeroes,
    rerenderCurrentMode,
    refreshInformationCenter: dataQualityController.refresh,
    openInformationCenter: dataQualityController.open,
    reportRuntimeEvent: dataQualityController.reportRuntimeEvent,
    maybeStartViewerHints: () => hintsController?.maybeStartViewerTour(),
    remapArchiveItemReferences,
    remapHeroReferences,
  };
}
