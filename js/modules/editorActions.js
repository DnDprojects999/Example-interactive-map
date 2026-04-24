import { createEditorCollectionActions } from "./editorCollectionActions.js";
import { createEditorTimelineActions } from "./editorTimelineActions.js";
import { createEditorActionReporter } from "./diagnostics/editorActionReporter.js";
import { getUiText as resolveUiText } from "./uiLocale.js";

export function createEditorActionsController(options) {
  const {
    els,
    state,
    generateEntityId,
    getChangeRecorder,
    getMapEditorCallbacks,
    renderArchive,
    renderArchiveSidebarButtons,
    renderHeroes,
    renderTimeline,
    renderTimelineSidebarButtons,
    openDataQualityReport,
    getUiText: injectedGetUiText,
    reportRuntimeEvent,
  } = options;

  const getRecorder = () => getChangeRecorder?.() || { upsert: () => {}, remove: () => {} };
  const getCallbacks = () => getMapEditorCallbacks?.() || {};
  const getUiText = (key, params = {}) => injectedGetUiText?.(key, params) || resolveUiText(state, key, params);
  const actionReporter = createEditorActionReporter({
    onRuntimeEvent: reportRuntimeEvent,
    getUiText,
  });

  const timelineActions = createEditorTimelineActions({
    els,
    state,
    generateEntityId,
    getRecorder,
    getUiText,
    renderTimeline,
    renderTimelineSidebarButtons,
  });
  const collectionActions = createEditorCollectionActions({
    els,
    state,
    generateEntityId,
    getRecorder,
    getUiText,
    renderArchive,
    renderArchiveSidebarButtons,
    renderHeroes,
  });

  const safeAssignTimelineEventAct = actionReporter.wrap("assign-timeline-event-act", timelineActions.assignTimelineEventAct);
  const safeCreateTimelineEvent = actionReporter.wrap("create-timeline-event", timelineActions.createTimelineEvent);
  const safeCreateTimelineAct = actionReporter.wrap("create-timeline-act", timelineActions.createTimelineAct);
  const safeEditTimelineAct = actionReporter.wrap("edit-timeline-act", timelineActions.editTimelineAct);
  const safeDeleteTimelineAct = actionReporter.wrap("delete-timeline-act", timelineActions.deleteTimelineAct);
  const safeDeleteTimelineEvent = actionReporter.wrap("delete-timeline-event", timelineActions.deleteTimelineEvent);
  const safeToggleTimelineEventPosition = actionReporter.wrap("toggle-timeline-event-position", timelineActions.toggleTimelineEventPosition);
  const safeCreateArchiveGroup = actionReporter.wrap("create-archive-group", collectionActions.createArchiveGroup);
  const safeCreateArchiveItem = actionReporter.wrap("create-archive-item", collectionActions.createArchiveItem);
  const safeCreateHeroGroup = actionReporter.wrap("create-hero-group", collectionActions.createHeroGroup);
  const safeCreateHeroCard = actionReporter.wrap("create-hero-card", collectionActions.createHeroCard);

  function setupButtons() {
    els.addRegionLabelButton.addEventListener("click", () => getCallbacks().onCreateRegionLabel?.());
    els.toggleTextMoveModeButton.addEventListener("click", () => getCallbacks().onToggleTextMoveMode?.());
    els.toggleDrawModeButton.addEventListener("click", () => getCallbacks().onToggleDrawMode?.());
    els.addTimelineEventButton.addEventListener("click", safeCreateTimelineEvent);
    els.addTimelineActButton?.addEventListener("click", safeCreateTimelineAct);
    els.editTimelineActButton?.addEventListener("click", safeEditTimelineAct);
    els.deleteTimelineActButton?.addEventListener("click", safeDeleteTimelineAct);
    els.addArchiveGroupButton.addEventListener("click", safeCreateArchiveGroup);
    els.addArchiveItemButton.addEventListener("click", safeCreateArchiveItem);
    els.addHeroGroupButton.addEventListener("click", safeCreateHeroGroup);
    els.addHeroCardButton.addEventListener("click", safeCreateHeroCard);
    els.validateDataButton.addEventListener("click", () => openDataQualityReport?.());
  }

  return {
    assignTimelineEventAct: safeAssignTimelineEventAct,
    createTimelineAct: safeCreateTimelineAct,
    deleteTimelineAct: safeDeleteTimelineAct,
    deleteTimelineEvent: safeDeleteTimelineEvent,
    editTimelineAct: safeEditTimelineAct,
    setupButtons,
    toggleTimelineEventPosition: safeToggleTimelineEventPosition,
  };
}
