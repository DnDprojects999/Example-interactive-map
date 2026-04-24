import { getLocalizedText } from "../localization.js";
import { fixMojibake } from "./utils.js";
import { getIssueDefinition, getIssueScopeDefinition } from "./issueCatalog.js";

function getIssueTargetLabel(issue, state, getUiText = null) {
  const target = issue?.target;
  if (!target || !state) return "";
  const t = (key, fallback) => (typeof getUiText === "function" ? getUiText(key) : fallback);

  if (target.type === "marker") {
    const marker = state.markersData?.find?.((entry) => entry.id === target.id);
    return marker ? getLocalizedText(marker, "title", state, t("marker_untitled", "Marker")) : "";
  }
  if (target.type === "timeline") {
    const event = state.eventsData?.find?.((entry) => entry.id === target.id);
    return event ? getLocalizedText(event, "title", state, t("timeline_event", "Timeline event")) : "";
  }
  if (target.type === "archiveGroup") {
    const group = state.archiveData?.find?.((entry) => entry.id === target.id);
    return group ? getLocalizedText(group, "title", state, t("archive_group_fallback", "Archive section")) : "";
  }
  if (target.type === "archiveItem") {
    const group = state.archiveData?.find?.((entry) => entry.id === target.groupId);
    const item = group?.items?.find?.((entry) => entry.id === target.id);
    return item ? getLocalizedText(item, "title", state, t("archive_item_title_fallback", "Archive card")) : "";
  }
  if (target.type === "heroGroup") {
    const group = state.heroesData?.find?.((entry) => entry.id === target.id);
    return group ? getLocalizedText(group, "title", state, t("heroes_group_fallback", "Hero group")) : "";
  }
  if (target.type === "heroItem") {
    const group = state.heroesData?.find?.((entry) => entry.id === target.groupId);
    const hero = group?.items?.find?.((entry) => entry.id === target.id);
    return hero ? getLocalizedText(hero, "title", state, t("heroes_new_hero", "Hero")) : "";
  }
  if (target.type === "homebrewCategory") {
    const category = state.homebrewCategoriesData?.find?.((entry) => entry.id === target.id);
    return category ? getLocalizedText(category, "title", state, t("homebrew_category_new", "Homebrew category")) : "";
  }
  if (target.type === "homebrewArticle") {
    const article = state.homebrewArticlesData?.find?.((entry) => entry.id === target.id);
    return article ? getLocalizedText(article, "title", state, t("homebrew_article_new", "Homebrew article")) : "";
  }
  return "";
}

function getIssueFallbackTitle(issue, getUiText = null) {
  const targetType = issue?.target?.type || "";
  const t = (key, fallback) => (typeof getUiText === "function" ? getUiText(key) : fallback);
  if (targetType === "archiveItem") return t("search_label_archive_card", "Archive card");
  if (targetType === "archiveGroup") return t("search_label_archive_section", "Archive section");
  if (targetType === "heroItem") return t("search_label_hero", "Hero");
  if (targetType === "heroGroup") return t("search_label_hero_group", "Hero group");
  if (targetType === "marker") return t("search_label_map", "Map");
  if (targetType === "timeline") return t("mode_timeline", "Timeline");
  if (targetType === "homebrewCategory" || targetType === "homebrewArticle") return t("mode_homebrew", "Homebrew");
  return "";
}

export function formatIssue(issue, state, getUiText = null) {
  const t = (key, fallback = "") => (typeof getUiText === "function" ? getUiText(key) : fallback || key);
  const fixedScope = fixMojibake(issue.scope);
  const issueDefinition = getIssueDefinition(issue.code);
  const scopeDefinition = getIssueScopeDefinition(fixedScope);
  const targetLabel = getIssueTargetLabel(issue, state, getUiText);

  return {
    ...issue,
    scope: fixedScope,
    scopeLabel: (scopeDefinition?.labelKey && t(scopeDefinition.labelKey, fixedScope)) || fixedScope,
    title:
      (issueDefinition?.titleKey && t(issueDefinition.titleKey, "")) ||
      getIssueFallbackTitle(issue, getUiText) ||
      fixMojibake(issue.message),
    targetLabel: targetLabel || fixMojibake(issue.message),
    severity: issueDefinition?.severity || "warning",
  };
}
