import { getDefaultLanguage } from "../localization.js";
import { getUiText } from "../uiLocale.js";

export const DEFAULT_MARKER_COPY = Object.freeze({
  ru: Object.freeze({
    title: "Новая метка",
    type: "Новый тип",
    imageText: "Добавь подпись для иллюстрации в панели справа.",
    description: "Добавь описание в правой панели.",
    facts: Object.freeze(["Факт 1", "Факт 2", "Факт 3"]),
  }),
  en: Object.freeze({
    title: "New marker",
    type: "New type",
    imageText: "Add a caption for the illustration in the right panel.",
    description: "Add a description in the right panel.",
    facts: Object.freeze(["Fact 1", "Fact 2", "Fact 3"]),
  }),
});

export function getPrimaryEditorLanguage(worldData) {
  return getDefaultLanguage(worldData) === "en" ? "en" : "ru";
}

function cloneMarkerCopy(languageCode) {
  const copy = DEFAULT_MARKER_COPY[languageCode] || DEFAULT_MARKER_COPY.ru;
  return {
    title: copy.title,
    type: copy.type,
    imageText: copy.imageText,
    description: copy.description,
    facts: [...copy.facts],
  };
}

export function buildDefaultMarkerFields(worldData) {
  const baseLanguage = getPrimaryEditorLanguage(worldData);
  const translations = {};

  Object.keys(DEFAULT_MARKER_COPY).forEach((languageCode) => {
    if (languageCode === baseLanguage) return;
    translations[languageCode] = cloneMarkerCopy(languageCode);
  });

  return {
    ...cloneMarkerCopy(baseLanguage),
    translations,
  };
}

export function buildLocalizedLayerName(worldData, baseRu, baseEn) {
  if (getPrimaryEditorLanguage(worldData) === "en") {
    return {
      name: baseEn,
      translations: {
        ru: { name: baseRu },
      },
    };
  }

  return {
    name: baseRu,
    translations: {
      en: { name: baseEn },
    },
  };
}

export function getDrawLayerFallbackName(state, index) {
  return getUiText(state, "draw_layer_label", { index });
}
