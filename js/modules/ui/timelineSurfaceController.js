import { normalizeTimelineOrderByDate } from "../timelineModel.js";
import {
  createTimelineAxisSvg,
  createTimelineEventItem,
  createTimelineFutureItem,
} from "../timelineView.js";

export function createTimelineSurfaceController(options) {
  const {
    els,
    state,
    getUiText,
    timelineActs,
    timelineSidebar,
    editorActions,
    panelDetails,
    playerSidebar,
    updateSelection,
    syncTimelineTrackAlignment,
  } = options;

  function renderTimeline() {
    els.timelineContainer.innerHTML = "";
    els.timelineContainer.appendChild(createTimelineAxisSvg());
    normalizeTimelineOrderByDate(state.eventsData);
    timelineActs.renderTimelineActTabs();
    timelineActs.getVisibleTimelineEvents().forEach((event) => {
      els.timelineContainer.appendChild(createTimelineEventItem(event, {
        editMode: state.editMode,
        localizationContext: state,
        actsData: state.timelineActsData,
        onToggleShortcut: timelineSidebar.toggleShortcut,
        onTogglePosition: editorActions.toggleTimelineEventPosition,
        onDelete: editorActions.deleteTimelineEvent,
        onActivateMarkerLink: timelineActs.handleTimelineMarkerLink,
        onAssignAct: editorActions.assignTimelineEventAct,
      }));
    });

    els.timelineContainer.appendChild(createTimelineFutureItem(getUiText("timeline_future")));
    updateSelection();
    requestAnimationFrame(syncTimelineTrackAlignment);
  }

  function handleTimelineClick(event) {
    const item = event.target.closest(".timeline-event-item");
    const eventId = item?.dataset?.eventId || event.target.closest(".event-card")?.dataset?.eventId;
    if (!eventId) return;

    const timelineEvent = (state.eventsData || []).find((entry) => entry.id === eventId);
    if (!timelineEvent) return;

    state.currentTimelineEventId = eventId;
    state.currentTimelineEvent = timelineEvent;
    playerSidebar.setPlayerTarget({ type: "timeline", id: eventId });
    updateSelection();
    panelDetails.updateFromTimelineEvent(timelineEvent);
  }

  function syncToolbarButtons() {
    const timelineToolbarActions = els.timelineActsBar?.parentElement;
    if (!timelineToolbarActions) return;

    if (
      els.editTimelineActButton
      && els.editTimelineActButton.parentElement !== timelineToolbarActions
    ) {
      timelineToolbarActions.appendChild(els.editTimelineActButton);
    }
    if (
      els.deleteTimelineActButton
      && els.deleteTimelineActButton.parentElement !== timelineToolbarActions
    ) {
      timelineToolbarActions.appendChild(els.deleteTimelineActButton);
    }
  }

  function setup() {
    syncToolbarButtons();
    els.timelineContainer.addEventListener("click", handleTimelineClick);
    window.addEventListener("resize", () => {
      if (state.timelineMode) requestAnimationFrame(syncTimelineTrackAlignment);
    });
  }

  return {
    renderTimeline,
    setup,
  };
}
