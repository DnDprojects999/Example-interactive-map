import {
  normalizePlayerRecord,
  resolvePlayerCharacters,
} from "./playerRoster.js";
import { getLocalizedText, setLocalizedValue } from "../localization.js";
import * as playerSidebarStorage from "./playerSidebarStorage.js";
import * as playerSidebarTargets from "./playerSidebarTargets.js";

function renderEmptyState(container, text) {
  const empty = document.createElement("div");
  empty.className = "player-popout-empty";
  empty.textContent = text;
  container.appendChild(empty);
}

export function createPlayerSidebarRosterController(options) {
  const {
    els,
    state,
    t,
    getChangeRecorder,
    onNavigate,
    onPlayersChanged,
  } = options;

  function getRecorder() {
    const recorder = typeof getChangeRecorder === "function" ? getChangeRecorder() : null;
    return {
      upsert: typeof recorder?.upsert === "function" ? recorder.upsert : () => {},
      remove: typeof recorder?.remove === "function" ? recorder.remove : () => {},
    };
  }

  function getPlayerField(player, field, fallbackKey, fallback = "") {
    return getLocalizedText(player, field, state, fallback || t(fallbackKey));
  }

  function getRoster() {
    return Array.isArray(state.playersData) ? state.playersData : [];
  }

  function emitPlayersChanged() {
    onPlayersChanged?.();
  }

  function replaceRoster(nextRoster) {
    state.playersData = nextRoster;
    emitPlayersChanged();
  }

  function upsertPlayer(rawPlayer, fallbackId = "") {
    // Normalize every write so hero assignments stay consistent even if the
    // draft came from prompts, imported content, or partially old data.
    const normalized = normalizePlayerRecord(
      rawPlayer,
      state.heroesData,
      fallbackId || playerSidebarStorage.createLocalId("player"),
    );
    if (!normalized) return null;

    const roster = getRoster();
    const index = roster.findIndex((entry) => entry.id === normalized.id);
    const nextRoster = [...roster];

    if (index >= 0) nextRoster[index] = normalized;
    else nextRoster.push(normalized);

    getRecorder().upsert("player", normalized.id, normalized);
    replaceRoster(nextRoster);
    renderPlayers();
    return normalized;
  }

  function removePlayer(playerId) {
    const roster = getRoster();
    const nextRoster = roster.filter((entry) => entry.id !== playerId);
    if (nextRoster.length === roster.length) return false;

    getRecorder().remove("player", playerId);
    replaceRoster(nextRoster);
    renderPlayers();
    return true;
  }

  function collectHeroAssignments() {
    const assignments = new Map();

    getRoster().forEach((player) => {
      (player.characters || []).forEach((character) => {
        if (!character?.id || !character?.groupId) return;
        assignments.set(playerSidebarTargets.createHeroKey(character.groupId, character.id), player);
      });
    });

    return assignments;
  }

  function getAvailableHeroOptions(player) {
    // A hero can only belong to one player at a time, so already-claimed heroes
    // are removed from the assignment picker for everyone else.
    const assignments = collectHeroAssignments();
    const currentAssignments = new Set(
      (player.characters || [])
        .filter((character) => character?.groupId && character?.id)
        .map((character) => playerSidebarTargets.createHeroKey(character.groupId, character.id)),
    );

    return (state.heroesData || []).flatMap((group) =>
      (group.items || [])
        .map((hero) => {
          const key = playerSidebarTargets.createHeroKey(group.id, hero.id);
          const owner = assignments.get(key);
          const occupiedByOtherPlayer = owner && owner.id !== player.id;

          if (currentAssignments.has(key) || occupiedByOtherPlayer) return null;

          return {
            value: key,
            label: getLocalizedText(hero, "title", state, t("heroes_new_hero")),
            meta: getLocalizedText(hero, "role", state, "")
              ? `${getLocalizedText(group, "title", state, t("mode_heroes"))} \u00b7 ${getLocalizedText(hero, "role", state, "")}`
              : getLocalizedText(group, "title", state, t("mode_heroes")),
          };
        })
        .filter(Boolean),
    );
  }

  function promptPlayerDraft(player = null) {
    const name = window.prompt(
      t("players_prompt_name"),
      getPlayerField(player, "name", "players_prompt_name", player?.name || ""),
    );
    if (name == null) return null;

    const trimmedName = String(name).trim();
    if (!trimmedName) {
      window.alert(t("players_name_required"));
      return null;
    }

    const label = window.prompt(
      t("players_prompt_label"),
      getPlayerField(player, "label", "players_default_label", player?.label || t("players_default_label")),
    );
    const notes = window.prompt(
      t("players_prompt_notes"),
      getPlayerField(player, "notes", "players_prompt_notes", player?.notes || ""),
    );

    const draft = {
      ...player,
      id: player?.id || playerSidebarStorage.createLocalId("player"),
      name: player?.name || trimmedName,
      label: player?.label || t("players_default_label"),
      notes: player?.notes || "",
      characters: Array.isArray(player?.characters) ? player.characters : [],
    };

    setLocalizedValue(draft, "name", trimmedName, state);
    setLocalizedValue(
      draft,
      "label",
      String(label ?? getPlayerField(player, "label", "players_default_label", t("players_default_label"))).trim() || t("players_default_label"),
      state,
    );
    setLocalizedValue(
      draft,
      "notes",
      String(notes ?? getPlayerField(player, "notes", "players_prompt_notes", "")).trim(),
      state,
    );
    return draft;
  }

  function createPlayer() {
    const draft = promptPlayerDraft();
    if (!draft) return;

    const created = upsertPlayer(draft, draft.id);
    if (!created) return;

    requestAnimationFrame(() => {
      const createdCard = els.playersList.querySelector(`[data-player-id="${created.id}"]`);
      createdCard?.scrollIntoView?.({ behavior: "smooth", block: "nearest", inline: "nearest" });
    });
  }

  function editPlayer(playerId) {
    const player = getRoster().find((entry) => entry.id === playerId);
    if (!player) return;

    const draft = promptPlayerDraft(player);
    if (!draft) return;
    upsertPlayer(draft, player.id);
  }

  function attachHeroToPlayer(playerId, heroKey) {
    const player = getRoster().find((entry) => entry.id === playerId);
    const reference = playerSidebarTargets.parseHeroKey(heroKey);
    if (!player || !reference) return;

    const alreadyAssigned = (player.characters || []).some((character) =>
      character.id === reference.id && character.groupId === reference.groupId,
    );
    if (alreadyAssigned) return;

    upsertPlayer({
      ...player,
      characters: [...(player.characters || []), reference],
    }, player.id);
  }

  function detachHeroFromPlayer(playerId, groupId, heroId) {
    const player = getRoster().find((entry) => entry.id === playerId);
    if (!player) return;

    upsertPlayer({
      ...player,
      characters: (player.characters || []).filter((character) =>
        !(character.id === heroId && character.groupId === groupId),
      ),
    }, player.id);
  }

  function renderCharacterLinks(container, player, characters) {
    if (!characters.length) {
      const empty = document.createElement("span");
      empty.className = "player-roster-empty-note";
      empty.textContent = state.editMode
        ? t("players_no_hero_yet_edit")
        : t("players_no_hero_yet");
      container.appendChild(empty);
      return;
    }

    characters.forEach((character) => {
      if (state.editMode) {
        const chip = document.createElement("div");
        chip.className = "player-roster-chip";

        const button = document.createElement("button");
        button.className = "player-roster-link";
        button.type = "button";
        button.textContent = character.title;
        button.title = character.role
          ? `${character.title} \u00b7 ${character.role}`
          : character.groupTitle;
        button.classList.toggle(
          "active",
          state.currentHeroId === character.id && state.activeHeroGroupId === character.groupId,
        );
        button.addEventListener("click", () => {
          onNavigate?.({
            type: "heroItem",
            id: character.id,
            groupId: character.groupId,
          });
        });

        const removeButton = document.createElement("button");
        removeButton.className = "player-roster-chip-remove";
        removeButton.type = "button";
        removeButton.textContent = "\u00d7";
        removeButton.title = t("players_remove_hero", {
          hero: character.title,
          player: getPlayerField(player, "name", "players_prompt_name", player.name),
        });
        removeButton.addEventListener("click", () => {
          detachHeroFromPlayer(player.id, character.groupId, character.id);
        });

        chip.append(button, removeButton);
        container.appendChild(chip);
        return;
      }

      const button = document.createElement("button");
      button.className = "player-roster-link";
      button.type = "button";
      button.textContent = character.title;
      button.title = character.role
        ? `${character.title} \u00b7 ${character.role}`
        : character.groupTitle;
      button.classList.toggle(
        "active",
        state.currentHeroId === character.id && state.activeHeroGroupId === character.groupId,
      );
      button.addEventListener("click", () => {
        onNavigate?.({
          type: "heroItem",
          id: character.id,
          groupId: character.groupId,
        });
      });
      container.appendChild(button);
    });
  }

  function renderPlayerEditor(item, player) {
    // In edit mode the roster becomes a lightweight assignment console: rename
    // players, remove them, and bind/unbind heroes in one place.
    const actions = document.createElement("div");
    actions.className = "player-roster-actions";

    const editButton = document.createElement("button");
    editButton.className = "player-roster-manage";
    editButton.type = "button";
    editButton.textContent = t("players_edit");
    editButton.title = t("players_edit_title", {
      name: getPlayerField(player, "name", "players_prompt_name", player.name),
    });
    editButton.addEventListener("click", () => editPlayer(player.id));

    const deleteButton = document.createElement("button");
    deleteButton.className = "player-roster-manage player-roster-manage-danger";
    deleteButton.type = "button";
    deleteButton.textContent = t("players_delete");
    deleteButton.title = t("players_delete_title", {
      name: getPlayerField(player, "name", "players_prompt_name", player.name),
    });
    deleteButton.addEventListener("click", () => {
      const shouldDelete = window.confirm(
        t("players_delete_confirm", {
          name: getPlayerField(player, "name", "players_prompt_name", player.name),
        }),
      );
      if (!shouldDelete) return;
      removePlayer(player.id);
    });

    actions.append(editButton, deleteButton);
    item.appendChild(actions);

    const heroOptions = getAvailableHeroOptions(player);
    const assignRow = document.createElement("div");
    assignRow.className = "player-roster-assign";

    const select = document.createElement("select");
    select.className = "player-roster-select";
    select.disabled = !heroOptions.length;

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = heroOptions.length
      ? t("players_pick_hero")
      : t("players_no_free_heroes");
    select.appendChild(placeholder);

    heroOptions.forEach((option) => {
      const optionNode = document.createElement("option");
      optionNode.value = option.value;
      optionNode.textContent = `${option.label} \u00b7 ${option.meta}`;
      select.appendChild(optionNode);
    });

    const addButton = document.createElement("button");
    addButton.className = "player-roster-manage";
    addButton.type = "button";
    addButton.textContent = t("players_add_hero");
    addButton.disabled = !heroOptions.length;
    addButton.addEventListener("click", () => {
      if (!select.value) return;
      attachHeroToPlayer(player.id, select.value);
    });

    assignRow.append(select, addButton);
    item.appendChild(assignRow);
  }

  function renderPlayers() {
    // Viewer mode and editor mode intentionally have different empty-state copy:
    // one explains the feature, the other nudges the creator toward setup.
    const roster = getRoster();
    els.playersEditorBar.hidden = !state.editMode;
    els.playersEditorHint.textContent = state.editMode
      ? t("players_editor_hint")
      : t("players_copy");
    els.playersList.innerHTML = "";

    if (!roster.length) {
      renderEmptyState(
        els.playersList,
        state.editMode
          ? t("players_empty_editor")
          : t("players_empty_viewer"),
      );
      return;
    }

    roster.forEach((player) => {
      const item = document.createElement("article");
      item.className = "player-roster-item";
      item.dataset.playerId = player.id;

      const header = document.createElement("div");
      header.className = "player-roster-head";

      const titleWrap = document.createElement("div");
      titleWrap.className = "player-roster-title";

      const name = document.createElement("strong");
      name.textContent = getPlayerField(player, "name", "players_prompt_name", player.name);
      titleWrap.appendChild(name);

      const localizedLabel = getPlayerField(player, "label", "players_default_label", player.label);
      if (localizedLabel) {
        const tag = document.createElement("span");
        tag.className = "player-roster-tag";
        tag.textContent = localizedLabel;
        titleWrap.appendChild(tag);
      }

      header.appendChild(titleWrap);
      item.appendChild(header);

      const localizedNotes = getPlayerField(player, "notes", "players_prompt_notes", player.notes);
      if (localizedNotes) {
        const notes = document.createElement("p");
        notes.className = "player-roster-note";
        notes.textContent = localizedNotes;
        item.appendChild(notes);
      }

      const links = document.createElement("div");
      links.className = "player-roster-links";
      renderCharacterLinks(links, player, resolvePlayerCharacters(player, state.heroesData, state));
      item.appendChild(links);

      if (state.editMode) {
        renderPlayerEditor(item, player);
      }

      els.playersList.appendChild(item);
    });
  }

  return {
    createPlayer,
    renderPlayers,
    setPlayerTarget: (target) => {
      state.playerCurrentTarget = playerSidebarTargets.normalizeTarget(target);
    },
  };
}
