import { createTimelineActsActionsController } from "./timelineActsActionsController.js";
import { createTimelineActsViewController } from "./timelineActsViewController.js";

export function createTimelineActsController({
  els,
  state,
  readFileToDataUrl,
  getChangeRecorder,
  navigateToEntity,
  renderTimeline,
  renderTimelineSidebarButtons,
  updatePanelFromTimelineEvent,
}) {
  const viewController = createTimelineActsViewController({
    els,
    state,
    getRenderTimeline: () => renderTimeline,
    getRenderTimelineSidebarButtons: () => renderTimelineSidebarButtons,
  });
  const actionsController = createTimelineActsActionsController({
    els,
    state,
    readFileToDataUrl,
    getChangeRecorder,
    navigateToEntity,
    getCurrentTimelineAct: () => viewController.getCurrentTimelineAct(),
    getRenderTimelineActBackdrop: () => viewController.renderTimelineActBackdrop,
    getRenderTimeline: () => renderTimeline,
    getRenderTimelineSidebarButtons: () => renderTimelineSidebarButtons,
    updatePanelFromTimelineEvent,
  });

  return {
    ...viewController,
    ...actionsController,
  };
}
