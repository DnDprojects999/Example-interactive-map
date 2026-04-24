function defaultActionLabel(actionId) {
  return String(actionId || "editor-action")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function createEditorActionReporter(options = {}) {
  const {
    onRuntimeEvent,
    getUiText,
  } = options;

  function report(actionId, error) {
    onRuntimeEvent?.({
      level: "error",
      title: typeof getUiText === "function"
        ? getUiText("info_editor_action_failed")
        : "Editor action failed",
      message: `${defaultActionLabel(actionId)}: ${error?.message || String(error || "Unknown error")}`,
      details: error?.stack || String(error || ""),
      source: `editor.${actionId}`,
    });
  }

  function wrap(actionId, handler) {
    return (...args) => {
      try {
        return handler(...args);
      } catch (error) {
        report(actionId, error);
        return undefined;
      }
    };
  }

  return {
    report,
    wrap,
  };
}
