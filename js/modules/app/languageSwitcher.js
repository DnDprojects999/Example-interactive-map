import {
  addLanguageToWorld,
  getLanguageLabel,
  getLanguages,
  getUserFacingLanguages,
  normalizeLanguageCode,
  resolveLanguage,
  setLanguageVisibility,
  shouldShowLanguageSwitcher,
} from "../localization.js";
import { getUiText } from "../uiLocale.js";
import { createLanguagePopoverController } from "./languagePopoverController.js";

export function createLanguageSwitcherController({
  els,
  state,
  persistCurrentLanguage,
  syncLocalizedUi,
  persistWorldInfo,
  removeLanguageLayer,
}) {
  const popoverController = createLanguagePopoverController({ els });

  function render() {
    // Editors see every configured language. Players only see languages that
    // are marked as user-facing in world settings.
    const languages = getLanguages(state.worldData);
    const userLanguages = getUserFacingLanguages(state.worldData);
    let nextLanguage = resolveLanguage(state.worldData, state.currentLanguage || state.worldData.defaultLanguage);
    if (!state.editMode && userLanguages.length && !userLanguages.some((language) => language.code === nextLanguage)) {
      nextLanguage = userLanguages[0].code;
    }

    state.currentLanguage = nextLanguage;
    const visibleForUsers = shouldShowLanguageSwitcher(state.worldData, false);
    const visible = visibleForUsers || state.editMode;
    const deleteAllowed = state.currentLanguage !== state.worldData.defaultLanguage;
    const renderedLanguages = state.editMode ? languages : (userLanguages.length ? userLanguages : languages);

    els.languageSwitcher.hidden = !visible;
    els.languageEditorActions.hidden = !state.editMode;
    els.addLanguageButton.hidden = !state.editMode;
    els.deleteLanguageButton.hidden = !state.editMode || !deleteAllowed;
    els.languageToggleLabel.textContent = state.currentLanguage.toUpperCase();
    els.languageOptions.innerHTML = "";

    if (els.toggleLanguageVisibilityButton) {
      els.toggleLanguageVisibilityButton.hidden = true;
      els.toggleLanguageVisibilityButton.style.display = "none";
    }

    if (!visible) {
      popoverController.close();
      return;
    }

    renderedLanguages.forEach((language) => {
      const row = document.createElement("div");
      row.className = `language-option-row ${language.visible === false ? "is-hidden" : ""}`.trim();

      const button = document.createElement("button");
      button.className = `language-option ${language.code === state.currentLanguage ? "active" : ""}`;
      button.type = "button";
      button.dataset.languageCode = language.code;

      const label = document.createElement("span");
      label.textContent = language.visible === false
        ? `${language.label} (${getUiText(state, "language_hidden")})`
        : language.label;
      const code = document.createElement("span");
      code.className = "language-option-code";
      code.textContent = language.code;
      button.append(label, code);
      row.appendChild(button);

      if (state.editMode) {
        const visibilityButton = document.createElement("button");
        visibilityButton.className = "language-option-visibility";
        visibilityButton.type = "button";
        visibilityButton.dataset.languageVisibilityCode = language.code;
        visibilityButton.textContent = language.visible === false
          ? getUiText(state, "show_language")
          : getUiText(state, "hide_language");
        row.appendChild(visibilityButton);
      }

      els.languageOptions.appendChild(row);
    });

    els.addLanguageButton.textContent = getUiText(state, "add_language");
    els.deleteLanguageButton.textContent = getUiText(state, "delete_language");

    if (popoverController.isOpen()) {
      window.requestAnimationFrame(() => popoverController.position());
    }
  }

  function setup() {
    // Pointer/click handlers are split carefully here so the popover can be
    // toggled without immediately closing from the document click listener.
    els.languageToggleButton.addEventListener("pointerdown", (event) => {
      if (els.languageSwitcher.hidden) return;
      event.stopPropagation();
    });

    els.languageToggleButton.addEventListener("click", (event) => {
      if (els.languageSwitcher.hidden) return;
      event.preventDefault();
      event.stopPropagation();
      popoverController.setOpen(!popoverController.isOpen());
    });

    els.languagePopover.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
    });

    els.languagePopover.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    els.languageOptions.addEventListener("click", (event) => {
      const visibilityButton = event.target.closest("[data-language-visibility-code]");
      if (visibilityButton) {
        if (!state.editMode) return;

        const code = normalizeLanguageCode(visibilityButton.dataset.languageVisibilityCode);
        const languages = getLanguages(state.worldData);
        const targetEntry = languages.find((entry) => entry.code === code);
        if (!targetEntry) return;

        const currentlyVisible = targetEntry.visible !== false;
        const visibleLanguages = languages.filter((entry) => entry.visible !== false);
        if (currentlyVisible && visibleLanguages.length <= 1) {
          window.alert(getUiText(state, "alert_keep_one_language_visible"));
          return;
        }

        if (!setLanguageVisibility(state.worldData, code, !currentlyVisible)) return;
        persistWorldInfo();
        return;
      }

      const button = event.target.closest("[data-language-code]");
      if (!button) return;
      state.currentLanguage = resolveLanguage(state.worldData, button.dataset.languageCode);
      persistCurrentLanguage(state.currentLanguage);
      popoverController.close();
      syncLocalizedUi();
    });

    els.addLanguageButton.addEventListener("click", () => {
      if (!state.editMode) return;
      const codeRaw = window.prompt(getUiText(state, "prompt_language_code"), "");
      if (!codeRaw) return;

      const code = addLanguageToWorld(state.worldData, codeRaw);
      const currentLabel = getLanguageLabel(state.worldData, code);
      const nextLabel = window.prompt(getUiText(state, "prompt_language_name"), currentLabel);
      state.worldData.languages = getLanguages(state.worldData).map((entry) =>
        entry.code === code
          ? { ...entry, label: String(nextLabel || "").trim() || currentLabel }
          : entry,
      );
      state.worldData.languagesEnabled = true;
      state.currentLanguage = code;
      persistWorldInfo();
    });

    els.deleteLanguageButton.addEventListener("click", () => {
      if (!state.editMode) return;
      removeLanguageLayer(state.currentLanguage);
    });

    document.addEventListener("click", (event) => {
      if (!els.languageSwitcher.contains(event.target)) {
        popoverController.close();
      }
    });

    window.addEventListener("resize", () => popoverController.position());
    window.addEventListener("scroll", () => popoverController.position(), true);
  }

  return {
    render,
    setup,
    close: () => popoverController.close(),
    position: () => popoverController.position(),
    isOpen: () => popoverController.isOpen(),
    setOpen: (isOpen) => popoverController.setOpen(isOpen),
  };
}
