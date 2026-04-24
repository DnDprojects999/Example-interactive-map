import { CHANGE_SCHEMA_VERSION, assertValidChange, deepClone } from "./changesSchema.js";
import { validateChangesPayload } from "./changesApply.js";

export function createChangesManager(options = {}) {
  let baseVersion = options.baseVersion || "unversioned";
  const changesIndex = new Map();

  function composeKey(change) {
    return `${change.entity}:${change.groupId || "-"}:${change.id}`;
  }

  function ingestChange(change) {
    assertValidChange(change);
    changesIndex.set(composeKey(change), deepClone(change));
  }

  function upsert(entity, id, value, extra = {}) {
    ingestChange({ entity, id, op: "upsert", value: deepClone(value), ...extra });
  }

  function remove(entity, id, extra = {}) {
    ingestChange({ entity, id, op: "remove", ...extra });
  }

  function clear() {
    changesIndex.clear();
  }

  function list() {
    return Array.from(changesIndex.values());
  }

  function hasChanges() {
    return changesIndex.size > 0;
  }

  function setBaseVersion(nextVersion) {
    if (typeof nextVersion === "string" && nextVersion.trim()) {
      baseVersion = nextVersion;
    }
  }

  function toPayload() {
    return {
      meta: {
        schemaVersion: CHANGE_SCHEMA_VERSION,
        baseVersion,
        generatedAt: new Date().toISOString(),
      },
      changes: list(),
    };
  }

  function loadPayload(payload) {
    validateChangesPayload(payload);
    clear();
    payload.changes.forEach((change) => ingestChange(change));
    setBaseVersion(payload.meta?.baseVersion || baseVersion);
  }

  function download(filename = "changes.json") {
    const blob = new Blob([JSON.stringify(toPayload(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return {
    upsert,
    remove,
    clear,
    list,
    hasChanges,
    setBaseVersion,
    toPayload,
    loadPayload,
    download,
  };
}
