// Small config module for editor UI constants that are shared across controls.
export const MAP_TEXT_FONTS = [
  "Cinzel",
  "Inter",
  "Georgia",
  "Times New Roman",
  "Arial",
  "Verdana",
  "Trebuchet MS",
  "Palatino",
  "Garamond",
  "Courier New",
];

export const PALETTE_VARIABLE_NAMES = [
  "--map-fill",
  "--map-border",
  "--grid-line",
  "--fog-a",
  "--fog-b",
  "--fog-c",
  "--archive-accent",
  "--archive-paper",
  "--timeline-accent",
  "--timeline-star",
];

export const DEFAULT_THEME_GROUP_ID = "default";

export const BUILTIN_PALETTE_GROUPS = Object.freeze({
  [DEFAULT_THEME_GROUP_ID]: Object.freeze([
    { id: "ember", label: "Ember" },
    { id: "night", label: "Night" },
    { id: "frost", label: "Frost" },
  ]),
  "serkonia-command": Object.freeze([
    { id: "blue", label: "Blue" },
    { id: "green", label: "Green" },
    { id: "red", label: "Red" },
  ]),
});

export const BUILTIN_PALETTE_ALIASES = Object.freeze({
  verdant: "green",
  crimson: "red",
});

export const BASE_PALETTE_NAMES = Object.freeze(
  Array.from(new Set(Object.values(BUILTIN_PALETTE_GROUPS).flat().map((entry) => entry.id))),
);

export function getPaletteGroupId(themeId) {
  return BUILTIN_PALETTE_GROUPS[themeId] ? themeId : DEFAULT_THEME_GROUP_ID;
}

export function getBuiltinPalettesForTheme(themeId) {
  return BUILTIN_PALETTE_GROUPS[getPaletteGroupId(themeId)];
}

export function getDefaultPaletteForTheme(themeId) {
  return getBuiltinPalettesForTheme(themeId)[0]?.id || "ember";
}

export const DRAW_BRUSH_PALETTE = [
  { value: "#7dd3fc", labelRu: "\u041b\u0435\u0434\u044f\u043d\u043e\u0439", labelEn: "Ice" },
  { value: "#60a5fa", labelRu: "\u0421\u0438\u043d\u0438\u0439", labelEn: "Blue" },
  { value: "#fca5a5", labelRu: "\u0410\u043b\u044b\u0439", labelEn: "Scarlet" },
  { value: "#fbbf24", labelRu: "\u0417\u043e\u043b\u043e\u0442\u043e\u0439", labelEn: "Gold" },
  { value: "#86efac", labelRu: "\u0417\u0435\u043b\u0451\u043d\u044b\u0439", labelEn: "Green" },
  { value: "#c4b5fd", labelRu: "\u0424\u0438\u0430\u043b\u043a\u043e\u0432\u044b\u0439", labelEn: "Violet" },
  { value: "#f9fafb", labelRu: "\u0421\u0432\u0435\u0442\u043b\u044b\u0439", labelEn: "Light" },
];
