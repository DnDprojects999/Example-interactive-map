import {
  getLanguages,
  getLocalizedText,
  getUserFacingLanguages,
} from "../localization.js";
import { getUiText } from "../uiLocale.js";
import { normalizeHomebrewType } from "./homebrewShared.js";

export function getAvailableHomebrewLanguages(state) {
  const languages = state.editMode ? getLanguages(state.worldData) : getUserFacingLanguages(state.worldData);
  return languages.length ? languages : getLanguages(state.worldData);
}

export function getHomebrewTypeLabel(state, type) {
  return getUiText(state, `homebrew_type_${normalizeHomebrewType(type)}`);
}

export function getLocalizedHomebrewCategoryTitle(category, state) {
  return getLocalizedText(category, "title", state, getUiText(state, "homebrew_all_categories"));
}

export function getLocalizedHomebrewArticleText(article, field, state, fallback = "") {
  return getLocalizedText(article, field, state, fallback);
}

export function getSortedHomebrewCategories(state) {
  return [...(state.homebrewCategoriesData || [])].sort((a, b) => {
    const orderDiff = Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
    if (orderDiff !== 0) return orderDiff;
    return getLocalizedHomebrewCategoryTitle(a, state).localeCompare(
      getLocalizedHomebrewCategoryTitle(b, state),
      state.currentLanguage,
    );
  });
}

export function getSortedHomebrewArticles(state) {
  return [...(state.homebrewArticlesData || [])].sort((a, b) => {
    const orderDiff = Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
    if (orderDiff !== 0) return orderDiff;
    return getLocalizedHomebrewArticleText(a, "title", state, "").localeCompare(
      getLocalizedHomebrewArticleText(b, "title", state, ""),
      state.currentLanguage,
    );
  });
}

export function getVisibleHomebrewArticles(state) {
  const type = normalizeHomebrewType(state.currentHomebrewType);
  const activeCategoryId = String(state.currentHomebrewCategoryId || "all");
  const query = String(state.homebrewSearchQuery || "").trim().toLowerCase();

  return getSortedHomebrewArticles(state).filter((article) => {
    if (normalizeHomebrewType(article.type) !== type) return false;
    if (activeCategoryId !== "all" && !Array.isArray(article.categoryIds)) return false;
    if (activeCategoryId !== "all" && !article.categoryIds.includes(activeCategoryId)) return false;
    if (!query) return true;

    const haystacks = [
      getLocalizedHomebrewArticleText(article, "title", state, ""),
      getLocalizedHomebrewArticleText(article, "summary", state, ""),
      getLocalizedHomebrewArticleText(article, "content", state, ""),
    ].map((entry) => String(entry || "").toLowerCase());

    return haystacks.some((entry) => entry.includes(query));
  });
}

export function buildHomebrewCategoryMeta(article, state) {
  const categories = (article.categoryIds || [])
    .map((categoryId) => (state.homebrewCategoriesData || []).find((entry) => entry.id === categoryId))
    .filter(Boolean)
    .map((category) => getLocalizedHomebrewCategoryTitle(category, state));
  return categories.join(" / ");
}
