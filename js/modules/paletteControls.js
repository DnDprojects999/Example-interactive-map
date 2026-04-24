import {
  BUILTIN_PALETTE_ALIASES,
  PALETTE_VARIABLE_NAMES,
  getBuiltinPalettesForTheme,
  getDefaultPaletteForTheme,
  getPaletteGroupId,
} from "./uiConfig.js";

export function createPaletteController(els, state) {
  function getCurrentThemeId() {
    return document.body.dataset.siteTheme || state.currentSiteTheme || "serkonia";
  }

  function getCurrentPaletteGroupId() {
    return getPaletteGroupId(getCurrentThemeId());
  }

  function getStoredPaletteForCurrentTheme() {
    return state.currentPaletteByGroup?.[getCurrentPaletteGroupId()]
      || state.currentPalette
      || getDefaultPaletteForTheme(getCurrentThemeId());
  }

  function getNormalizedPaletteId(paletteId) {
    const normalized = BUILTIN_PALETTE_ALIASES[String(paletteId || "").trim().toLowerCase()]
      || String(paletteId || "").trim().toLowerCase();
    const builtinIds = new Set(getBuiltinPalettesForTheme(getCurrentThemeId()).map((entry) => entry.id));
    if (builtinIds.has(normalized)) return normalized;
    if (state.customPalettes.some((entry) => entry.id === normalized)) return normalized;
    return getDefaultPaletteForTheme(getCurrentThemeId());
  }

  // Palette switching is mostly CSS-variable driven, which keeps theme changes
  // cheap and avoids rerendering the app just to restyle it.
  function positionPopover() {
    if (!els.palettePopover || !els.paletteToggle || els.palettePopover.hidden) return;
    const rect = els.paletteToggle.getBoundingClientRect();
    els.palettePopover.style.left = `${rect.right + 12}px`;
    els.palettePopover.style.top = `${rect.top + rect.height / 2}px`;
  }

  function setPalette(paletteName) {
    const palette = getNormalizedPaletteId(paletteName);
    state.currentPalette = palette;
    state.currentPaletteByGroup = state.currentPaletteByGroup || {};
    state.currentPaletteByGroup[getCurrentPaletteGroupId()] = palette;
    document.body.classList.remove("palette-night", "palette-frost", "palette-green", "palette-red");
    PALETTE_VARIABLE_NAMES.forEach((variableName) => document.body.style.removeProperty(variableName));

    if (palette === "night" || palette === "frost" || palette === "green" || palette === "red") {
      document.body.classList.add(`palette-${palette}`);
    }

    const builtinIds = new Set(getBuiltinPalettesForTheme(getCurrentThemeId()).map((entry) => entry.id));
    if (!builtinIds.has(palette)) {
      const customPalette = state.customPalettes.find((entry) => entry.id === palette);
      if (customPalette?.variables) {
        Object.entries(customPalette.variables).forEach(([variableName, value]) => {
          document.body.style.setProperty(variableName, value);
        });
      }
    }

    const paletteOptions = els.palettePopover?.querySelectorAll(".palette-option") || [];
    paletteOptions.forEach((option) => {
      option.classList.toggle("active", option.dataset.paletteValue === palette);
    });
  }

  function renderBuiltInPaletteButtons() {
    if (!els.palettePopover || !els.addPaletteButton) return;
    els.palettePopover.querySelectorAll(".palette-option.builtin-palette").forEach((node) => node.remove());
    getBuiltinPalettesForTheme(getCurrentThemeId()).forEach((palette) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "palette-option builtin-palette";
      button.dataset.paletteValue = palette.id;
      button.textContent = palette.label;
      els.palettePopover.insertBefore(button, els.addPaletteButton);
    });
  }

  function syncThemeGroup() {
    renderBuiltInPaletteButtons();
    renderCustomPaletteButtons();
    setPalette(getStoredPaletteForCurrentTheme());
  }

  function togglePopover(force) {
    if (!els.palettePopover || !els.paletteToggle) return;
    const isOpen = !els.palettePopover.hidden;
    const shouldOpen = typeof force === "boolean" ? force : !isOpen;
    els.palettePopover.hidden = !shouldOpen;
    els.paletteToggle.classList.toggle("active", shouldOpen);
    if (shouldOpen) requestAnimationFrame(positionPopover);
  }

  function setup() {
    els.addPaletteButton.addEventListener("click", (event) => {
      event.stopPropagation();
      createCustomPaletteFromCurrent();
    });
    syncThemeGroup();
    window.addEventListener("resize", positionPopover);
    window.addEventListener("scroll", positionPopover, true);
  }

  function renderCustomPaletteButtons() {
    if (!els.palettePopover) return;
    els.palettePopover.querySelectorAll(".palette-option.custom-palette").forEach((node) => node.remove());
    state.customPalettes.forEach((palette) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "palette-option custom-palette";
      button.dataset.paletteValue = palette.id;
      button.textContent = palette.name;
      els.palettePopover.insertBefore(button, els.addPaletteButton);
    });
  }

  // Custom palettes snapshot the current CSS variables, so creators can tweak
  // the live theme first and save the result afterward.
  function createCustomPaletteFromCurrent() {
    if (!state.editMode) return;
    const defaultName = `Custom ${state.customPalettes.length + 1}`;
    const name = window.prompt("Название палитры", defaultName);
    if (!name || !name.trim()) return;

    const style = getComputedStyle(document.body);
    const variables = {};
    PALETTE_VARIABLE_NAMES.forEach((variableName) => {
      variables[variableName] = style.getPropertyValue(variableName).trim();
    });

    const customPalette = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      variables,
    };
    state.customPalettes.push(customPalette);
    renderCustomPaletteButtons();
    setPalette(customPalette.id);
  }

  return {
    setPalette,
    setup,
    syncThemeGroup,
    togglePopover,
  };
}
