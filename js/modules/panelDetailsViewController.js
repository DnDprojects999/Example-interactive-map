import { updatePanelImageView } from "./panelImages.js";
import { getLocalizedText, getLocalizedValue } from "./localization.js";
import { getUiText } from "./uiLocale.js";

export function createPanelDetailsViewController(options) {
  const {
    els,
    state,
    onSelectTarget,
    togglePanel,
    refreshArchiveLinkButton,
    refreshTimelineLinkButtons,
  } = options;

  function getCurrentPanelRecord() {
    if (state.currentPanelEntity?.entity === "timelineEvent") return state.currentTimelineEvent;
    return state.currentMarker;
  }

  function applyPanelFacts(record) {
    const facts = getLocalizedValue(record, "facts", state, ["\u2014", "\u2014", "\u2014"]);
    els.fact1.textContent = facts?.[0] || "\u2014";
    els.fact2.textContent = facts?.[1] || "\u2014";
    els.fact3.textContent = facts?.[2] || "\u2014";
  }

  function updateFromMarker(marker, options = {}) {
    state.currentTimelineEvent = null;
    state.currentMarker = marker;
    state.currentPanelEntity = {
      entity: options.entity || "marker",
    };
    if (marker?.id) {
      onSelectTarget({
        type: "marker",
        id: marker.id,
      });
    }

    els.panelTitle.textContent = getLocalizedText(marker, "title", state, getUiText(state, "marker_untitled"));
    els.panelSubtitle.textContent = getLocalizedText(marker, "type", state, getUiText(state, "marker_type"));
    updatePanelImageView(els, marker, state);
    els.panelText.textContent = getLocalizedText(marker, "description", state, getUiText(state, "marker_description_empty"));
    applyPanelFacts(marker);

    refreshArchiveLinkButton();
    refreshTimelineLinkButtons();
    els.deleteMarkerButton.hidden = !state.editMode;
    togglePanel(true);
  }

  function updateFromTimelineEvent(timelineEvent) {
    if (!timelineEvent) return;

    state.currentMarker = null;
    state.currentTimelineEvent = timelineEvent;
    state.currentPanelEntity = {
      entity: "timelineEvent",
    };
    state.currentTimelineEventId = timelineEvent.id || null;
    if (timelineEvent?.id) {
      onSelectTarget({
        type: "timeline",
        id: timelineEvent.id,
      });
    }

    els.panelTitle.textContent = getLocalizedText(timelineEvent, "title", state, getUiText(state, "timeline_event"));
    els.panelSubtitle.textContent = getLocalizedText(timelineEvent, "year", state, "");
    updatePanelImageView(els, timelineEvent, state);
    els.panelText.textContent = getLocalizedText(
      timelineEvent,
      "fullDescription",
      state,
      getLocalizedText(timelineEvent, "description", state, ""),
    );
    applyPanelFacts(timelineEvent);

    refreshArchiveLinkButton();
    refreshTimelineLinkButtons();
    els.deleteMarkerButton.hidden = true;
    togglePanel(true);
  }

  return {
    getCurrentPanelRecord,
    updateFromMarker,
    updateFromTimelineEvent,
  };
}
