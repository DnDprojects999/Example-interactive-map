import {
  CHANGE_SCHEMA_VERSION,
  LIST_ENTITY_CONFIG,
  deepClone,
  assertValidChange,
  describeChange,
} from "./changesSchema.js";

function setById(list, id, nextValue) {
  const index = list.findIndex((item) => item.id === id);
  if (index >= 0) {
    list[index] = nextValue;
    return;
  }
  list.push(nextValue);
}

function removeById(list, id) {
  return list.filter((item) => item.id !== id);
}

function ensureApplyTargetShape(result) {
  [
    "groupsData",
    "markersData",
    "timelineActsData",
    "eventsData",
    "archiveData",
    "heroesData",
    "homebrewCategoriesData",
    "homebrewArticlesData",
    "playersData",
    "regionLabelsData",
    "drawLayersData",
  ].forEach((key) => {
    result[key] = Array.isArray(result[key]) ? result[key] : [];
  });

  result.worldData = result.worldData && typeof result.worldData === "object"
    ? result.worldData
    : {};

  result.mapTexturesData = result.mapTexturesData && typeof result.mapTexturesData === "object"
    ? result.mapTexturesData
    : {};
}

function resolveListTarget(result, change) {
  const config = LIST_ENTITY_CONFIG[change.entity];
  if (!config) return null;

  if (!config.groupScoped) {
    return {
      list: result[config.collection],
      replace(nextValue) {
        result[config.collection] = nextValue;
      },
    };
  }

  const group = result[config.collection].find((entry) => entry.id === change.groupId);
  if (!group) return null;
  group.items = Array.isArray(group.items) ? group.items : [];

  return {
    list: group.items,
    replace(nextValue) {
      group.items = nextValue;
    },
  };
}

function applyListChange(result, change) {
  const target = resolveListTarget(result, change);
  if (!target) return false;

  if (change.op === "upsert") {
    setById(target.list, change.id, deepClone(change.value));
  } else {
    target.replace(removeById(target.list, change.id));
  }
  return true;
}

function applyMapTextureChange(result, change) {
  if (change.op === "upsert") {
    result.mapTexturesData[change.id] = typeof change.value === "string"
      ? change.value
      : String(change.value?.source || "");
    return;
  }

  result.mapTexturesData[change.id] = "";
}

function applyWorldInfoChange(result, change) {
  result.worldData = change.op === "upsert" ? deepClone(change.value) : {};
}

export function validateChangesPayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Changes payload must be an object.");
  }

  const schemaVersion = payload.meta?.schemaVersion;
  if (schemaVersion !== CHANGE_SCHEMA_VERSION) {
    throw new Error(`Unsupported changes schema version: ${schemaVersion}.`);
  }

  if (!Array.isArray(payload.changes)) {
    throw new Error("Changes payload must contain an array field: changes.");
  }

  payload.changes.forEach((change, index) => assertValidChange(change, index));
  return true;
}

export function applyChanges(baseData, payload) {
  if (!payload) return deepClone(baseData);
  validateChangesPayload(payload);

  const result = deepClone(baseData);
  ensureApplyTargetShape(result);
  const deferredGroupedChanges = [];

  payload.changes.forEach((change) => {
    if (change.entity === "mapTexture") {
      applyMapTextureChange(result, change);
      return;
    }

    if (change.entity === "worldInfo") {
      applyWorldInfoChange(result, change);
      return;
    }

    if (LIST_ENTITY_CONFIG[change.entity]?.groupScoped) {
      deferredGroupedChanges.push(change);
      return;
    }

    if (!applyListChange(result, change)) {
      throw new Error(`Unable to apply change for ${describeChange(change)}.`);
    }
  });

  deferredGroupedChanges.forEach((change) => {
    if (!applyListChange(result, change)) {
      throw new Error(`Unable to apply grouped change for ${describeChange(change)} because the target group is missing.`);
    }
  });

  return result;
}
