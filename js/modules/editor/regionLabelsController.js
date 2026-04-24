export function createEditorRegionLabelsController(options) {
  const {
    els,
    state,
    ui,
    mapModule,
    changesManager,
    getUiText,
    getLocalizedText,
    setLocalizedValue,
  } = options;

  let interactionsReady = false;

  function renderRegionLabels() {
    els.regionLabelsContainer.innerHTML = "";
    if (!state.regionLabelsVisible && !state.editMode) return;
    state.regionLabelsData.forEach((label) => {
      const element = document.createElement("div");
      element.className = "region-label";
      element.dataset.labelId = label.id;
      element.style.left = `${label.x}%`;
      element.style.top = `${label.y}%`;
      element.style.fontFamily = label.fontFamily || "Cinzel";
      element.style.fontSize = `${label.fontSize || 36}px`;
      element.style.fontWeight = label.bold ? "700" : "500";
      element.style.fontStyle = label.italic ? "italic" : "normal";
      element.style.color = label.color || "#dbeafe";
      element.style.transform = `translate(-50%, -50%) rotate(${label.rotation || 0}deg)`;
      element.textContent = getLocalizedText(label, "text", label.text || getUiText("new_region_label"));
      const textEditable = state.editMode && state.regionTextMode && !state.regionTextMoveMode;
      element.contentEditable = String(textEditable);
      element.classList.toggle("text-editable", textEditable);

      element.addEventListener("input", () => {
        setLocalizedValue(label, "text", element.textContent.trim());
        changesManager.upsert("regionLabel", label.id, label);
      });

      element.addEventListener("click", (event) => {
        event.stopPropagation();
        state.currentRegionLabel = label;
        ui.openMapTextToolbar(label, element.getBoundingClientRect());
      });

      element.addEventListener("dblclick", (event) => {
        if (!state.editMode) return;
        event.stopPropagation();
        state.currentRegionLabel = label;
        state.regionTextMode = true;
        state.regionTextMoveMode = false;
        renderRegionLabels();
        requestAnimationFrame(() => {
          const refreshed = els.regionLabelsContainer.querySelector(`[data-label-id="${label.id}"]`);
          if (!refreshed) return;
          refreshed.focus();
          ui.openMapTextToolbar(label, refreshed.getBoundingClientRect());
        });
      });

      els.regionLabelsContainer.appendChild(element);
    });
  }

  function createRegionLabel() {
    const label = {
      id: `label-${Date.now()}`,
      text: getUiText("new_region_label"),
      x: 50,
      y: 50,
      fontFamily: "Cinzel",
      fontSize: 36,
      rotation: 0,
      color: "#dbeafe",
      bold: false,
      italic: false,
    };
    state.regionLabelsData.push(label);
    state.currentRegionLabel = label;
    state.regionTextMode = true;
    changesManager.upsert("regionLabel", label.id, label);
    renderRegionLabels();
    requestAnimationFrame(() => {
      const labelElement = els.regionLabelsContainer.querySelector(`[data-label-id="${label.id}"]`);
      if (!labelElement) return;
      labelElement.focus();
      const range = document.createRange();
      range.selectNodeContents(labelElement);
      range.collapse(false);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      ui.openMapTextToolbar(label, labelElement.getBoundingClientRect());
    });
  }

  function setupInteractions() {
    if (interactionsReady) return;
    interactionsReady = true;

    els.regionLabelsContainer.addEventListener("pointerdown", (event) => {
      if (!state.editMode) return;
      const targetElement = event.target instanceof Element ? event.target : event.target?.parentElement;
      const labelElement = targetElement?.closest?.(".region-label");
      if (!labelElement) return;
      event.stopPropagation();
      const labelId = labelElement.dataset.labelId;
      const label = state.regionLabelsData.find((entry) => entry.id === labelId);
      if (!label) return;
      state.currentRegionLabel = label;

      const dragEnabled = !state.regionTextMode || state.regionTextMoveMode;
      let hasDragged = false;

      if (dragEnabled) {
        event.preventDefault();
        labelElement.setPointerCapture(event.pointerId);
      }

      const onMove = (moveEvent) => {
        if (!dragEnabled) return;
        const { x, y } = mapModule.getMapPercentFromClient(moveEvent.clientX, moveEvent.clientY);
        hasDragged = true;
        label.x = x;
        label.y = y;
        labelElement.style.left = `${x}%`;
        labelElement.style.top = `${y}%`;
      };

      const releaseHandlers = () => {
        labelElement.removeEventListener("pointermove", onMove);
        labelElement.removeEventListener("pointerup", onEnd);
        labelElement.removeEventListener("pointercancel", onEnd);
      };

      const onEnd = () => {
        releaseHandlers();
        if (dragEnabled && labelElement.hasPointerCapture(event.pointerId)) {
          labelElement.releasePointerCapture(event.pointerId);
        }
        if (hasDragged) changesManager.upsert("regionLabel", label.id, label);
      };

      labelElement.addEventListener("pointermove", onMove);
      labelElement.addEventListener("pointerup", onEnd);
      labelElement.addEventListener("pointercancel", onEnd);

      const openToolbarIfNeeded = () => {
        state.currentRegionLabel = label;
        ui.openMapTextToolbar(label, labelElement.getBoundingClientRect());
      };

      if (!dragEnabled) openToolbarIfNeeded();

      if (dragEnabled) {
        labelElement.addEventListener("pointerup", () => {
          if (!hasDragged) openToolbarIfNeeded();
        }, { once: true });
      }
    });
  }

  return {
    createRegionLabel,
    renderRegionLabels,
    setupInteractions,
  };
}
