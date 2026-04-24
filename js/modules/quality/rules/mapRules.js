import {
  AUDIT_LIMITS,
  reportBlankField,
  reportLengthField,
  reportImageUrlIssues,
  addIssueIf,
  registerEntityId,
  isBlankOrPlaceholder,
} from "../utils.js";

export function auditMapMarker(issues, registry, marker) {
  const target = { type: "marker", id: marker.id };
  registerEntityId(registry, "marker", "карты", marker.id, target);

  reportBlankField(issues, "map", "blank-marker-title", marker.title, marker.title || marker.id, target);
  reportBlankField(issues, "map", "blank-marker-description", marker.description, marker.title || marker.id, target);
  reportLengthField(issues, "map", "long-title", marker.title, marker.title, target, AUDIT_LIMITS.title);
  addIssueIf(
    Boolean(marker.imageText && !marker.imageUrl),
    issues,
    "image-caption-without-image",
    "map",
    marker.title || marker.id,
    target,
  );

  const facts = Array.isArray(marker.facts) ? marker.facts : [];
  addIssueIf(
    facts.length < 3 || facts.some(isBlankOrPlaceholder),
    issues,
    "blank-facts",
    "map",
    marker.title || marker.id,
    target,
  );

  reportImageUrlIssues(issues, "map", marker.title || marker.id, marker.imageUrl, target);
  reportLengthField(
    issues,
    "map",
    "long-image-label",
    marker.imageText,
    marker.title || marker.id,
    target,
    AUDIT_LIMITS.imageLabel,
  );
}
