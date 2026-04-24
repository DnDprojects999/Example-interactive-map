import {
  createHeroExpandedCard,
  createHeroGroupSection,
} from "./heroesView.js";
import { getPlayersForHero } from "../players/playerRoster.js";
import { applyHeroAccentPalette } from "./heroesAccent.js";

export function createHeroesController(options) {
  const {
    els,
    state,
    onNavigate,
    onSelectItem = () => {},
  } = options;

  let activeExpandedCardId = null;

  // Just like archive, heroes allow one expanded card at a time.
  function collapseExpandedCards() {
    els.heroesGroupsContainer.querySelectorAll(".hero-expanded").forEach((expanded) => expanded.remove());
    els.heroesGroupsContainer.querySelectorAll(".hero-card.expanded").forEach((card) => card.classList.remove("expanded"));
    els.heroesGroupsContainer.querySelectorAll(".heroes-group.has-expanded").forEach((section) => section.classList.remove("has-expanded"));
    activeExpandedCardId = null;
    state.currentHeroId = null;
  }

  function applyDominantColors(root = els.heroesGroupsContainer) {
    applyHeroAccentPalette(root, state);
  }

  function openExpanded(card, hero, groupId) {
    // Expanded hero cards include cross-links and player assignments, so they
    // are created on demand instead of always sitting in the DOM.
    const cardId = card.dataset.cardId;
    const shouldCollapse = activeExpandedCardId === cardId;
    collapseExpandedCards();
    if (shouldCollapse) return;

    const groupSection = card.closest(".heroes-group");
    const grid = card.closest(".heroes-card-grid");
    if (!groupSection || !grid) return;

    groupSection.classList.add("has-expanded");
    card.classList.add("expanded");
    const expanded = createHeroExpandedCard(hero, {
      cardId,
      groupId,
      editMode: state.editMode,
      localizationContext: state,
      onCollapse: collapseExpandedCards,
      onNavigateLink: onNavigate,
      getAssignedPlayers: (targetGroupId, heroId) => getPlayersForHero(state.playersData, targetGroupId, heroId),
    });
    groupSection.insertBefore(expanded, grid.nextSibling);
    activeExpandedCardId = cardId;
    state.activeHeroGroupId = groupId;
    state.currentHeroId = hero.id || null;
    onSelectItem({ type: "heroItem", id: hero.id, groupId });
    applyDominantColors(expanded);
    expanded.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function render() {
    // Re-rendering the heroes page from scratch keeps portrait accents,
    // edit-state fields, and group ordering in one predictable pass.
    els.heroesGroupsContainer.innerHTML = "";
    state.heroesData.forEach((group) => {
      const section = createHeroGroupSection(group, {
        editMode: state.editMode,
        localizationContext: state,
        onOpen: openExpanded,
        getAssignedPlayers: (targetGroupId, heroId) => getPlayersForHero(state.playersData, targetGroupId, heroId),
      });
      els.heroesGroupsContainer.appendChild(section);
    });
    applyDominantColors();
  }

  function focusItem(groupId, heroId) {
    const card = els.heroesGroupsContainer.querySelector(`[data-group-id="${groupId}"][data-hero-id="${heroId}"]`);
    const group = state.heroesData.find((entry) => entry.id === groupId);
    const hero = group?.items?.find((entry) => entry.id === heroId);
    if (!card || !hero) return;
    openExpanded(card, hero, group.id);
  }

  return {
    collapseExpandedCards,
    focusItem,
    render,
  };
}
