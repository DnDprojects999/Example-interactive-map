export function createEditorSidebarController(options) {
  const {
    els,
    state,
    ui,
    getUiText,
    getLocalizedText,
    getDrawLayerFallbackName,
    createDrawLayer,
    renderDrawLayers,
    renderDrawLayerPanel,
    renderRegionLabels,
  } = options;

  function refreshGroupButtonsSelection() {
    const buttons = els.toolButtonsContainer.querySelectorAll(".tool-btn");
    buttons.forEach((button) => {
      button.classList.toggle("editor-target", state.editMode && button.dataset.group === state.editorGroupId);
    });
  }

  function refreshDrawLayerButtonsSelection() {
    const buttons = els.toolButtonsContainer.querySelectorAll(".tool-btn[data-draw-layer-id]");
    buttons.forEach((button) => {
      button.classList.toggle("editor-target", state.editMode && button.dataset.drawLayerId === state.activeDrawLayerId);
    });
  }

  function renderGroups() {
    els.toolButtonsContainer.innerHTML = "";

    state.groupsData.forEach((group) => {
      const localizedName = getLocalizedText(group, "name", group.name || "Слой карты");
      const localizedShort = getLocalizedText(group, "short", group.short || "?");
      const button = document.createElement("button");
      button.className = `tool-btn ${group.enabled ? "active" : ""}`;
      button.dataset.group = group.id;
      button.dataset.groupId = group.id;
      button.dataset.label = localizedName;
      button.dataset.badge = localizedShort;
      button.dataset.color = group.color || "";
      if (group.color) button.style.setProperty("--tool-accent", group.color);
      button.textContent = localizedShort;
      button.title = localizedName || "Слой карты";
      button.dataset.label = localizedName || "Слой карты";
      button.dataset.badge = localizedShort || "?";
      button.addEventListener("click", () => {
        if (state.editMode) {
          state.editorGroupId = group.id;
          refreshGroupButtonsSelection();
          els.panelSubtitle.textContent = getUiText("editor_selected_layer", {
            name: localizedName || "Layer",
          });
          return;
        }

        group.enabled = !group.enabled;
        button.classList.toggle("active", group.enabled);

        const relatedMarkers = els.markersContainer.querySelectorAll(`[data-group="${group.id}"]`);
        relatedMarkers.forEach((markerElement) => markerElement.classList.toggle("hidden", !group.enabled));
      });

      els.toolButtonsContainer.appendChild(button);
    });

    const labelsButton = document.createElement("button");
    labelsButton.className = `tool-btn ${state.regionLabelsVisible ? "active" : ""}`;
    labelsButton.style.setProperty("--tool-accent", "rgba(226,232,240,.42)");
    labelsButton.dataset.badge = getUiText("territory_labels_badge");
    labelsButton.dataset.label = getUiText("territory_labels");
    labelsButton.title = state.editMode
      ? getUiText("territory_labels_edit")
      : getUiText("territory_labels_toggle");
    labelsButton.textContent = getUiText("territory_labels_badge");
    labelsButton.addEventListener("click", () => {
      if (state.editMode) {
        state.regionTextMode = !state.regionTextMode;
        if (!state.regionTextMode) state.regionTextMoveMode = false;
        labelsButton.classList.toggle("active", state.regionTextMode);
        els.panelSubtitle.textContent = state.regionTextMode
          ? getUiText("territory_labels_edit")
          : getUiText("editor_mode_enabled");
        renderRegionLabels();
        return;
      }

      state.regionLabelsVisible = !state.regionLabelsVisible;
      labelsButton.classList.toggle("active", state.regionLabelsVisible);
      renderRegionLabels();
    });
    els.toolButtonsContainer.appendChild(labelsButton);

    state.drawLayersData.forEach((layer, index) => {
      const layerButton = document.createElement("button");
      layerButton.className = `tool-btn ${layer.visible !== false ? "active" : ""}`;
      layerButton.dataset.drawLayerId = layer.id;
      const fallbackLayerName = getDrawLayerFallbackName(index + 1);
      const localizedLayerName = getLocalizedText(layer, "name", layer.name || fallbackLayerName);
      layerButton.dataset.label = localizedLayerName;
      layerButton.title = localizedLayerName;
      layerButton.textContent = "\u25cf";
      layerButton.dataset.badge = "\u25cf";
      layerButton.dataset.label = localizedLayerName;
      layerButton.addEventListener("click", () => {
        if (state.editMode) {
          state.activeDrawLayerId = layer.id;
          state.drawMode = true;
          ui.setMapEditorControlsVisible(true, true);
          els.panelSubtitle.textContent = getUiText("draw_layer_selected", { name: localizedLayerName });
          refreshDrawLayerButtonsSelection();
          return;
        }

        layer.visible = layer.visible === false;
        renderDrawLayers();
        renderGroups();
      });
      els.toolButtonsContainer.appendChild(layerButton);
    });

    if (state.editMode) {
      const addLayerButton = document.createElement("button");
      addLayerButton.className = "tool-btn";
      addLayerButton.dataset.badge = "+";
      addLayerButton.dataset.label = getUiText("draw_layer_new");
      addLayerButton.title = getUiText("draw_layer_new");
      addLayerButton.textContent = "+";
      addLayerButton.dataset.label = getUiText("draw_layer_new");
      addLayerButton.addEventListener("click", () => {
        createDrawLayer();
      });
      els.toolButtonsContainer.appendChild(addLayerButton);
    }

    refreshGroupButtonsSelection();
    refreshDrawLayerButtonsSelection();
    renderDrawLayerPanel();
  }

  return {
    refreshDrawLayerButtonsSelection,
    refreshGroupButtonsSelection,
    renderGroups,
  };
}
