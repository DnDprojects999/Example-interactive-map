export function createEditorStatusController(options) {
  const { els, getUiText } = options;

  function setPanelFacts(fact1 = "", fact2 = "", fact3 = "") {
    els.fact1.textContent = fact1;
    els.fact2.textContent = fact2;
    els.fact3.textContent = fact3;
  }

  function showEditorStatus(subtitle, text, facts = []) {
    els.panelSubtitle.textContent = subtitle;
    els.panelText.textContent = text;
    setPanelFacts(facts[0] || "", facts[1] || "", facts[2] || "");
  }

  function showMarkerDeletedStatus() {
    els.panelTitle.textContent = getUiText("editor_marker_deleted_title");
    showEditorStatus(
      getUiText("editor_map_title"),
      getUiText("editor_marker_deleted_text"),
      [
        getUiText("editor_marker_deleted_fact_1"),
        getUiText("editor_marker_deleted_fact_2"),
        getUiText("editor_marker_deleted_fact_3"),
      ],
    );
  }

  return {
    showEditorStatus,
    showMarkerDeletedStatus,
  };
}
