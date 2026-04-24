import {
  findTimelineAct,
  getTimelineActSummary,
  getTimelineActTitle,
  getTimelineEventsForAct,
} from "../timelineModel.js";
import { getUiText } from "../uiLocale.js";

export function createTimelineActsViewController(options) {
  const {
    els,
    state,
    getRenderTimeline,
    getRenderTimelineSidebarButtons,
  } = options;

  function getVisibleTimelineEvents() {
    return getTimelineEventsForAct(state.eventsData, state.currentTimelineActId);
  }

  function getCurrentTimelineAct() {
    return findTimelineAct(state.timelineActsData, state.currentTimelineActId);
  }

  function renderTimelineActBackdrop() {
    const activeAct = getCurrentTimelineAct();
    const imageUrl = typeof activeAct?.backgroundImageUrl === "string"
      ? activeAct.backgroundImageUrl.trim()
      : "";

    if (els.timelineActImageButton) {
      els.timelineActImageButton.hidden = !(state.editMode && state.timelineMode && activeAct);
      if (!els.timelineActImageButton.hidden) {
        els.timelineActImageButton.textContent = imageUrl
          ? getUiText(state, "timeline_act_bg_update")
          : getUiText(state, "timeline_act_bg_add");
      }
    }

    if (!els.timelineActBackdrop) return;
    if (!imageUrl) {
      els.timelineActBackdrop.hidden = true;
      els.timelineActBackdrop.style.backgroundImage = "none";
      return;
    }

    els.timelineActBackdrop.hidden = false;
    els.timelineActBackdrop.style.backgroundImage = `url("${imageUrl.replace(/"/g, "\\\"")}")`;
  }

  function activateTimelineAct(actId = "") {
    state.currentTimelineActId = String(actId || "").trim();
    if (!getVisibleTimelineEvents().some((event) => event.id === state.currentTimelineEventId)) {
      state.currentTimelineEventId = null;
      state.currentTimelineEvent = null;
    }
    getRenderTimeline()();
    if (state.timelineMode) getRenderTimelineSidebarButtons()();
  }

  function renderTimelineActTabs() {
    if (!els.timelineActsBar) return;

    const defaultSubtitle = getUiText(state, "timeline_subtitle");
    const activeAct = getCurrentTimelineAct();
    const actSummary = activeAct ? getTimelineActSummary(activeAct, state, "") : "";
    const actTitle = activeAct ? getTimelineActTitle(activeAct, state, getUiText(state, "mode_timeline")) : "";
    els.timelineSubtitle.textContent = activeAct
      ? (actSummary || getUiText(state, "timeline_act_subtitle", { title: actTitle }))
      : defaultSubtitle;

    els.timelineActsBar.innerHTML = "";

    const overviewButton = document.createElement("button");
    overviewButton.className = `timeline-act-button ${state.currentTimelineActId ? "" : "active"}`.trim();
    overviewButton.type = "button";
    overviewButton.textContent = getUiText(state, "timeline_overview");
    overviewButton.title = defaultSubtitle;
    overviewButton.addEventListener("click", () => activateTimelineAct(""));
    els.timelineActsBar.appendChild(overviewButton);

    state.timelineActsData.forEach((act, index) => {
      const title = getTimelineActTitle(act, state, getUiText(state, "timeline_act_label", { index: index + 1 }));
      const button = document.createElement("button");
      button.className = `timeline-act-button ${act.id === state.currentTimelineActId ? "active" : ""}`.trim();
      button.type = "button";
      button.textContent = title;
      button.title = getTimelineActSummary(act, state, title) || title;
      button.addEventListener("click", () => activateTimelineAct(act.id));
      els.timelineActsBar.appendChild(button);
    });

    if (els.addTimelineActButton) els.addTimelineActButton.hidden = !(state.editMode && state.timelineMode);
    if (els.editTimelineActButton) els.editTimelineActButton.hidden = !(state.editMode && state.timelineMode && activeAct);
    if (els.deleteTimelineActButton) els.deleteTimelineActButton.hidden = !(state.editMode && state.timelineMode && activeAct);

    renderTimelineActBackdrop();
  }

  return {
    activateTimelineAct,
    getCurrentTimelineAct,
    getVisibleTimelineEvents,
    renderTimelineActBackdrop,
    renderTimelineActTabs,
  };
}
