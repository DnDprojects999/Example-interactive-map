export const CHANGE_SCHEMA_VERSION = 1;
export const GROUP_SCOPED_ENTITIES = new Set(["archiveItem", "heroItem"]);

export const SUPPORTED_ENTITIES = new Set([
  "markerGroup",
  "marker",
  "timelineAct",
  "timelineEvent",
  "archiveGroup",
  "archiveItem",
  "heroGroup",
  "heroItem",
  "homebrewCategory",
  "homebrewArticle",
  "player",
  "worldInfo",
  "regionLabel",
  "drawLayer",
  "mapTexture",
]);

export const LIST_ENTITY_CONFIG = Object.freeze({
  markerGroup: { collection: "groupsData" },
  marker: { collection: "markersData" },
  timelineAct: { collection: "timelineActsData" },
  timelineEvent: { collection: "eventsData" },
  archiveGroup: { collection: "archiveData" },
  archiveItem: { collection: "archiveData", groupScoped: true },
  heroGroup: { collection: "heroesData" },
  heroItem: { collection: "heroesData", groupScoped: true },
  homebrewCategory: { collection: "homebrewCategoriesData" },
  homebrewArticle: { collection: "homebrewArticlesData" },
  player: { collection: "playersData" },
  regionLabel: { collection: "regionLabelsData" },
  drawLayer: { collection: "drawLayersData" },
});

export function deepClone(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export function assertValidChange(change, index = 0) {
  if (!change || typeof change !== "object") {
    throw new Error(`Invalid change at index ${index}: expected object.`);
  }

  if (!SUPPORTED_ENTITIES.has(change.entity)) {
    throw new Error(`Invalid change at index ${index}: unsupported entity "${change.entity}".`);
  }

  if (!["upsert", "remove"].includes(change.op)) {
    throw new Error(`Invalid change at index ${index}: unsupported op "${change.op}".`);
  }

  if (typeof change.id !== "string" || !change.id.trim()) {
    throw new Error(`Invalid change at index ${index}: id is required.`);
  }

  if (GROUP_SCOPED_ENTITIES.has(change.entity) && (!change.groupId || typeof change.groupId !== "string")) {
    throw new Error(`Invalid change at index ${index}: ${change.entity} requires groupId.`);
  }

  if (change.op === "upsert" && (change.value === undefined || change.value === null)) {
    throw new Error(`Invalid change at index ${index}: upsert requires value.`);
  }
}

export function describeChange(change) {
  const entity = change?.entity || "entity";
  const id = change?.id || "?";
  const groupId = change?.groupId ? ` in group "${change.groupId}"` : "";
  return `${entity} "${id}"${groupId}`;
}
