import { getLocalizedText, setLocalizedValue } from "../localization.js";

export function createUiShellScaffoldController(options) {
  const {
    els,
    state,
    getUiText,
    getChangeRecorder,
    getRenderMapSidebarButtons,
    getRenderBaseMapMarkers,
    onSidebarLegendRender,
  } = options;

  const getRecorder = () => getChangeRecorder?.() || { upsert: () => {}, remove: () => {} };

  // Sidebar buttons are re-rendered often. Forcing a reflow here restarts the
  // fade animation so the transition still looks intentional after updates.
  function swapSidebarContent(renderer) {
    els.toolButtonsContainer.classList.remove("sidebar-fade");
    renderer();
    // Force a reflow so the fade animation reliably restarts after rerendering.
    void els.toolButtonsContainer.offsetWidth;
    els.toolButtonsContainer.classList.add("sidebar-fade");
    onSidebarLegendRender?.();
  }

  function setSidebarTitle(text) {
    els.sidebarTitle.textContent = text;
  }

  function editLegendGroup(groupId) {
    if (!state.editMode) return;
    const group = (state.groupsData || []).find((entry) => entry.id === groupId);
    if (!group) return;

    const currentName = getLocalizedText(group, "name", state, group.name || getUiText("sidebar_layers"));
    const nextName = window.prompt(getUiText("legend_group_name_prompt"), currentName);
    if (nextName == null) return;

    const currentShort = getLocalizedText(group, "short", state, group.short || "?");
    const nextShort = window.prompt(getUiText("legend_group_short_prompt"), currentShort);
    if (nextShort == null) return;

    setLocalizedValue(group, "name", nextName.trim() || currentName, state);
    setLocalizedValue(group, "short", nextShort.trim() || currentShort, state);
    getRecorder().upsert("markerGroup", group.id, group);
    getRenderBaseMapMarkers()();
    getRenderMapSidebarButtons()();
    if (!els.sidebarLegendPanel.hidden) onSidebarLegendRender?.();
  }

  function readFileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error(getUiText("image_file_read_error")));
      reader.readAsDataURL(file);
    });
  }

  function togglePanel(force) {
    const shouldOpen = typeof force === "boolean" ? force : !els.content.classList.contains("panel-open");
    els.content.classList.toggle("panel-open", shouldOpen);
    els.panelHandle.textContent = shouldOpen ? "\u25c2" : "\u25b8";
  }

  function setModeWord(text, visible) {
    els.modeWord.textContent = text;
    els.modeWord.classList.toggle("show", visible);
  }

  function setTopModeButton(label) {
    els.timelineOpenButton.textContent = label;
  }

  function getSuggestedAssetPath(filename = "image") {
    const ext = filename.includes(".") ? filename.split(".").pop().toLowerCase() : "png";
    const markerId = state.currentMarker?.id || "marker";
    return `assets/markers/${markerId}-${Date.now()}.${ext}`;
  }

  return {
    editLegendGroup,
    getSuggestedAssetPath,
    readFileToDataUrl,
    setModeWord,
    setSidebarTitle,
    setTopModeButton,
    swapSidebarContent,
    togglePanel,
  };
}
