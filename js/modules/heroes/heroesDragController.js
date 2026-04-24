import {
  moveGroupedItemBeforeTarget,
  syncGroupedSortOrder,
} from "../groupedOrdering.js";

export function createHeroDragController(options) {
  const {
    state,
    getRecorder,
    remapHeroReferences,
    renderHeroes,
    resolveHeroImageTarget,
    applyHeroImageFile,
  } = options;

  let dragHeroMeta = null;

  function handleDragStart(event) {
    if (!state.editMode) return;
    const card = event.target.closest(".hero-card");
    if (!card) return;

    dragHeroMeta = {
      groupId: card.dataset.groupId,
      heroId: card.dataset.heroId,
    };
    card.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", `${dragHeroMeta.groupId}:${dragHeroMeta.heroId}`);
  }

  function handleDragEnd(event) {
    const card = event.target.closest(".hero-card");
    if (card) card.classList.remove("dragging");
    dragHeroMeta = null;
  }

  function handleDragOver(event) {
    if (!state.editMode) return;

    const imageTarget = resolveHeroImageTarget(state, event.target);
    if (imageTarget && !dragHeroMeta) {
      event.preventDefault();
      imageTarget.imageNode.classList.add("is-drop-target");
      event.dataTransfer.dropEffect = "copy";
      return;
    }

    if (!dragHeroMeta || !event.target.closest(".hero-card")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function handleDragLeave(event) {
    const imageNode = event.target?.closest?.(".hero-card-portrait, .hero-expanded-portrait");
    if (!imageNode) return;
    imageNode.classList.remove("is-drop-target");
  }

  async function handleDrop(event) {
    if (!state.editMode) return;

    const imageTarget = resolveHeroImageTarget(state, event.target);
    if (imageTarget && !dragHeroMeta) {
      const [file] = Array.from(event.dataTransfer?.files || []);
      if (!file) return;

      event.preventDefault();
      imageTarget.imageNode.classList.remove("is-drop-target");
      await applyHeroImageFile(file, imageTarget.group, imageTarget.hero);
      return;
    }

    if (!dragHeroMeta) return;
    const targetCard = event.target.closest(".hero-card");
    if (!targetCard) return;
    event.preventDefault();

    const sourceGroup = state.heroesData.find((group) => group.id === dragHeroMeta.groupId);
    const targetGroup = state.heroesData.find((group) => group.id === targetCard.dataset.groupId);
    if (!sourceGroup || !targetGroup) return;

    sourceGroup.items = Array.isArray(sourceGroup.items) ? sourceGroup.items : [];
    targetGroup.items = Array.isArray(targetGroup.items) ? targetGroup.items : [];

    const movedHero = moveGroupedItemBeforeTarget({
      sourceItems: sourceGroup.items,
      targetItems: targetGroup.items,
      sourceId: dragHeroMeta.heroId,
      targetId: targetCard.dataset.heroId,
    });
    if (!movedHero) return;

    const recorder = getRecorder();
    if (sourceGroup.id !== targetGroup.id) {
      recorder.remove("heroItem", movedHero.id, { groupId: sourceGroup.id });
      remapHeroReferences?.(movedHero.id, sourceGroup.id, targetGroup.id, recorder);
    }

    syncGroupedSortOrder(sourceGroup.items, recorder, "heroItem", sourceGroup.id);
    if (sourceGroup.id !== targetGroup.id) {
      syncGroupedSortOrder(targetGroup.items, recorder, "heroItem", targetGroup.id);
    }

    renderHeroes();
  }

  return {
    handleDragEnd,
    handleDragLeave,
    handleDragOver,
    handleDragStart,
    handleDrop,
  };
}
