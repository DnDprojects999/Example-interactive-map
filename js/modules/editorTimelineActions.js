import { normalizeTimelineOrderByDate } from "./timelineModel.js";
import { createTimelineActTemplate, createTimelineEventTemplate } from "./entityTemplates.js";
import { getLocalizedText, setLocalizedValue } from "./localization.js";

export function createEditorTimelineActions(options) {
  const {
    els,
    state,
    generateEntityId,
    getRecorder,
    getUiText,
    renderTimeline,
    renderTimelineSidebarButtons,
  } = options;

  function rerenderTimeline() {
    renderTimeline();
    if (state.timelineMode) renderTimelineSidebarButtons();
  }

  function toggleTimelineEventPosition(eventId) {
    if (!state.editMode) return;

    const event = state.eventsData.find((entry) => entry.id === eventId);
    if (!event) return;

    event.position = event.position === "down" ? "up" : "down";
    getRecorder().upsert("timelineEvent", event.id, event);
    rerenderTimeline();
  }

  function deleteTimelineEvent(eventId) {
    if (!state.editMode) return;

    const eventIndex = state.eventsData.findIndex((entry) => entry.id === eventId);
    if (eventIndex < 0) return;

    const [removedEvent] = state.eventsData.splice(eventIndex, 1);
    getRecorder().remove("timelineEvent", removedEvent.id);
    rerenderTimeline();
  }

  function createTimelineEvent() {
    if (!state.editMode) return;

    const previousEvent = state.eventsData[state.eventsData.length - 1];
    const newEvent = {
      ...createTimelineEventTemplate(previousEvent),
      id: generateEntityId("timeline"),
      actId: state.currentTimelineActId || "",
    };

    state.eventsData.push(newEvent);
    normalizeTimelineOrderByDate(state.eventsData);
    getRecorder().upsert("timelineEvent", newEvent.id, newEvent);
    renderTimeline();
    const newCard = els.timelineContainer.querySelector(`[data-event-id="${newEvent.id}"]`);
    if (newCard) newCard.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  function createTimelineAct() {
    if (!state.editMode) return;

    const newAct = {
      ...createTimelineActTemplate(state.timelineActsData.length),
      id: generateEntityId("timeline-act"),
    };

    const localizedTitle = getLocalizedText(newAct, "title", state, newAct.title);
    const nextTitle = window.prompt(getUiText("prompt_timeline_act_title"), localizedTitle);
    if (nextTitle == null) return;
    setLocalizedValue(newAct, "title", String(nextTitle).trim() || localizedTitle, state);

    const localizedDescription = getLocalizedText(newAct, "description", state, newAct.description);
    const nextDescription = window.prompt(getUiText("prompt_timeline_act_description"), localizedDescription);
    if (nextDescription == null) return;
    setLocalizedValue(newAct, "description", String(nextDescription).trim() || localizedDescription, state);

    state.timelineActsData.push(newAct);
    state.currentTimelineActId = newAct.id;
    getRecorder().upsert("timelineAct", newAct.id, newAct);
    rerenderTimeline();
  }

  function editTimelineAct() {
    if (!state.editMode) return;
    const act = state.timelineActsData.find((entry) => entry.id === state.currentTimelineActId);
    if (!act) return;

    const currentTitle = getLocalizedText(act, "title", state, act.title || getUiText("timeline_act_label", { index: 1 }));
    const nextTitle = window.prompt(getUiText("prompt_timeline_act_title"), currentTitle);
    if (nextTitle == null) return;

    const currentDescription = getLocalizedText(
      act,
      "description",
      state,
      act.description || getUiText("timeline_act_default_description"),
    );
    const nextDescription = window.prompt(getUiText("prompt_timeline_act_description"), currentDescription);
    if (nextDescription == null) return;

    setLocalizedValue(act, "title", String(nextTitle).trim() || currentTitle, state);
    setLocalizedValue(act, "description", String(nextDescription).trim() || currentDescription, state);
    getRecorder().upsert("timelineAct", act.id, act);
    rerenderTimeline();
  }

  function deleteTimelineAct() {
    if (!state.editMode) return;
    const act = state.timelineActsData.find((entry) => entry.id === state.currentTimelineActId);
    if (!act?.id) return;

    const actTitle = String(getLocalizedText(act, "title", state, getUiText("timeline_act_label", { index: 1 })) || "").trim();
    if (!window.confirm(getUiText("confirm_delete_timeline_act", {
      title: actTitle || getUiText("timeline_act_label", { index: 1 }),
      overview: getUiText("timeline_overview"),
    }))) return;

    state.eventsData.forEach((entry) => {
      if (String(entry.actId || "").trim() !== act.id) return;
      entry.actId = "";
      getRecorder().upsert("timelineEvent", entry.id, entry);
    });

    state.timelineActsData = state.timelineActsData.filter((entry) => entry.id !== act.id);
    state.currentTimelineActId = "";
    getRecorder().remove("timelineAct", act.id);
    rerenderTimeline();
  }

  function assignTimelineEventAct(eventId) {
    if (!state.editMode) return;

    const event = state.eventsData.find((entry) => entry.id === eventId);
    if (!event) return;

    const list = [
      `0. ${getUiText("timeline_overview")}`,
      ...state.timelineActsData.map((act, index) => `${index + 1}. ${getLocalizedText(act, "title", state, getUiText("timeline_act_label", { index: index + 1 }))}`),
    ].join("\n");
    const currentIndex = Math.max(
      0,
      state.timelineActsData.findIndex((act) => act.id === event.actId) + 1,
    );
    const selectedRaw = window.prompt(getUiText("prompt_timeline_act_assign", { list }), String(currentIndex));
    if (selectedRaw == null) return;

    if (selectedRaw.trim() === "0") {
      event.actId = "";
    } else {
      const selectedAct = state.timelineActsData[Number(selectedRaw) - 1];
      if (!selectedAct) return;
      event.actId = selectedAct.id;
    }

    getRecorder().upsert("timelineEvent", event.id, event);
    rerenderTimeline();
  }

  return {
    assignTimelineEventAct,
    createTimelineAct,
    createTimelineEvent,
    deleteTimelineAct,
    deleteTimelineEvent,
    editTimelineAct,
    toggleTimelineEventPosition,
  };
}
