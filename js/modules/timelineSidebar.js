import {
  DEFAULT_TIMELINE_SHORTCUTS,
  getDefaultTimelineShortcutLabel,
  getTimelineEventsForAct,
  getTimelineSidebarActions,
} from "./timelineModel.js";
import { getUiText } from "./uiLocale.js";

export function createTimelineSidebarController(options) {
  const {
    els,
    state,
    getChangeRecorder,
    renderTimeline,
  } = options;

  const getRecorder = () => getChangeRecorder?.() || { upsert: () => {}, remove: () => {} };

  // Timeline sidebar buttons are "jump points" into the horizontal timeline.
  function scrollToEvent(eventId) {
    const eventCard = els.timelineContainer.querySelector(`[data-event-id="${eventId}"]`);
    if (!eventCard) return;
    const eventItem = eventCard.closest(".timeline-event-item") || eventCard;
    eventItem.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  function setShortcut(eventId, label) {
    if (!state.editMode) return;
    const event = state.eventsData.find((entry) => entry.id === eventId);
    if (!event) return;

    event.sidebarShortcut = true;
    event.sidebarShortcutLabel = (label?.trim?.() || getDefaultTimelineShortcutLabel(event)).slice(0, 8);
    getRecorder().upsert("timelineEvent", event.id, event);
    renderTimeline();
    if (state.timelineMode) renderButtons();
  }

  // Editors can add shortcuts only from events currently visible in the active
  // act, which keeps each act's sidebar focused.
  function addShortcut() {
    if (!state.editMode) return;
    const visibleEvents = getTimelineEventsForAct(state.eventsData, state.currentTimelineActId);
    const shortcutEventIds = new Set(getTimelineSidebarActions(visibleEvents, DEFAULT_TIMELINE_SHORTCUTS, state).map((action) => action.eventId));
    const candidates = visibleEvents.filter((event) => event?.id && !shortcutEventIds.has(event.id));

    if (candidates.length === 0) {
      window.alert(getUiText(state, "timeline_sidebar_all_used"));
      return;
    }

    const list = candidates
      .map((event, index) => `${index + 1}. ${event.year || "?"} - ${event.title || getUiText(state, "timeline_sidebar_untitled")}`)
      .join("\n");
    const selectedRaw = window.prompt(getUiText(state, "timeline_sidebar_pick_event", { list }), "1");
    if (!selectedRaw) return;

    const selectedEvent = candidates[Number(selectedRaw) - 1];
    if (!selectedEvent) return;

    const defaultLabel = getDefaultTimelineShortcutLabel(selectedEvent);
    const label = window.prompt(getUiText(state, "timeline_sidebar_button_label"), defaultLabel);
    if (label == null) return;
    setShortcut(selectedEvent.id, label);
  }

  function editShortcut(action) {
    if (!state.editMode || action?.isDefault) return;
    const event = state.eventsData.find((entry) => entry.id === action.eventId);
    if (!event) return;

    const command = window.prompt(
      getUiText(state, "timeline_sidebar_new_label"),
      action.label || getDefaultTimelineShortcutLabel(event),
    );
    if (command == null) return;

    if (command.trim() === "-") {
      event.sidebarShortcut = false;
      event.sidebarShortcutLabel = "";
      getRecorder().upsert("timelineEvent", event.id, event);
      renderTimeline();
      if (state.timelineMode) renderButtons();
      return;
    }

    setShortcut(event.id, command);
  }

  function renderButtons() {
    // The sidebar is rebuilt from current act data every time because available
    // shortcuts change when acts switch or events are edited.
    els.toolButtonsContainer.innerHTML = "";

    const actions = getTimelineSidebarActions(getTimelineEventsForAct(state.eventsData, state.currentTimelineActId), DEFAULT_TIMELINE_SHORTCUTS, state);
    actions.forEach((action) => {
      const button = document.createElement("button");
      button.className = `tool-btn active timeline-shortcut ${state.editMode && !action.isDefault ? "timeline-shortcut-editable" : ""}`;
      button.dataset.label = action.title;
      button.textContent = action.label;
      button.title = state.editMode && !action.isDefault
        ? `${action.title}\n${getUiText(state, "timeline_sidebar_context_hint")}`
        : action.title;
      button.addEventListener("click", () => scrollToEvent(action.eventId));
      button.addEventListener("contextmenu", (event) => {
        if (!state.editMode || action.isDefault) return;
        event.preventDefault();
        editShortcut(action);
      });
      button.addEventListener("dblclick", (event) => {
        if (!state.editMode || action.isDefault) return;
        event.preventDefault();
        editShortcut(action);
      });
      els.toolButtonsContainer.appendChild(button);
    });

    if (state.editMode) {
      const addButton = document.createElement("button");
      addButton.className = "tool-btn timeline-shortcut-add";
      addButton.dataset.label = getUiText(state, "timeline_sidebar_add_point");
      addButton.textContent = "+";
      addButton.title = getUiText(state, "timeline_sidebar_add_point_title");
      addButton.addEventListener("click", addShortcut);
      els.toolButtonsContainer.appendChild(addButton);
    }
  }

  function toggleShortcut(eventId) {
    if (!state.editMode) return;

    const event = state.eventsData.find((entry) => entry.id === eventId);
    if (!event) return;
    if (DEFAULT_TIMELINE_SHORTCUTS.some((entry) => entry.eventId === eventId)) return;

    if (event.sidebarShortcut) {
      event.sidebarShortcut = false;
      event.sidebarShortcutLabel = "";
    } else {
      const defaultLabel = getDefaultTimelineShortcutLabel(event);
      const nextLabel = window.prompt(getUiText(state, "timeline_sidebar_quick_label"), defaultLabel);
      if (nextLabel == null) return;
      event.sidebarShortcut = true;
      event.sidebarShortcutLabel = (nextLabel.trim() || defaultLabel).slice(0, 8);
    }

    getRecorder().upsert("timelineEvent", event.id, event);
    renderTimeline();
    if (state.timelineMode) renderButtons();
  }

  return {
    renderButtons,
    toggleShortcut,
  };
}
