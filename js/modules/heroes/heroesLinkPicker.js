import { getLocalizedText } from "../localization.js";
import { getUiText } from "../uiLocale.js";

function createLinkCandidates(state, type) {
  if (type === "marker") {
    return (state.markersData || []).map((marker) => ({
      type,
      id: marker.id,
      label: getLocalizedText(marker, "title", state, getUiText(state, "marker_untitled")),
      detail: getLocalizedText(marker, "type", state, getUiText(state, "search_label_map")),
    }));
  }

  if (type === "timeline") {
    return (state.eventsData || []).map((event) => ({
      type,
      id: event.id,
      label: getLocalizedText(event, "title", state, getUiText(state, "timeline_event")),
      detail: getLocalizedText(event, "year", state, "Timeline"),
    }));
  }

  if (type === "archiveItem") {
    return (state.archiveData || []).flatMap((group) =>
      (group.items || []).map((item) => ({
        type,
        id: item.id,
        groupId: group.id,
        label: getLocalizedText(item, "title", state, getUiText(state, "archive_record")),
        detail: getLocalizedText(group, "title", state, getUiText(state, "mode_archive")),
      })),
    );
  }

  if (type === "heroItem") {
    return (state.heroesData || []).flatMap((group) =>
      (group.items || []).map((hero) => ({
        type,
        id: hero.id,
        groupId: group.id,
        label: getLocalizedText(hero, "title", state, getUiText(state, "heroes_new_hero")),
        detail: getLocalizedText(group, "title", state, getUiText(state, "search_label_hero_group")),
      })),
    );
  }

  return [];
}

export function askForHeroLink(state) {
  const typeRaw = window.prompt(getUiText(state, "heroes_link_type_prompt"), "timeline");
  if (!typeRaw) return null;

  const typeMap = {
    map: "marker",
    marker: "marker",
    timeline: "timeline",
    archive: "archiveItem",
    hero: "heroItem",
  };
  const type = typeMap[typeRaw.trim().toLowerCase()];
  if (!type) {
    window.alert(getUiText(state, "heroes_link_type_invalid"));
    return null;
  }

  const candidates = createLinkCandidates(state, type).filter((candidate) => candidate.id);
  if (!candidates.length) {
    window.alert(getUiText(state, "heroes_link_empty"));
    return null;
  }

  const list = candidates
    .map((candidate, index) => `${index + 1}. ${candidate.label} (${candidate.detail})`)
    .join("\n");
  const selectedRaw = window.prompt(getUiText(state, "heroes_link_pick_prompt", { list }), "1");
  if (!selectedRaw) return null;

  const selected = candidates[Number(selectedRaw) - 1];
  if (!selected) return null;

  const label = window.prompt(getUiText(state, "heroes_link_label_prompt"), selected.label);
  if (label == null) return null;

  return {
    type: selected.type,
    id: selected.id,
    groupId: selected.groupId,
    label: label.trim() || selected.label,
  };
}
