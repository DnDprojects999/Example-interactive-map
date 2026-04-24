export const DEFAULT_SITE_THEME_ID = "serkonia";

export const SITE_THEME_VARIABLE_NAMES = [
  "--theme-body-bg",
  "--theme-loading-bg",
  "--theme-topbar-bg",
  "--theme-sidebar-bg",
  "--theme-popover-bg",
  "--theme-shell-panel-bg",
  "--theme-surface-bg",
  "--theme-surface-strong-bg",
  "--theme-surface-border",
  "--theme-accent-glow",
  "--theme-topbar-control-radius",
  "--theme-topbar-control-clip",
  "--font-ui",
  "--font-title",
  "--font-sidebar",
];

export const BUILTIN_SITE_THEMES = Object.freeze([
  {
    id: DEFAULT_SITE_THEME_ID,
    labels: {
      ru: "\u0421\u0435\u0440\u043a\u043e\u043d\u0438\u044f",
      en: "Serkonia",
    },
    variables: {},
  },
  {
    id: "serkonia-command",
    labels: {
      ru: "\u041a\u043e\u043c\u0430\u043d\u0434\u043d\u0430\u044f \u043f\u0430\u043b\u0443\u0431\u0430",
      en: "Command Deck",
    },
    variables: {
      "--theme-body-bg": "radial-gradient(circle at 20% 16%, rgba(51, 191, 255, .14), transparent 24%), radial-gradient(circle at 82% 18%, rgba(111, 66, 193, .18), transparent 26%), linear-gradient(180deg, #04080f, #07111c 42%, #05070d)",
      "--theme-loading-bg": "radial-gradient(circle at 50% 30%, rgba(74, 226, 255, .2), transparent 20%), radial-gradient(circle at 18% 18%, rgba(89, 173, 255, .16), transparent 24%), radial-gradient(circle at 80% 76%, rgba(120, 96, 255, .12), transparent 22%), linear-gradient(180deg, #02050a, #06101b 58%, #03060c)",
      "--theme-topbar-bg": "linear-gradient(180deg, rgba(4, 12, 22, .98), rgba(3, 9, 18, .95))",
      "--theme-sidebar-bg": "linear-gradient(180deg, rgba(5, 13, 24, .92), rgba(6, 10, 17, .74))",
      "--theme-popover-bg": "linear-gradient(180deg, rgba(7, 17, 30, .98), rgba(6, 11, 20, .97))",
      "--theme-shell-panel-bg": "linear-gradient(180deg, rgba(6, 13, 24, .98), rgba(4, 9, 17, .96))",
      "--theme-surface-bg": "rgba(74, 226, 255, .05)",
      "--theme-surface-strong-bg": "rgba(74, 226, 255, .08)",
      "--theme-surface-border": "rgba(74, 226, 255, .2)",
      "--theme-accent-glow": "rgba(74, 226, 255, .16)",
      "--theme-topbar-control-radius": "0px",
      "--theme-topbar-control-clip": "none",
      "--font-ui": "\"Oxanium\", \"Inter\", Arial, sans-serif",
      "--font-title": "\"Oxanium\", \"Inter\", Arial, sans-serif",
      "--font-sidebar": "\"Oxanium\", \"Inter\", Arial, sans-serif",
    },
  },
]);

function normalizeThemeId(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return BUILTIN_SITE_THEMES.some((theme) => theme.id === normalized) ? normalized : DEFAULT_SITE_THEME_ID;
}

function getBuiltinTheme(themeId) {
  return BUILTIN_SITE_THEMES.find((theme) => theme.id === themeId) || BUILTIN_SITE_THEMES[0];
}

function normalizeThemeOverrides(rawValue) {
  if (!rawValue || typeof rawValue !== "object") return {};
  return SITE_THEME_VARIABLE_NAMES.reduce((entry, variableName) => {
    const value = String(rawValue[variableName] || "").trim();
    if (value) entry[variableName] = value;
    return entry;
  }, {});
}

export function normalizeSiteThemeConfig(rawValue = {}) {
  const raw = rawValue && typeof rawValue === "object" ? rawValue : {};
  return {
    siteThemeId: normalizeThemeId(raw.siteThemeId),
    siteThemeOverrides: normalizeThemeOverrides(raw.siteThemeOverrides),
  };
}

export function getSiteThemeLabel(themeId, languageCode = "ru") {
  const theme = getBuiltinTheme(normalizeThemeId(themeId));
  const language = String(languageCode || "ru").trim().toLowerCase().startsWith("en") ? "en" : "ru";
  return theme.labels?.[language] || theme.labels?.ru || theme.id;
}

export function applySiteTheme(target, rawConfig = {}) {
  if (!target) return;

  const normalized = normalizeSiteThemeConfig(rawConfig);
  const builtinTheme = getBuiltinTheme(normalized.siteThemeId);
  target.dataset.siteTheme = normalized.siteThemeId;
  SITE_THEME_VARIABLE_NAMES.forEach((variableName) => target.style.removeProperty(variableName));
  Object.entries(builtinTheme.variables || {}).forEach(([variableName, value]) => {
    target.style.setProperty(variableName, value);
  });
  Object.entries(normalized.siteThemeOverrides).forEach(([variableName, value]) => {
    target.style.setProperty(variableName, value);
  });
}
