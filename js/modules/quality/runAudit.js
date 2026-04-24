import { auditMapMarker } from "./rules/mapRules.js";
import { auditTimelineEvent } from "./rules/timelineRules.js";
import { auditArchiveGroup, auditArchiveItem } from "./rules/archiveRules.js";
import { auditHeroGroup, auditHeroItem } from "./rules/heroesRules.js";
import { auditHomebrewCategory, auditHomebrewArticle } from "./rules/homebrewRules.js";
import { reportDuplicateIds } from "./utils.js";

export function runAudit(state) {
  const issues = [];
  const idsRegistry = new Map();

  (state.markersData || []).forEach((marker) => auditMapMarker(issues, idsRegistry, marker));
  (state.eventsData || []).forEach((event) => auditTimelineEvent(issues, idsRegistry, event));

  (state.archiveData || []).forEach((group) => {
    auditArchiveGroup(issues, idsRegistry, group);
    (group.items || []).forEach((item) => auditArchiveItem(issues, idsRegistry, group, item));
  });

  (state.heroesData || []).forEach((group) => {
    auditHeroGroup(issues, idsRegistry, group);
    (group.items || []).forEach((hero) => auditHeroItem(issues, idsRegistry, group, hero));
  });

  (state.homebrewCategoriesData || []).forEach((category) => auditHomebrewCategory(issues, idsRegistry, category));
  (state.homebrewArticlesData || []).forEach((article) => auditHomebrewArticle(issues, idsRegistry, article));

  reportDuplicateIds(issues, idsRegistry);
  return issues;
}
