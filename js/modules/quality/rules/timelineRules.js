import {
  AUDIT_LIMITS,
  reportBlankField,
  reportLengthField,
  addIssueIf,
  isTooLong,
  registerEntityId,
} from "../utils.js";

export function auditTimelineEvent(issues, registry, event) {
  const target = { type: "timeline", id: event.id };
  registerEntityId(registry, "timelineEvent", "Timeline", event.id, target);

  reportBlankField(issues, "Timeline", "blank-timeline-title", event.title, event.year || event.id, target);
  reportBlankField(issues, "Timeline", "blank-timeline-description", event.description, event.title || event.id, target);
  reportLengthField(issues, "Timeline", "long-title", event.title, event.title, target, AUDIT_LIMITS.title);
  addIssueIf(
    Boolean(event.sidebarShortcut && isTooLong(event.sidebarShortcutLabel, AUDIT_LIMITS.label)),
    issues,
    "long-sidebar-label",
    "Timeline",
    event.title || event.id,
    target,
  );
}
