import { getLocalizedText } from "../localization.js";

function normalizeText(value, fallback = "") {
  const normalized = String(value || "").trim();
  return normalized || fallback;
}

function findHeroGroupId(heroesData, heroId) {
  for (const group of Array.isArray(heroesData) ? heroesData : []) {
    if ((group.items || []).some((hero) => hero.id === heroId)) return group.id;
  }
  return "";
}

function normalizeCharacterReference(reference, heroesData) {
  if (typeof reference === "string") {
    const id = normalizeText(reference);
    if (!id) return null;
    return {
      id,
      groupId: findHeroGroupId(heroesData, id),
    };
  }

  if (!reference || typeof reference !== "object") return null;

  const id = normalizeText(reference.id || reference.heroId || reference.characterId);
  if (!id) return null;

  return {
    id,
    groupId: normalizeText(reference.groupId, findHeroGroupId(heroesData, id)),
  };
}

export function normalizePlayerRecord(rawValue, heroesData, fallbackId = "") {
  const player = rawValue && typeof rawValue === "object" ? rawValue : {};
  const name = normalizeText(player.name);
  if (!name) return null;

  const rawCharacters = Array.isArray(player.characters)
    ? player.characters
    : Array.isArray(player.characterIds)
      ? player.characterIds
      : Array.isArray(player.heroes)
        ? player.heroes
        : [];

  return {
    id: normalizeText(player.id, fallbackId || `player-${Date.now()}`),
    name,
    label: normalizeText(player.label),
    notes: normalizeText(player.notes),
    translations: player.translations && typeof player.translations === "object"
      ? structuredClone(player.translations)
      : {},
    characters: rawCharacters
      .map((entry) => normalizeCharacterReference(entry, heroesData))
      .filter(Boolean),
  };
}

export function normalizePlayersData(rawValue, heroesData) {
  const players = Array.isArray(rawValue?.players)
    ? rawValue.players
    : Array.isArray(rawValue)
      ? rawValue
      : [];

  return players
    .map((player, index) => normalizePlayerRecord(player, heroesData, `player-${index + 1}`))
    .filter(Boolean);
}

export function getPlayersForHero(playersData, groupId, heroId) {
  return (Array.isArray(playersData) ? playersData : []).filter((player) =>
    (player.characters || []).some((character) =>
      character.id === heroId && (!character.groupId || character.groupId === groupId),
    ));
}

export function resolvePlayerCharacters(player, heroesData, localizationContext = null) {
  const resolved = [];

  for (const character of player?.characters || []) {
    const group = (heroesData || []).find((entry) => entry.id === character.groupId)
      || (heroesData || []).find((entry) => (entry.items || []).some((hero) => hero.id === character.id));
    const hero = group?.items?.find((entry) => entry.id === character.id);
    if (!group || !hero) continue;

    resolved.push({
      id: hero.id,
      groupId: group.id,
      title: getLocalizedText(hero, "title", localizationContext, "Hero"),
      role: getLocalizedText(hero, "role", localizationContext, ""),
      groupTitle: getLocalizedText(group, "title", localizationContext, "Hall of Heroes"),
    });
  }

  return resolved;
}
