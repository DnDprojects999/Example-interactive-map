import { createPanelDetailsEditingController } from "./panelDetailsEditingController.js";
import { createPanelDetailsLinksController } from "./panelDetailsLinksController.js";
import { createPanelDetailsViewController } from "./panelDetailsViewController.js";

export function createPanelDetailsController(options) {
  const {
    els,
    state,
    getChangeRecorder,
    onSelectTarget = () => {},
    togglePanel,
    setMapEditorControlsVisible,
    refreshEditorActionButtons,
    rerenderMapMarkers,
  } = options;

  const getRecorder = () => getChangeRecorder?.() || { upsert: () => {} };

  let linksController = {
    refreshArchiveLinkButton: () => {},
    refreshTimelineLinkButtons: () => {},
    setup: () => {},
  };
  const viewController = createPanelDetailsViewController({
    els,
    state,
    onSelectTarget,
    togglePanel,
    refreshArchiveLinkButton: () => linksController.refreshArchiveLinkButton(),
    refreshTimelineLinkButtons: () => linksController.refreshTimelineLinkButtons(),
  });
  linksController = createPanelDetailsLinksController({
    els,
    state,
    getCurrentPanelRecord: () => viewController.getCurrentPanelRecord(),
    getRecorder,
    onSelectTarget,
    rerenderMapMarkers,
  });
  const editingController = createPanelDetailsEditingController({
    els,
    state,
    getRecorder,
    getCurrentPanelRecord: () => viewController.getCurrentPanelRecord(),
    refreshArchiveLinkButton: () => linksController.refreshArchiveLinkButton(),
    refreshTimelineLinkButtons: () => linksController.refreshTimelineLinkButtons(),
    setMapEditorControlsVisible,
    refreshEditorActionButtons,
  });

  linksController.setup();

  return {
    ...editingController,
    updateFromMarker: viewController.updateFromMarker,
    updateFromTimelineEvent: viewController.updateFromTimelineEvent,
  };
}
