export function createUiReferenceRemapper(options) {
  const {
    state,
    playerSidebar,
    getChangeRecorder,
  } = options;

  function getRecorder() {
    return getChangeRecorder?.() || { upsert: () => {}, remove: () => {} };
  }

  function remapHeroReferences(heroId, fromGroupId, toGroupId) {
    // Group ids are part of a hero link identity, so moving a hero between
    // groups requires rewriting every place that points at that hero.
    const normalizedHeroId = String(heroId || "").trim();
    const normalizedFromGroupId = String(fromGroupId || "").trim();
    const normalizedToGroupId = String(toGroupId || "").trim();
    if (!normalizedHeroId || !normalizedFromGroupId || !normalizedToGroupId) return;

    const recorder = getRecorder();
    playerSidebar.remapHeroReference(normalizedHeroId, normalizedFromGroupId, normalizedToGroupId);

    let playersChanged = false;
    state.playersData = (state.playersData || []).map((player) => {
      let changed = false;
      const nextCharacters = (player.characters || []).map((character) => {
        if (
          character?.id === normalizedHeroId
          && String(character.groupId || "") === normalizedFromGroupId
        ) {
          changed = true;
          return {
            ...character,
            groupId: normalizedToGroupId,
          };
        }
        return character;
      });

      if (!changed) return player;
      playersChanged = true;
      const nextPlayer = {
        ...player,
        characters: nextCharacters,
      };
      recorder.upsert?.("player", nextPlayer.id, nextPlayer);
      return nextPlayer;
    });

    (state.heroesData || []).forEach((group) => {
      (group.items || []).forEach((hero) => {
        if (!Array.isArray(hero.links) || !hero.links.length) return;

        let changed = false;
        hero.links = hero.links.map((link) => {
          if (
            link?.type === "heroItem"
            && link.id === normalizedHeroId
            && String(link.groupId || "") === normalizedFromGroupId
          ) {
            changed = true;
            return {
              ...link,
              groupId: normalizedToGroupId,
            };
          }
          return link;
        });

        if (changed) recorder.upsert?.("heroItem", hero.id, hero, { groupId: group.id });
      });
    });

    if (
      state.currentHeroId === normalizedHeroId
      && String(state.activeHeroGroupId || "") === normalizedFromGroupId
    ) {
      state.activeHeroGroupId = normalizedToGroupId;
    }

    if (playersChanged) playerSidebar.renderPlayers();
  }

  function remapArchiveItemReferences(itemId, fromGroupId, toGroupId) {
    // Archive items can be referenced from heroes, players, and markers. When an
    // item changes group, we keep those cross-links coherent here.
    const normalizedItemId = String(itemId || "").trim();
    const normalizedFromGroupId = String(fromGroupId || "").trim();
    const normalizedToGroupId = String(toGroupId || "").trim();
    if (!normalizedItemId || !normalizedFromGroupId || !normalizedToGroupId) return;

    const recorder = getRecorder();
    playerSidebar.remapArchiveItemReference(normalizedItemId, normalizedFromGroupId, normalizedToGroupId);

    (state.heroesData || []).forEach((group) => {
      (group.items || []).forEach((hero) => {
        if (!Array.isArray(hero.links) || !hero.links.length) return;

        let changed = false;
        hero.links = hero.links.map((link) => {
          if (
            link?.type === "archiveItem"
            && link.id === normalizedItemId
            && String(link.groupId || "") === normalizedFromGroupId
          ) {
            changed = true;
            return {
              ...link,
              groupId: normalizedToGroupId,
            };
          }
          return link;
        });

        if (changed) recorder.upsert?.("heroItem", hero.id, hero, { groupId: group.id });
      });
    });

    (state.markersData || []).forEach((marker) => {
      const linkedItemId = String(marker.archiveItemId || "").trim();
      const linkedGroupId = String(marker.archiveGroupId || "").trim();
      if (linkedItemId !== normalizedItemId || linkedGroupId !== normalizedFromGroupId) return;

      marker.archiveGroupId = normalizedToGroupId;
      recorder.upsert?.("marker", marker.id, marker);
    });

    if (
      state.currentArchiveItemId === normalizedItemId
      && String(state.activeArchiveGroupId || "") === normalizedFromGroupId
    ) {
      state.activeArchiveGroupId = normalizedToGroupId;
    }
  }

  return {
    remapArchiveItemReferences,
    remapHeroReferences,
  };
}
