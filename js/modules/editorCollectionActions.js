import {
  createArchiveGroupTemplate,
  createArchiveItemTemplate,
  createHeroCardTemplate,
  createHeroGroupTemplate,
  inferArchiveTemplateKind,
} from "./entityTemplates.js";
import { getLocalizedText } from "./localization.js";

export function createEditorCollectionActions(options) {
  const {
    els,
    state,
    generateEntityId,
    getRecorder,
    getUiText,
    renderArchive,
    renderArchiveSidebarButtons,
    renderHeroes,
  } = options;

  function askForArchiveTemplateKind(defaultKind = "general") {
    const selected = window.prompt(getUiText("prompt_archive_group_kind"), defaultKind);
    if (!selected) return null;

    const normalized = String(selected).trim().toLowerCase();
    if (["faction", "city", "authority", "general"].includes(normalized)) return normalized;
    window.alert(getUiText("alert_archive_group_kind_invalid"));
    return null;
  }

  function createArchiveGroup() {
    if (!state.editMode) return;

    const kind = askForArchiveTemplateKind("faction");
    if (!kind) return;

    const newGroup = {
      ...createArchiveGroupTemplate(kind),
      id: generateEntityId("archive-group"),
    };

    state.archiveData.push(newGroup);
    state.activeArchiveGroupId = newGroup.id;
    getRecorder().upsert("archiveGroup", newGroup.id, newGroup);
    renderArchive();
    renderArchiveSidebarButtons();
    const section = els.archiveGroupsContainer.querySelector(`[data-archive-group="${newGroup.id}"]`);
    if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function createArchiveItem() {
    if (!state.editMode) return;

    const groupChoices = state.archiveData
      .map((group, index) => `${index + 1}. ${getLocalizedText(group, "title", state, `${getUiText("archive_group_fallback")} ${index + 1}`)}`)
      .join("\n");
    if (!groupChoices) return;

    const selectedGroupRaw = window.prompt(getUiText("prompt_archive_item_group", { list: groupChoices }), "1");
    if (!selectedGroupRaw) return;

    const selectedIndex = Number(selectedGroupRaw) - 1;
    const selectedGroup = state.archiveData[selectedIndex];
    const groupId = selectedGroup?.id || state.activeArchiveGroupId || state.archiveData[0]?.id;
    const group = state.archiveData.find((entry) => entry.id === groupId);
    if (!group) return;

    group.items = Array.isArray(group.items) ? group.items : [];
    const newItem = {
      ...createArchiveItemTemplate(inferArchiveTemplateKind(group), group.items.length),
      id: generateEntityId("archive-item"),
    };

    group.items.push(newItem);
    getRecorder().upsert("archiveItem", newItem.id, newItem, { groupId: group.id });
    renderArchive();
    const card = els.archiveGroupsContainer.querySelector(`[data-card-id="${group.id}-${newItem.id}"]`);
    if (card) card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }

  function createHeroGroup() {
    if (!state.editMode) return;

    const newGroup = {
      ...createHeroGroupTemplate(),
      id: generateEntityId("hero-group"),
    };
    const starterHero = {
      ...createHeroCardTemplate(0),
      id: generateEntityId("hero"),
    };
    newGroup.items = [starterHero];

    state.heroesData.push(newGroup);
    state.activeHeroGroupId = newGroup.id;
    getRecorder().upsert("heroGroup", newGroup.id, newGroup);
    getRecorder().upsert("heroItem", starterHero.id, starterHero, { groupId: newGroup.id });
    renderHeroes();
    const card = els.heroesGroupsContainer.querySelector(`[data-card-id="${newGroup.id}-${starterHero.id}"]`);
    if (card) card.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  }

  function createHeroCard() {
    if (!state.editMode) return;

    const groupChoices = state.heroesData
      .map((group, index) => `${index + 1}. ${getLocalizedText(group, "title", state, `${getUiText("heroes_new_group")} ${index + 1}`)}`)
      .join("\n");
    if (!groupChoices) return;

    const selectedGroupRaw = window.prompt(getUiText("prompt_hero_group_pick", { list: groupChoices }), "1");
    if (!selectedGroupRaw) return;

    const selectedIndex = Number(selectedGroupRaw) - 1;
    const selectedGroup = state.heroesData[selectedIndex];
    const groupId = selectedGroup?.id || state.activeHeroGroupId || state.heroesData[0]?.id;
    const group = state.heroesData.find((entry) => entry.id === groupId);
    if (!group) return;

    group.items = Array.isArray(group.items) ? group.items : [];
    const newHero = {
      ...createHeroCardTemplate(group.items.length),
      id: generateEntityId("hero"),
    };

    group.items.push(newHero);
    state.activeHeroGroupId = group.id;
    getRecorder().upsert("heroItem", newHero.id, newHero, { groupId: group.id });
    renderHeroes();
    const card = els.heroesGroupsContainer.querySelector(`[data-card-id="${group.id}-${newHero.id}"]`);
    if (card) card.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  }

  return {
    createArchiveGroup,
    createArchiveItem,
    createHeroCard,
    createHeroGroup,
  };
}
