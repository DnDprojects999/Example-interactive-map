import { getLocalizedText } from "../localization.js";

// Player-side favorites and navigation only need lightweight target references.
// This module normalizes, resolves, and describes those references centrally so
// the sidebar does not have to duplicate entity lookups for each target type.
function normalizeTarget(target) {
  if (!target || typeof target !== "object" || !target.type || !target.id) return null;
  return {
    type: String(target.type),
    id: String(target.id),
    groupId: target.groupId ? String(target.groupId) : undefined,
  };
}

function isSameTarget(left, right) {
  return Boolean(
    left
    && right
    && left.type === right.type
    && left.id === right.id
    && String(left.groupId || "") === String(right.groupId || ""),
  );
}

function findMarker(state, target) {
  return (state.markersData || []).find((entry) => entry.id === target.id) || null;
}

function findTimelineEvent(state, target) {
  return (state.eventsData || []).find((entry) => entry.id === target.id) || null;
}

function findArchiveGroup(state, target) {
  return (state.archiveData || []).find((entry) => entry.id === target.id) || null;
}

function findArchiveItem(state, target) {
  const group = (state.archiveData || []).find((entry) => entry.id === target.groupId) || null;
  if (!group) return null;
  const item = (group.items || []).find((entry) => entry.id === target.id) || null;
  if (!item) return null;
  return { group, item };
}

function findHeroGroup(state, target) {
  return (state.heroesData || []).find((entry) => entry.id === target.id) || null;
}

function findHeroItem(state, target) {
  const group = (state.heroesData || []).find((entry) => entry.id === target.groupId) || null;
  if (!group) return null;
  const hero = (group.items || []).find((entry) => entry.id === target.id) || null;
  if (!hero) return null;
  return { group, hero };
}

const TARGET_RESOLVERS = {
  marker(state, target) {
    const marker = findMarker(state, target);
    if (!marker) return null;
    return {
      badge: "Map",
      record: marker,
      titleField: "title",
      subtitleField: "type",
      fallbackTitle: "Map marker",
      fallbackSubtitle: "Map",
    };
  },
  timeline(state, target) {
    const event = findTimelineEvent(state, target);
    if (!event) return null;
    return {
      badge: "Time",
      record: event,
      titleField: "title",
      subtitleField: "year",
      fallbackTitle: "Timeline event",
      fallbackSubtitle: "Timeline",
    };
  },
  archiveGroup(state, target) {
    const group = findArchiveGroup(state, target);
    if (!group) return null;
    return {
      badge: "Archive",
      record: group,
      titleField: "title",
      subtitleField: null,
      fallbackTitle: "Archive section",
      fallbackSubtitle: "Archive",
    };
  },
  archiveItem(state, target) {
    const resolved = findArchiveItem(state, target);
    if (!resolved) return null;
    return {
      badge: "Archive",
      record: resolved.item,
      parentRecord: resolved.group,
      titleField: "title",
      subtitleField: null,
      parentSubtitleField: "title",
      fallbackTitle: "Archive card",
      fallbackSubtitle: "Archive",
    };
  },
  heroGroup(state, target) {
    const group = findHeroGroup(state, target);
    if (!group) return null;
    return {
      badge: "Heroes",
      record: group,
      titleField: "title",
      subtitleField: "subtitle",
      fallbackTitle: "Hero group",
      fallbackSubtitle: "Hall of Heroes",
    };
  },
  heroItem(state, target) {
    const resolved = findHeroItem(state, target);
    if (!resolved) return null;
    return {
      badge: "Heroes",
      record: resolved.hero,
      parentRecord: resolved.group,
      titleField: "title",
      subtitleField: null,
      parentSubtitleField: "title",
      fallbackTitle: "Hero",
      fallbackSubtitle: "Hall of Heroes",
    };
  },
};

function resolveTarget(state, target) {
  const normalized = normalizeTarget(target);
  if (!normalized) return null;

  const resolved = TARGET_RESOLVERS[normalized.type]?.(state, normalized) || null;
  if (!resolved) return null;

  return {
    ...resolved,
    target: normalized,
  };
}

function describeTarget(state, target) {
  const resolved = resolveTarget(state, target);
  if (!resolved) return null;

  const title = resolved.titleField
    ? getLocalizedText(resolved.record, resolved.titleField, state, resolved.fallbackTitle)
    : resolved.fallbackTitle;

  const subtitleSource = resolved.parentRecord && resolved.parentSubtitleField
    ? resolved.parentRecord
    : resolved.record;
  const subtitleField = resolved.parentRecord && resolved.parentSubtitleField
    ? resolved.parentSubtitleField
    : resolved.subtitleField;
  const subtitle = subtitleField
    ? getLocalizedText(subtitleSource, subtitleField, state, resolved.fallbackSubtitle)
    : resolved.fallbackSubtitle;

  return {
    title,
    subtitle,
    badge: resolved.badge,
  };
}

function createHeroKey(groupId, heroId) {
  return `${groupId}::${heroId}`;
}

function parseHeroKey(value) {
  const [groupId, id] = String(value || "").split("::");
  if (!groupId || !id) return null;
  return { groupId, id };
}

export {
  normalizeTarget,
  isSameTarget,
  resolveTarget,
  describeTarget,
  createHeroKey,
  parseHeroKey,
};
