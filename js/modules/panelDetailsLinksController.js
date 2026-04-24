import { findArchiveFactionItem, isFactionArchiveGroup } from "./factionSymbols.js";
import { getLocalizedText } from "./localization.js";
import { getUiText } from "./uiLocale.js";

export function createPanelDetailsLinksController(options) {
  const {
    els,
    state,
    getCurrentPanelRecord,
    getRecorder,
    onSelectTarget,
    rerenderMapMarkers,
  } = options;

  function isFactionMarker(marker) {
    const groupId = String(marker?.group || "").trim().toLowerCase();
    const markerType = String(marker?.type || "").trim().toLowerCase();
    return groupId === "factions" || markerType.includes("\u0444\u0440\u0430\u043a\u0446") || markerType.includes("faction");
  }

  function getFactionArchiveCandidates() {
    return state.archiveData.flatMap((group) => {
      if (!isFactionArchiveGroup(group)) return [];
      return (group.items || []).map((item) => ({ group, item }));
    });
  }

  function getTimelineCandidates() {
    return (state.eventsData || []).map((event) => ({
      id: event.id,
      title: getLocalizedText(event, "title", state, getUiText(state, "timeline_event")),
      year: getLocalizedText(event, "year", state, ""),
    }));
  }

  function refreshArchiveLinkButton() {
    if (!els.linkArchiveItemButton) return;
    const currentEntity = state.currentPanelEntity?.entity || "marker";
    const currentMarker = currentEntity === "timelineEvent" ? null : state.currentMarker;
    const canLink = Boolean(state.editMode && currentMarker && isFactionMarker(currentMarker));
    els.linkArchiveItemButton.hidden = !canLink;
    if (!canLink) return;

    const linked = findArchiveFactionItem(state.archiveData, currentMarker);
    els.linkArchiveItemButton.textContent = linked
      ? `${getUiText(state, "mode_archive")}: ${getLocalizedText(linked.item, "title", state, getUiText(state, "archive_record"))}`
      : getUiText(state, "link_archive_button");
  }

  function refreshTimelineLinkButtons() {
    const currentRecord = getCurrentPanelRecord();
    const currentEntity = state.currentPanelEntity?.entity || "marker";
    const canEditLink = Boolean(state.editMode && currentRecord && currentEntity === "marker");
    const linkedEvent = currentEntity === "timelineEvent"
      ? null
      : state.eventsData.find((entry) => entry.id === currentRecord?.timelineEventId);
    const linkedTitle = linkedEvent ? getLocalizedText(linkedEvent, "title", state, getUiText(state, "timeline_event")) : "";

    els.linkTimelineEventButton.hidden = !canEditLink;
    els.panelTimelineEventButton.hidden = !linkedEvent;

    if (canEditLink) {
      els.linkTimelineEventButton.textContent = linkedEvent
        ? `${getUiText(state, "mode_timeline")}: ${linkedTitle}`
        : getUiText(state, "link_timeline_button");
      els.linkTimelineEventButton.title = linkedEvent
        ? getUiText(state, "link_timeline_button_title_edit")
        : getUiText(state, "link_timeline_button_title");
    }

    if (linkedEvent) {
      els.panelTimelineEventButton.textContent = getUiText(state, "open_linked_timeline_event", { title: linkedTitle });
    }
  }

  function handleArchiveLinkSelection() {
    if (!state.editMode || !state.currentMarker || !isFactionMarker(state.currentMarker)) return;

    const candidates = getFactionArchiveCandidates();
    if (!candidates.length) {
      window.alert(getUiText(state, "link_archive_empty"));
      return;
    }

    const list = candidates
      .map(({ group, item }, index) => `${index + 1}. ${getLocalizedText(item, "title", state, getUiText(state, "marker_untitled"))} (${getLocalizedText(group, "title", state, getUiText(state, "mode_archive"))})`)
      .join("\n");
    const selectedRaw = window.prompt(getUiText(state, "link_archive_pick", { list }), "1");
    if (!selectedRaw) return;

    const selected = candidates[Number(selectedRaw) - 1];
    if (!selected) return;

    state.currentMarker.archiveGroupId = selected.group.id;
    state.currentMarker.archiveItemId = selected.item.id;
    if (state.currentMarker.id) {
      getRecorder().upsert(state.currentPanelEntity?.entity || "marker", state.currentMarker.id, state.currentMarker);
    }
    refreshArchiveLinkButton();
    rerenderMapMarkers?.();
  }

  function handleTimelineLinkSelection() {
    if (!state.editMode || !state.currentMarker) return;

    const candidates = getTimelineCandidates().filter((entry) => entry.id);
    if (!candidates.length) {
      window.alert(getUiText(state, "link_timeline_empty"));
      return;
    }

    const list = [
      getUiText(state, "link_clear"),
      ...candidates.map((entry, index) => `${index + 1}. ${entry.year ? `${entry.year} - ` : ""}${entry.title}`),
    ].join("\n");
    const selectedRaw = window.prompt(
      getUiText(state, "link_timeline_pick", { list }),
      state.currentMarker.timelineEventId ? "0" : "1",
    );
    if (selectedRaw == null) return;

    if (selectedRaw.trim() === "0") {
      state.currentMarker.timelineEventId = "";
      if (state.currentMarker.id) {
        getRecorder().upsert(state.currentPanelEntity?.entity || "marker", state.currentMarker.id, state.currentMarker);
      }
      refreshTimelineLinkButtons();
      return;
    }

    const selected = candidates[Number(selectedRaw) - 1];
    if (!selected) return;

    state.currentMarker.timelineEventId = selected.id;
    if (state.currentMarker.id) {
      getRecorder().upsert(state.currentPanelEntity?.entity || "marker", state.currentMarker.id, state.currentMarker);
    }
    refreshTimelineLinkButtons();
  }

  function openLinkedTimelineEvent() {
    if (!state.currentMarker?.timelineEventId) return;
    onSelectTarget({ type: "timeline", id: state.currentMarker.timelineEventId });
  }

  function setup() {
    els.linkArchiveItemButton?.addEventListener("click", handleArchiveLinkSelection);
    els.linkTimelineEventButton?.addEventListener("click", handleTimelineLinkSelection);
    els.panelTimelineEventButton?.addEventListener("click", openLinkedTimelineEvent);
  }

  return {
    refreshArchiveLinkButton,
    refreshTimelineLinkButtons,
    setup,
  };
}
