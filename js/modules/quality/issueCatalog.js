export const ISSUE_SCOPE_CATALOG = Object.freeze({
  map: { labelKey: "audit_scope_map" },
  timeline: { labelKey: "audit_scope_timeline" },
  archive: { labelKey: "audit_scope_archive" },
  heroes: { labelKey: "audit_scope_heroes" },
  homebrew: { labelKey: "audit_scope_homebrew" },
  id: { labelKey: "audit_scope_id" },
  routes: { labelKey: "audit_scope_routes" },
});

export const ISSUE_CATALOG = Object.freeze({
  "duplicate-id": { titleKey: "audit_issue_duplicate_id", severity: "warning" },
  "blank-marker-title": { titleKey: "audit_issue_blank_marker_title", severity: "warning" },
  "blank-marker-description": { titleKey: "audit_issue_blank_marker_description", severity: "warning" },
  "blank-facts": { titleKey: "audit_issue_blank_facts", severity: "warning" },
  "image-caption-without-image": { titleKey: "audit_issue_image_caption_without_image", severity: "warning" },
  "long-title": { titleKey: "audit_issue_long_title", severity: "warning" },
  "suspicious-image-url": { titleKey: "audit_issue_suspicious_image_url", severity: "warning" },
  "heavy-data-url": { titleKey: "audit_issue_heavy_data_url", severity: "warning" },
  "blank-timeline-title": { titleKey: "audit_issue_blank_timeline_title", severity: "warning" },
  "blank-timeline-description": { titleKey: "audit_issue_blank_timeline_description", severity: "warning" },
  "long-sidebar-label": { titleKey: "audit_issue_long_sidebar_label", severity: "warning" },
  "blank-archive-group": { titleKey: "audit_issue_blank_archive_group", severity: "warning" },
  "blank-archive-title": { titleKey: "audit_issue_blank_archive_title", severity: "warning" },
  "blank-archive-description": { titleKey: "audit_issue_blank_archive_description", severity: "warning" },
  "blank-archive-full": { titleKey: "audit_issue_blank_archive_full", severity: "warning" },
  "missing-preview": { titleKey: "audit_issue_missing_preview", severity: "warning" },
  "missing-symbol": { titleKey: "audit_issue_missing_symbol", severity: "warning" },
  "long-image-label": { titleKey: "audit_issue_long_image_label", severity: "warning" },
  "blank-hero-group": { titleKey: "audit_issue_blank_hero_group", severity: "warning" },
  "blank-hero-group-subtitle": { titleKey: "audit_issue_blank_hero_group_subtitle", severity: "warning" },
  "blank-hero-title": { titleKey: "audit_issue_blank_hero_title", severity: "warning" },
  "blank-hero-role": { titleKey: "audit_issue_blank_hero_role", severity: "warning" },
  "blank-hero-description": { titleKey: "audit_issue_blank_hero_description", severity: "warning" },
  "blank-hero-full": { titleKey: "audit_issue_blank_hero_full", severity: "warning" },
  "missing-hero-portrait": { titleKey: "audit_issue_missing_hero_portrait", severity: "warning" },
  "blank-homebrew-category": { titleKey: "audit_issue_blank_homebrew_category", severity: "warning" },
  "blank-homebrew-title": { titleKey: "audit_issue_blank_homebrew_title", severity: "warning" },
  "blank-homebrew-summary": { titleKey: "audit_issue_blank_homebrew_summary", severity: "warning" },
  "blank-homebrew-content": { titleKey: "audit_issue_blank_homebrew_content", severity: "warning" },
  "missing-pinned-marker": { titleKey: "audit_issue_missing_pinned_marker", severity: "warning" },
  "route-unfinished": { titleKey: "audit_issue_route_unfinished", severity: "warning" },
  "route-out-of-bounds": { titleKey: "audit_issue_route_out_of_bounds", severity: "warning" },
});

export function getIssueDefinition(code) {
  return ISSUE_CATALOG[code] || null;
}

export function getIssueScopeDefinition(scope) {
  return ISSUE_SCOPE_CATALOG[scope] || null;
}
