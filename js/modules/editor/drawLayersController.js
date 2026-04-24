export function createEditorDrawLayersController(options) {
  const {
    els,
    state,
    changesManager,
    getLocalizedText,
    setLocalizedValue,
    buildLocalizedLayerName,
    getDrawLayerFallbackName,
    onRenderGroups,
  } = options;

  function ensureDefaultDrawLayer() {
    if (state.drawLayersData.length > 0) return;
    const localizedName = buildLocalizedLayerName("Контуры", "Contours");
    const defaultLayer = {
      id: "draw-layer-default",
      order: 0,
      strokes: [],
      visible: true,
      ...localizedName,
    };
    state.drawLayersData.push(defaultLayer);
    state.activeDrawLayerId = defaultLayer.id;
  }

  function getActiveDrawLayer() {
    return state.drawLayersData.find((layer) => layer.id === state.activeDrawLayerId) || state.drawLayersData[0] || null;
  }

  function renderDrawLayers() {
    els.drawSvg.innerHTML = "";
    const sortedLayers = [...state.drawLayersData].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    sortedLayers.forEach((layer) => {
      if (layer.visible === false) return;
      (layer.strokes || []).forEach((stroke) => {
        const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
        polyline.setAttribute("points", (stroke.points || []).map((point) => `${point.x},${point.y}`).join(" "));
        polyline.setAttribute("fill", "none");
        polyline.setAttribute("stroke", stroke.color || "#7dd3fc");
        polyline.setAttribute("stroke-width", String(stroke.size || 2));
        polyline.setAttribute("stroke-linecap", "round");
        polyline.setAttribute("stroke-linejoin", "round");
        els.drawSvg.appendChild(polyline);
      });
    });
  }

  function renderDrawLayerPanel() {
    els.drawLayerList.innerHTML = "";
    const sortedLayers = [...state.drawLayersData].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    sortedLayers.forEach((layer, index) => {
      const row = document.createElement("div");
      row.className = "draw-layer-row";

      const nameInput = document.createElement("input");
      nameInput.value = getLocalizedText(layer, "name", layer.name || getDrawLayerFallbackName(index + 1));
      nameInput.className = "draw-layer-name";
      nameInput.addEventListener("input", () => {
        const fallbackName = getDrawLayerFallbackName(index + 1);
        const nextName = nameInput.value.trim() || fallbackName;
        setLocalizedValue(layer, "name", nextName);
        changesManager.upsert("drawLayer", layer.id, layer);
        onRenderGroups?.();
      });

      const selectButton = document.createElement("button");
      selectButton.textContent = state.activeDrawLayerId === layer.id ? "\u2713" : "\u25cf";
      selectButton.addEventListener("click", () => {
        state.activeDrawLayerId = layer.id;
        onRenderGroups?.();
        renderDrawLayerPanel();
      });

      const upButton = document.createElement("button");
      upButton.textContent = "\u2191";
      upButton.disabled = index === 0;
      upButton.addEventListener("click", () => {
        if (index === 0) return;
        const previousLayer = sortedLayers[index - 1];
        const currentOrder = layer.order ?? index;
        layer.order = previousLayer.order ?? (index - 1);
        previousLayer.order = currentOrder;
        changesManager.upsert("drawLayer", layer.id, layer);
        changesManager.upsert("drawLayer", previousLayer.id, previousLayer);
        renderDrawLayers();
        renderDrawLayerPanel();
      });

      const downButton = document.createElement("button");
      downButton.textContent = "\u2193";
      downButton.disabled = index === sortedLayers.length - 1;
      downButton.addEventListener("click", () => {
        if (index === sortedLayers.length - 1) return;
        const nextLayer = sortedLayers[index + 1];
        const currentOrder = layer.order ?? index;
        layer.order = nextLayer.order ?? (index + 1);
        nextLayer.order = currentOrder;
        changesManager.upsert("drawLayer", layer.id, layer);
        changesManager.upsert("drawLayer", nextLayer.id, nextLayer);
        renderDrawLayers();
        renderDrawLayerPanel();
      });

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "\u2715";
      deleteButton.addEventListener("click", () => {
        state.drawLayersData = state.drawLayersData.filter((entry) => entry.id !== layer.id);
        changesManager.remove("drawLayer", layer.id);
        ensureDefaultDrawLayer();
        state.activeDrawLayerId = state.drawLayersData[0]?.id || null;
        onRenderGroups?.();
        renderDrawLayers();
        renderDrawLayerPanel();
      });

      row.append(selectButton, nameInput, upButton, downButton, deleteButton);
      els.drawLayerList.appendChild(row);
    });
  }

  function createDrawLayer() {
    const layerIndex = state.drawLayersData.length + 1;
    const localizedName = buildLocalizedLayerName(`Слой ${layerIndex}`, `Layer ${layerIndex}`);
    const layer = {
      id: `draw-layer-${Date.now()}`,
      order: state.drawLayersData.length,
      strokes: [],
      visible: true,
      ...localizedName,
    };
    state.drawLayersData.push(layer);
    state.activeDrawLayerId = layer.id;
    changesManager.upsert("drawLayer", layer.id, layer);
    onRenderGroups?.();
    renderDrawLayers();
    renderDrawLayerPanel();
  }

  return {
    createDrawLayer,
    ensureDefaultDrawLayer,
    getActiveDrawLayer,
    renderDrawLayerPanel,
    renderDrawLayers,
  };
}
