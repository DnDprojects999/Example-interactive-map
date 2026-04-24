import { setLocalizedValue } from "./localization.js";

export function createPanelDetailsEditingController(options) {
  const {
    els,
    state,
    getRecorder,
    getCurrentPanelRecord,
    refreshArchiveLinkButton,
    refreshTimelineLinkButtons,
    setMapEditorControlsVisible,
    refreshEditorActionButtons,
  } = options;

  const editablePanelFields = [
    els.panelTitle,
    els.panelSubtitle,
    els.panelImageCaption,
    els.panelText,
    els.fact1,
    els.fact2,
    els.fact3,
  ];

  function setEditable(enabled) {
    editablePanelFields.forEach((element) => {
      element.contentEditable = String(enabled);
    });
    els.timelineContainer.querySelectorAll(".event-year, .event-title, .event-text").forEach((element) => {
      element.contentEditable = String(enabled);
    });
    els.archiveGroupsContainer
      .querySelectorAll(".archive-group-title, .archive-card-title, .archive-card-text, .archive-expanded-title, .archive-expanded-text")
      .forEach((element) => {
        element.contentEditable = String(enabled);
      });
    els.heroesGroupsContainer
      .querySelectorAll(".heroes-group-title, .heroes-group-subtitle, .hero-card-title, .hero-card-role, .hero-card-text, .hero-expanded-title, .hero-expanded-role, .hero-expanded-text")
      .forEach((element) => {
        element.contentEditable = String(enabled);
      });
    els.panelImageControls.hidden = !enabled;
    refreshArchiveLinkButton();
    refreshTimelineLinkButtons();
    setMapEditorControlsVisible(enabled && !state.timelineMode && !state.archiveMode && !state.heroesMode, state.drawMode);
    refreshEditorActionButtons();
  }

  function saveCurrentMarker() {
    const entity = state.currentPanelEntity?.entity || "marker";
    const currentRecord = getCurrentPanelRecord();
    if (!state.editMode || !currentRecord) return;

    if (entity === "timelineEvent") {
      setLocalizedValue(currentRecord, "title", els.panelTitle.textContent.trim(), state);
      setLocalizedValue(currentRecord, "year", els.panelSubtitle.textContent.trim(), state);
      currentRecord.imageUrl = els.panelImageUrlInput.value.trim();
      setLocalizedValue(currentRecord, "imageText", els.panelImageCaption.textContent.trim(), state);
      setLocalizedValue(currentRecord, "fullDescription", els.panelText.textContent.trim(), state);
      setLocalizedValue(
        currentRecord,
        "facts",
        [els.fact1.textContent.trim(), els.fact2.textContent.trim(), els.fact3.textContent.trim()],
        state,
      );
      if (currentRecord.id) getRecorder().upsert("timelineEvent", currentRecord.id, currentRecord);
      return;
    }

    setLocalizedValue(state.currentMarker, "title", els.panelTitle.textContent.trim(), state);
    setLocalizedValue(state.currentMarker, "type", els.panelSubtitle.textContent.trim(), state);
    state.currentMarker.imageUrl = els.panelImageUrlInput.value.trim();
    setLocalizedValue(state.currentMarker, "imageText", els.panelImageCaption.textContent.trim(), state);
    setLocalizedValue(state.currentMarker, "description", els.panelText.textContent.trim(), state);
    setLocalizedValue(
      state.currentMarker,
      "facts",
      [els.fact1.textContent.trim(), els.fact2.textContent.trim(), els.fact3.textContent.trim()],
      state,
    );
    if (state.currentMarker.id) getRecorder().upsert(entity, state.currentMarker.id, state.currentMarker);
  }

  return {
    saveCurrentMarker,
    setEditable,
  };
}
