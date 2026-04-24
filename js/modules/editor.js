import { clamp } from "./state.js";
import { getLocalizedText, setLocalizedValue } from "./localization.js";
import { getUiText } from "./uiLocale.js";
import { createMapTextureController } from "./editor/mapTextureController.js";
import {
  buildDefaultMarkerFields,
  buildLocalizedLayerName,
  getDrawLayerFallbackName,
} from "./editor/defaults.js";
import { createEditorDrawLayersController } from "./editor/drawLayersController.js";
import { createEditorRegionLabelsController } from "./editor/regionLabelsController.js";
import { createEditorSidebarController } from "./editor/sidebarController.js";
import { createEditorStatusController } from "./editor/statusController.js";
import {
  resolveFactionMarkerSymbolLabel,
  resolveFactionMarkerSymbolUrl,
} from "./factionSymbols.js";

// Main map editor coordinator: marker layers, region labels, draw layers, and
// edit-mode access rules all meet here.
export function createEditorModule(els, state, ui, mapModule, changesManager) {
  if (!state.mapTextureByType || typeof state.mapTextureByType !== "object") {
    state.mapTextureByType = {};
  }

  const getEditorText = (key, params) => getUiText(state, key, params);
  const localizeText = (entity, field, fallback) => getLocalizedText(entity, field, state, fallback);
  const setLocalizedField = (entity, field, value) => setLocalizedValue(entity, field, value, state);

  function hasEditorAccess() {
    // Localhost is always trusted for convenience. Public editor access is a
    // deliberate project-level opt-in from index.html.
    try {
      const hostname = window.location.hostname;
      const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
      if (isLocalHost) return true;
      return window.SERKONIA_CONFIG?.publicEditorAccess === true;
    } catch (error) {
      return false;
    }
  }

  function readFileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error(getEditorText("editor_texture_read_error")));
      reader.readAsDataURL(file);
    });
  }

  const mapTextureController = createMapTextureController({
    els,
    state,
    changesManager,
    readFileToDataUrl,
  });
  const statusController = createEditorStatusController({
    els,
    getUiText: getEditorText,
  });

  let sidebarController = null;
  const drawLayersController = createEditorDrawLayersController({
    els,
    state,
    changesManager,
    getLocalizedText: localizeText,
    setLocalizedValue: setLocalizedField,
    buildLocalizedLayerName: (baseRu, baseEn) => buildLocalizedLayerName(state.worldData, baseRu, baseEn),
    getDrawLayerFallbackName: (index) => getDrawLayerFallbackName(state, index),
    onRenderGroups: () => sidebarController?.renderGroups(),
  });
  const regionLabelsController = createEditorRegionLabelsController({
    els,
    state,
    ui,
    mapModule,
    changesManager,
    getUiText: getEditorText,
    getLocalizedText: localizeText,
    setLocalizedValue: setLocalizedField,
  });
  sidebarController = createEditorSidebarController({
    els,
    state,
    ui,
    getUiText: getEditorText,
    getLocalizedText: localizeText,
    getDrawLayerFallbackName: (index) => getDrawLayerFallbackName(state, index),
    createDrawLayer: () => drawLayersController.createDrawLayer(),
    renderDrawLayers: () => drawLayersController.renderDrawLayers(),
    renderDrawLayerPanel: () => drawLayersController.renderDrawLayerPanel(),
    renderRegionLabels: () => regionLabelsController.renderRegionLabels(),
  });

  function rerenderCurrentMode() {
    // Editor changes can affect multiple fullscreen modes, so this helper
    // refreshes only the one currently visible to the user.
    renderMarkers();
    if (state.timelineMode) ui.renderTimeline();
    if (state.archiveMode) ui.renderArchive();
    if (state.heroesMode) ui.renderHeroes();
  }

  function createDefaultMarker(x, y) {
    return {
      id: `marker-${Date.now()}`,
      group: state.editorGroupId || state.groupsData[0]?.id || "cities",
      x,
      y,
      imageUrl: "",
      ...buildDefaultMarkerFields(state.worldData),
    };
  }

  function createMarkerElement(marker, groupsById) {
    const markerElement = document.createElement("button");
    markerElement.className = "marker";
    markerElement.dataset.group = marker.group;
    if (marker.id) markerElement.dataset.markerId = marker.id;
    markerElement.style.left = `${marker.x}%`;
    markerElement.style.top = `${marker.y}%`;

    const group = groupsById.get(marker.group);
    if (group?.color) markerElement.style.background = group.color;
    const symbolUrl = resolveFactionMarkerSymbolUrl(state.archiveData, marker);
    if (symbolUrl) {
      markerElement.classList.add("marker-symbolic");
      const symbol = document.createElement("img");
      symbol.className = "marker-symbol-image";
      symbol.src = symbolUrl;
      symbol.alt = resolveFactionMarkerSymbolLabel(state.archiveData, marker);
      symbol.loading = "lazy";
      symbol.decoding = "async";
      markerElement.appendChild(symbol);
    }

    if (!state.editMode && group?.enabled === false) {
      markerElement.classList.add("hidden");
    }

    const nameElement = document.createElement("span");
    nameElement.className = "marker-name";
    nameElement.textContent = localizeText(marker, "title", "Метка");
    markerElement.appendChild(nameElement);

    markerElement.addEventListener("click", (event) => {
      if (state.editMode && event.altKey) {
        state.markersData = state.markersData.filter((entry) => entry !== marker);
        if (marker.id) changesManager.remove("marker", marker.id);
        renderMarkers();
        statusController.showMarkerDeletedStatus();
        return;
      }
      ui.updatePanelFromMarker(marker);
    });

    markerElement.addEventListener("pointerdown", (event) => {
      if (!state.editMode) return;
      event.stopPropagation();
      markerElement.setPointerCapture(event.pointerId);

      // Update marker coordinates directly in map percentages so saved JSON
      // stays resolution-independent instead of depending on DOM pixels.
      const dragMove = (moveEvent) => {
        const { x, y } = mapModule.getMapPercentFromClient(moveEvent.clientX, moveEvent.clientY);
        marker.x = x;
        marker.y = y;
        markerElement.style.left = `${marker.x}%`;
        markerElement.style.top = `${marker.y}%`;
      };

      const dragEnd = () => {
        if (marker.id) changesManager.upsert("marker", marker.id, marker);
        markerElement.removeEventListener("pointermove", dragMove);
        markerElement.removeEventListener("pointerup", dragEnd);
        markerElement.removeEventListener("pointercancel", dragEnd);
      };

      markerElement.addEventListener("pointermove", dragMove);
      markerElement.addEventListener("pointerup", dragEnd);
      markerElement.addEventListener("pointercancel", dragEnd);
    });

    return markerElement;
  }

  function renderMarkers() {
    els.markersContainer.innerHTML = "";
    const groupsById = new Map(state.groupsData.map((group) => [group.id, group]));
    const fragment = document.createDocumentFragment();
    state.markersData.forEach((marker) => {
      fragment.appendChild(createMarkerElement(marker, groupsById));
    });
    els.markersContainer.appendChild(fragment);
  }

  function toggleEditMode(force) {
    const nextEditMode = typeof force === "boolean" ? force : !state.editMode;
    if (nextEditMode && !hasEditorAccess()) return;

    state.editMode = nextEditMode;
    document.body.classList.toggle("edit-mode", state.editMode);

    if (!state.editorGroupId && state.groupsData.length > 0) {
      state.editorGroupId = state.groupsData[0].id;
    }
    if (!state.editMode) {
      state.regionTextMode = false;
      state.regionTextMoveMode = false;
    }

    mapTextureController.updateMapTextureButtonLabel();
    els.deleteMarkerButton.hidden = !state.editMode;
    els.addPaletteButton.hidden = !state.editMode;
    ui.setPanelEditable(state.editMode);
    ui.refreshTopbarActionButtons();
    document.dispatchEvent(new CustomEvent("serkonia:edit-mode-changed"));
    ui.setMapEditorControlsVisible(
      state.editMode && !state.timelineMode && !state.archiveMode && !state.heroesMode,
      state.drawMode,
    );

    if (!state.editMode) {
      state.drawMode = false;
      ui.closeMapTextToolbar();
    }
    sidebarController.renderGroups();
    regionLabelsController.renderRegionLabels();
    rerenderCurrentMode();
    drawLayersController.renderDrawLayerPanel();
    mapTextureController.applyTextureForCurrentMapMode();
    sidebarController.refreshGroupButtonsSelection();

    if (state.editMode) {
      els.panelSubtitle.textContent = getEditorText("editor_mode_enabled");
      els.panelText.textContent = getEditorText("editor_map_hint");
    }
  }

  function exportWorldChangesJson() {
    changesManager.download("changes.json");
  }

  function deleteCurrentMarker() {
    if (!state.editMode || !state.currentMarker) return;

    const markerToDelete = state.currentMarker;
    state.markersData = state.markersData.filter((marker) => marker !== markerToDelete);
    if (markerToDelete.id) changesManager.remove("marker", markerToDelete.id);
    state.currentMarker = null;
    renderMarkers();
    statusController.showMarkerDeletedStatus();
  }

  function setupEditorInteractions() {
    let drawingStroke = null;

    drawLayersController.ensureDefaultDrawLayer();
    sidebarController.renderGroups();
    drawLayersController.renderDrawLayers();
    regionLabelsController.renderRegionLabels();
    drawLayersController.renderDrawLayerPanel();
    regionLabelsController.setupInteractions();
    mapTextureController.applyTextureForCurrentMapMode();
    mapTextureController.updateMapTextureButtonLabel();

    ui.setupMapEditorCallbacks({
      onCreateRegionLabel: () => regionLabelsController.createRegionLabel(),
      onToggleTextMoveMode: () => {
        state.regionTextMode = true;
        state.regionTextMoveMode = !state.regionTextMoveMode;
        regionLabelsController.renderRegionLabels();
        ui.setMapEditorControlsVisible(
          state.editMode && !state.timelineMode && !state.archiveMode && !state.heroesMode,
          state.drawMode,
        );
        els.panelSubtitle.textContent = state.regionTextMoveMode
          ? getEditorText("editor_text_move_enabled")
          : getEditorText("editor_text_edit_enabled");
      },
      onToggleDrawMode: () => {
        state.drawMode = !state.drawMode;
        ui.setMapEditorControlsVisible(
          state.editMode && !state.timelineMode && !state.archiveMode && !state.heroesMode,
          state.drawMode,
        );
      },
      onTextStyleChange: (patch) => {
        if (!state.currentRegionLabel) return;
        if (typeof patch.x === "number") patch.x = clamp(patch.x, 0, 100);
        if (typeof patch.y === "number") patch.y = clamp(patch.y, 0, 100);
        Object.assign(state.currentRegionLabel, patch);
        changesManager.upsert("regionLabel", state.currentRegionLabel.id, state.currentRegionLabel);
        regionLabelsController.renderRegionLabels();
      },
      onBrushChange: ({ color, size }) => {
        if (color) state.drawBrushColor = color;
        if (typeof size === "number") state.drawBrushSize = size;
      },
      onMapViewModeChange: () => {
        mapTextureController.applyTextureForCurrentMapMode();
        mapTextureController.updateMapTextureButtonLabel();
        regionLabelsController.renderRegionLabels();
      },
    });

    // Map clicks create markers only in edit mode so regular browsing stays safe.
    els.mapStage.addEventListener("click", (event) => {
      if (!state.editMode) return;
      const eventTarget = event.target instanceof Element ? event.target : null;
      if (eventTarget?.closest(".region-label")) return;
      if (state.drawMode || state.regionTextMode) return;
      if (eventTarget?.closest(".marker")) return;

      const { x, y } = mapModule.getMapPercentFromClient(event.clientX, event.clientY);
      const marker = createDefaultMarker(x, y);

      state.markersData.push(marker);
      changesManager.upsert("marker", marker.id, marker);
      renderMarkers();
      ui.updatePanelFromMarker(marker);
    });

    els.mapStage.addEventListener("pointerdown", (event) => {
      if (!state.editMode || !state.drawMode) return;
      if (event.target.closest(".marker") || event.target.closest(".region-label")) return;
      const activeLayer = drawLayersController.getActiveDrawLayer();
      if (!activeLayer) return;
      const start = mapModule.getMapPercentFromClient(event.clientX, event.clientY);
      drawingStroke = {
        id: `stroke-${Date.now()}`,
        color: state.drawBrushColor,
        size: state.drawBrushSize,
        points: [start],
      };
      activeLayer.strokes = Array.isArray(activeLayer.strokes) ? activeLayer.strokes : [];
      activeLayer.strokes.push(drawingStroke);
      drawLayersController.renderDrawLayers();
    });

    els.mapStage.addEventListener("pointermove", (event) => {
      if (!state.editMode || !state.drawMode || !drawingStroke) return;
      drawingStroke.points.push(mapModule.getMapPercentFromClient(event.clientX, event.clientY));
      drawLayersController.renderDrawLayers();
    });

    const finishStroke = () => {
      if (!drawingStroke) return;
      const activeLayer = drawLayersController.getActiveDrawLayer();
      if (activeLayer?.id) changesManager.upsert("drawLayer", activeLayer.id, activeLayer);
      drawingStroke = null;
    };

    els.mapStage.addEventListener("pointerup", finishStroke);
    els.mapStage.addEventListener("pointercancel", finishStroke);

    els.exportDataButton.addEventListener("click", exportWorldChangesJson);
    els.uploadMapTextureButton.addEventListener("click", () => els.mapTextureInput.click());
    els.mapTextureInput.addEventListener("change", async (event) => {
      const [file] = event.target.files || [];
      try {
        await mapTextureController.handleMapTextureSelection(file);
      } catch (error) {
        console.error(error);
      }
      event.target.value = "";
    });

    document.addEventListener("keydown", (event) => {
      if (event.ctrlKey && event.shiftKey && event.code === "Backquote") {
        if (!hasEditorAccess()) return;
        event.preventDefault();
        toggleEditMode();
      }
    });
  }

  return {
    renderGroups: () => sidebarController.renderGroups(),
    renderMarkers,
    renderRegionLabels: () => regionLabelsController.renderRegionLabels(),
    renderDrawLayers: () => drawLayersController.renderDrawLayers(),
    toggleEditMode,
    setupEditorInteractions,
    deleteCurrentMarker,
  };
}
