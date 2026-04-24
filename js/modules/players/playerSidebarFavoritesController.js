import * as playerSidebarStorage from "./playerSidebarStorage.js";
import * as playerSidebarTargets from "./playerSidebarTargets.js";

function renderEmptyState(container, text) {
  const empty = document.createElement("div");
  empty.className = "player-popout-empty";
  empty.textContent = text;
  container.appendChild(empty);
}

export function createPlayerSidebarFavoritesController(options) {
  const {
    els,
    state,
    t,
    onNavigate,
    onClose,
    getFavorites,
    setFavorites,
    persistFavorites,
  } = options;

  function composeTargetKey(target) {
    const normalized = playerSidebarTargets.normalizeTarget(target);
    if (!normalized) return "";
    return `${normalized.type}:${normalized.id}:${normalized.groupId || ""}`;
  }

  function remapTargets(remapTarget) {
    // Cross-links in favorites and the current selection should survive entity
    // moves, so remapping happens centrally instead of in each feature module.
    if (typeof remapTarget !== "function") return;

    const favorites = getFavorites();
    let favoritesChanged = false;
    const dedupe = new Set();
    const nextFavorites = [];

    favorites.forEach((entry) => {
      const currentTarget = playerSidebarTargets.normalizeTarget(entry.target);
      if (!currentTarget) return;

      const remappedTarget = playerSidebarTargets.normalizeTarget(remapTarget(currentTarget) || currentTarget);
      if (!remappedTarget) return;

      const targetKey = composeTargetKey(remappedTarget);
      if (!targetKey || dedupe.has(targetKey)) return;
      dedupe.add(targetKey);

      if (!playerSidebarTargets.isSameTarget(currentTarget, remappedTarget)) favoritesChanged = true;
      nextFavorites.push({
        ...entry,
        target: remappedTarget,
      });
    });

    if (favoritesChanged || nextFavorites.length !== favorites.length) {
      setFavorites(nextFavorites);
      persistFavorites();
    }

    const currentTarget = playerSidebarTargets.normalizeTarget(state.playerCurrentTarget);
    if (!currentTarget) return;

    const remappedCurrentTarget = playerSidebarTargets.normalizeTarget(remapTarget(currentTarget) || currentTarget);
    if (!playerSidebarTargets.isSameTarget(currentTarget, remappedCurrentTarget)) {
      state.playerCurrentTarget = remappedCurrentTarget;
    }
  }

  function remapHeroReference(heroId, fromGroupId, toGroupId) {
    const normalizedHeroId = String(heroId || "").trim();
    const normalizedFromGroupId = String(fromGroupId || "").trim();
    const normalizedToGroupId = String(toGroupId || "").trim();
    if (!normalizedHeroId || !normalizedFromGroupId || !normalizedToGroupId) return;

    remapTargets((target) => {
      if (
        target.type === "heroItem"
        && target.id === normalizedHeroId
        && String(target.groupId || "") === normalizedFromGroupId
      ) {
        return {
          ...target,
          groupId: normalizedToGroupId,
        };
      }
      return target;
    });
  }

  function remapArchiveItemReference(itemId, fromGroupId, toGroupId) {
    const normalizedItemId = String(itemId || "").trim();
    const normalizedFromGroupId = String(fromGroupId || "").trim();
    const normalizedToGroupId = String(toGroupId || "").trim();
    if (!normalizedItemId || !normalizedFromGroupId || !normalizedToGroupId) return;

    remapTargets((target) => {
      if (
        target.type === "archiveItem"
        && target.id === normalizedItemId
        && String(target.groupId || "") === normalizedFromGroupId
      ) {
        return {
          ...target,
          groupId: normalizedToGroupId,
        };
      }
      return target;
    });
  }

  function renderFavorites() {
    // Favorites are resolved lazily against current data. If an old favorite no
    // longer points to anything, it simply drops out of the visible list.
    const favorites = getFavorites();
    const currentTarget = playerSidebarTargets.normalizeTarget(state.playerCurrentTarget);
    const currentDescription = playerSidebarTargets.describeTarget(state, currentTarget);
    const alreadySaved = currentTarget && favorites.some((entry) => playerSidebarTargets.isSameTarget(entry.target, currentTarget));

    if (!currentTarget || !currentDescription) {
      els.favoritesHint.textContent = t("favorites_hint_empty_target");
      els.addFavoriteButton.disabled = true;
    } else if (alreadySaved) {
      els.favoritesHint.textContent = t("favorites_hint_saved", { title: currentDescription.title });
      els.addFavoriteButton.disabled = true;
    } else {
      els.favoritesHint.textContent = t("favorites_hint_ready", {
        title: currentDescription.title,
        subtitle: currentDescription.subtitle,
      });
      els.addFavoriteButton.disabled = false;
    }

    els.favoritesList.innerHTML = "";

    if (!favorites.length) {
      renderEmptyState(els.favoritesList, t("favorites_empty"));
      return;
    }

    let renderedCount = 0;

    favorites.forEach((entry) => {
      const description = playerSidebarTargets.describeTarget(state, entry.target);
      if (!description) return;
      renderedCount += 1;

      const row = document.createElement("div");
      row.className = "player-favorite-item";

      const button = document.createElement("button");
      button.className = "player-favorite-main";
      button.type = "button";
      button.addEventListener("click", () => {
        onNavigate?.(entry.target);
        onClose?.();
      });

      const badge = document.createElement("span");
      badge.className = "player-favorite-badge";
      badge.textContent = description.badge;

      const title = document.createElement("strong");
      title.textContent = description.title;

      const subtitle = document.createElement("span");
      subtitle.textContent = description.subtitle;

      button.append(badge, title, subtitle);

      const removeButton = document.createElement("button");
      removeButton.className = "player-favorite-remove";
      removeButton.type = "button";
      removeButton.textContent = "\u00d7";
      removeButton.title = t("favorites_remove");
      removeButton.addEventListener("click", () => {
        setFavorites(getFavorites().filter((favorite) => favorite.id !== entry.id));
        persistFavorites();
        renderFavorites();
      });

      row.append(button, removeButton);
      els.favoritesList.appendChild(row);
    });

    if (renderedCount === 0) {
      renderEmptyState(els.favoritesList, t("favorites_stale"));
    }
  }

  function addCurrentFavorite() {
    const target = playerSidebarTargets.normalizeTarget(state.playerCurrentTarget);
    const description = playerSidebarTargets.describeTarget(state, target);
    if (!target || !description) return;

    const favorites = getFavorites();
    const existing = favorites.find((entry) => playerSidebarTargets.isSameTarget(entry.target, target));
    if (existing) {
      setFavorites([existing, ...favorites.filter((entry) => entry.id !== existing.id)]);
      persistFavorites();
      renderFavorites();
      return;
    }

    setFavorites([
      {
        id: playerSidebarStorage.createLocalId("favorite"),
        target,
        createdAt: new Date().toISOString(),
      },
      ...favorites,
    ].slice(0, playerSidebarStorage.MAX_FAVORITES));
    persistFavorites();
    renderFavorites();
  }

  return {
    addCurrentFavorite,
    remapArchiveItemReference,
    remapHeroReference,
    remapTargets,
    renderFavorites,
  };
}
