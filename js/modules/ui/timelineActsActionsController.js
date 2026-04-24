import { getLocalizedText } from "../localization.js";
import { getUiText } from "../uiLocale.js";

export function createTimelineActsActionsController(options) {
  const {
    els,
    state,
    readFileToDataUrl,
    getChangeRecorder,
    navigateToEntity,
    getCurrentTimelineAct,
    getRenderTimelineActBackdrop,
    getRenderTimeline,
    getRenderTimelineSidebarButtons,
    updatePanelFromTimelineEvent,
  } = options;

  async function applyTimelineActBackdropFile(file) {
    const activeAct = getCurrentTimelineAct();
    if (!file || !activeAct || !state.editMode) return;
    if (!file.type.startsWith("image/")) return;

    try {
      const dataUrl = await readFileToDataUrl(file);
      activeAct.backgroundImageUrl = dataUrl;
      getChangeRecorder().upsert("timelineAct", activeAct.id, activeAct);
      getRenderTimelineActBackdrop()();
    } catch (error) {
      console.error(error);
    }
  }

  function handleTimelineMarkerLink(eventId) {
    const timelineEvent = state.eventsData.find((entry) => entry.id === eventId);
    if (!timelineEvent) return;

    if (!state.editMode) {
      if (!timelineEvent.markerId) return;
      navigateToEntity({ type: "marker", id: timelineEvent.markerId });
      return;
    }

    const candidates = (state.markersData || []).filter((entry) => entry?.id);
    if (!candidates.length) {
      window.alert(getUiText(state, "timeline_action_map_empty"));
      return;
    }

    const list = [
      getUiText(state, "link_clear"),
      ...candidates.map((marker, index) => `${index + 1}. ${getLocalizedText(marker, "title", state, getUiText(state, "marker_untitled"))}`),
    ].join("\n");
    const selectedRaw = window.prompt(
      getUiText(state, "timeline_action_map_pick", { list }),
      timelineEvent.markerId ? "0" : "1",
    );
    if (selectedRaw == null) return;

    if (selectedRaw.trim() === "0") {
      timelineEvent.markerId = "";
    } else {
      const selected = candidates[Number(selectedRaw) - 1];
      if (!selected) return;
      timelineEvent.markerId = selected.id;
    }

    getChangeRecorder().upsert("timelineEvent", timelineEvent.id, timelineEvent);
    getRenderTimeline()();
    if (state.timelineMode) getRenderTimelineSidebarButtons()();
    if (state.currentPanelEntity?.entity === "timelineEvent" && state.currentTimelineEventId === timelineEvent.id) {
      updatePanelFromTimelineEvent(timelineEvent);
    }
  }

  function setup() {
    els.timelineActImageButton?.addEventListener("click", () => {
      if (els.timelineActImageButton.hidden) return;
      els.timelineActImageInput.click();
    });

    els.timelineActImageInput?.addEventListener("change", async (event) => {
      const [file] = Array.from(event.target.files || []);
      await applyTimelineActBackdropFile(file);
      els.timelineActImageInput.value = "";
    });
  }

  return {
    handleTimelineMarkerLink,
    setup,
  };
}
