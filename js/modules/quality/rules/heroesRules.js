import {
  AUDIT_LIMITS,
  reportBlankField,
  reportLengthField,
  reportImageUrlIssues,
  addIssueIf,
  registerEntityId,
} from "../utils.js";

export function auditHeroGroup(issues, registry, group) {
  const target = { type: "heroGroup", id: group.id };
  registerEntityId(registry, "heroGroup", "групп героев", group.id, target);

  reportBlankField(issues, "heroes", "blank-hero-group", group.title, group.id, target);
  reportBlankField(issues, "heroes", "blank-hero-group-subtitle", group.subtitle, group.title || group.id, target);
  reportLengthField(issues, "heroes", "long-title", group.title, group.title, target, AUDIT_LIMITS.title);
}

export function auditHeroItem(issues, registry, group, hero) {
  const target = { type: "heroItem", id: hero.id, groupId: group.id };
  registerEntityId(
    registry,
    `heroItem:${group.id}`,
    `героев в группе "${group.title || group.id}"`,
    hero.id,
    target,
  );

  reportBlankField(issues, "heroes", "blank-hero-title", hero.title, group.title || group.id, target);
  reportBlankField(issues, "heroes", "blank-hero-role", hero.role, hero.title || hero.id, target);
  reportBlankField(issues, "heroes", "blank-hero-description", hero.description, hero.title || hero.id, target);
  reportBlankField(issues, "heroes", "blank-hero-full", hero.fullDescription, hero.title || hero.id, target);
  addIssueIf(!String(hero.imageUrl || "").trim(), issues, "missing-hero-portrait", "heroes", hero.title || hero.id, target);
  reportLengthField(issues, "heroes", "long-title", hero.title, hero.title, target, AUDIT_LIMITS.title);
  reportLengthField(issues, "heroes", "long-image-label", hero.imageLabel, hero.title || hero.id, target, AUDIT_LIMITS.imageLabel);
  reportImageUrlIssues(issues, "heroes", hero.title || hero.id, hero.imageUrl, target);
}
