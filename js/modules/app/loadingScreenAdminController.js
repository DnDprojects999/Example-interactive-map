import { createLoadingScreenFormController } from "./loadingScreenFormController.js";

export function createLoadingScreenAdminController(options) {
  const {
    els,
    state,
    persistWorldInfo,
    previewLoadingScreen,
  } = options;

  function isOpen() {
    return Boolean(els.loadingEditorPanel && !els.loadingEditorPanel.hidden);
  }

  const formController = createLoadingScreenFormController({
    els,
    state,
    persistWorldInfo,
    isOpen,
  });

  // Opening the modal copies the current localized world info into the form.
  // Saving writes back into state.worldData and then into changes.json.
  function open() {
    if (!state.editMode) return;
    formController.syncStaticLabels();
    formController.fillForm();
    els.loadingEditorPanel.hidden = false;
  }

  function close() {
    els.loadingEditorPanel.hidden = true;
  }

  async function preview() {
    if (!state.editMode) return;
    formController.persistChanges();
    await previewLoadingScreen?.();
  }

  function promptImageUpload() {
    if (!state.editMode) return;
    els.loadingEditorImageInput?.click();
  }

  function setup() {
    // The modal supports both pointer-first and keyboard-first flows to keep it
    // usable during heavy editing sessions.
    els.loadingEditorCloseButton.addEventListener("click", close);
    els.loadingEditorSaveButton.addEventListener("click", () => {
      formController.persistChanges();
      close();
    });
    els.loadingEditorPreviewButton.addEventListener("click", async () => {
      await preview();
    });
    els.loadingEditorAddFlavorLineButton.addEventListener("click", () => {
      formController.appendFlavorLine("", { focus: true });
    });
    els.loadingEditorUploadImageButton?.addEventListener("click", promptImageUpload);
    els.loadingEditorClearImageButton?.addEventListener("click", () => formController.clearImage());
    els.loadingEditorImageInput?.addEventListener("change", async (event) => {
      const [file] = Array.from(event.target.files || []);
      await formController.uploadImage(file);
      els.loadingEditorImageInput.value = "";
    });
    els.loadingEditorPanel.addEventListener("click", (event) => {
      if (event.target === els.loadingEditorPanel) {
        close();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isOpen()) {
        close();
      }
    });
  }

  return {
    setup,
    edit: open,
    open,
    close,
    preview,
    promptImageUpload,
  };
}
