import { isFactionArchiveGroup, getArchiveItemSymbolUrl } from "../../factionSymbols.js";
import {
  AUDIT_LIMITS,
  reportBlankField,
  reportLengthField,
  reportImageUrlIssues,
  addIssueIf,
  isTooLong,
  registerEntityId,
} from "../utils.js";

export function auditArchiveGroup(issues, registry, group) {
  const target = { type: "archiveGroup", id: group.id };
  registerEntityId(registry, "archiveGroup", "глав архива", group.id, target);

  reportBlankField(issues, "archive", "blank-archive-group", group.title, group.id, target);
  reportLengthField(issues, "archive", "long-title", group.title, group.title, target, AUDIT_LIMITS.title);
}

export function auditArchiveItem(issues, registry, group, item) {
  const target = { type: "archiveItem", id: item.id, groupId: group.id };
  registerEntityId(
    registry,
    `archiveItem:${group.id}`,
    `карточек архива в главе "${group.title || group.id}"`,
    item.id,
    target,
  );

  reportBlankField(issues, "archive", "blank-archive-title", item.title, group.title || group.id, target);
  reportBlankField(issues, "archive", "blank-archive-description", item.description, item.title || item.id, target);
  reportBlankField(issues, "archive", "blank-archive-full", item.fullDescription, item.title || item.id, target);
  addIssueIf(!String(item.imageUrl || "").trim(), issues, "missing-preview", "archive", item.title || item.id, target);
  addIssueIf(
    Boolean(isFactionArchiveGroup(group) && !getArchiveItemSymbolUrl(item)),
    issues,
    "missing-symbol",
    "archive",
    item.title || item.id,
    target,
  );
  reportLengthField(issues, "archive", "long-title", item.title, item.title, target, AUDIT_LIMITS.title);
  addIssueIf(
    isTooLong(item.imageLabel, AUDIT_LIMITS.imageLabel) || isTooLong(item.expandedImageLabel, AUDIT_LIMITS.imageLabel),
    issues,
    "long-image-label",
    "archive",
    item.title || item.id,
    target,
  );
  reportImageUrlIssues(issues, "archive", item.title || item.id, item.imageUrl, target);
  reportImageUrlIssues(issues, "archive", item.title || item.id, item.expandedImageUrl, target);
}
