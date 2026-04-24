import { setLocalizedValue } from "../localization.js";
import { askForHeroLink } from "./heroesLinkPicker.js";
import {
  createHeroMediaController,
  resolveHeroFromNode,
  resolveHeroImageTarget,
} from "./heroesMediaController.js";
import { createHeroDragController } from "./heroesDragController.js";

const EDITABLE_HERO_FIELDS = [
  "heroes-group-title",
  "heroes-group-subtitle",
  "hero-card-title",
  "hero-card-role",
  "hero-card-text",
  "hero-expanded-title",
  "hero-expanded-role",
  "hero-expanded-text",
];

function updateHeroAccentPreview(container, groupId, heroId, color) {
  container
    .querySelectorAll(`[data-group-id="${groupId}"][data-hero-id="${heroId}"]`)
    .forEach((node) => node.style.setProperty("--hero-accent", color));
}

export function setupHeroInteractions(options) {
  const {
    els,
    state,
    readFileToDataUrl,
    getChangeRecorder,
    remapHeroReferences,
    renderHeroes,
  } = options;

  const heroImageInput = document.createElement("input");
  heroImageInput.type = "file";
  heroImageInput.accept = "image/*";
  heroImageInput.hidden = true;
  document.body.appendChild(heroImageInput);

  const getRecorder = () => getChangeRecorder?.() || { upsert: () => {}, remove: () => {} };
  let activeImageTarget = null;

  const mediaController = createHeroMediaController({
    state,
    readFileToDataUrl,
    getRecorder,
    renderHeroes,
  });
  const dragController = createHeroDragController({
    state,
    els,
    getRecorder,
    remapHeroReferences,
    renderHeroes,
    resolveHeroImageTarget,
    applyHeroImageFile: mediaController.applyHeroImageFile,
  });

  els.heroesGroupsContainer.addEventListener("input", (event) => {
    if (!state.editMode) return;

    const target = event.target;
    if (target.matches?.(".hero-accent-picker")) {
      const expanded = target.closest(".hero-expanded");
      const resolved = resolveHeroFromNode(state, expanded);
      if (!resolved) return;

      resolved.hero.accentColorOverride = target.value;
      getRecorder().upsert("heroItem", resolved.hero.id, resolved.hero, { groupId: resolved.group.id });
      updateHeroAccentPreview(els.heroesGroupsContainer, resolved.group.id, resolved.hero.id, target.value);
      const resetButton = expanded?.querySelector(".hero-accent-reset");
      if (resetButton) resetButton.hidden = false;
      return;
    }

    if (!EDITABLE_HERO_FIELDS.some((className) => target.classList.contains(className))) return;

    if (target.classList.contains("heroes-group-title") || target.classList.contains("heroes-group-subtitle")) {
      const section = target.closest(".heroes-group");
      const group = state.heroesData.find((entry) => entry.id === section?.dataset?.heroGroup);
      if (!group) return;

      if (target.classList.contains("heroes-group-title")) setLocalizedValue(group, "title", target.textContent.trim(), state);
      if (target.classList.contains("heroes-group-subtitle")) setLocalizedValue(group, "subtitle", target.textContent.trim(), state);
      getRecorder().upsert("heroGroup", group.id, group);
      return;
    }

    const card = target.closest(".hero-card, .hero-expanded");
    const resolved = resolveHeroFromNode(state, card);
    if (!resolved) return;
    const { group, hero } = resolved;

    if (target.classList.contains("hero-card-title") || target.classList.contains("hero-expanded-title")) {
      setLocalizedValue(hero, "title", target.textContent.trim(), state);
    }
    if (target.classList.contains("hero-card-role") || target.classList.contains("hero-expanded-role")) {
      setLocalizedValue(hero, "role", target.textContent.trim(), state);
    }
    if (target.classList.contains("hero-card-text")) {
      setLocalizedValue(hero, "description", target.textContent.trim(), state);
    }
    if (target.classList.contains("hero-expanded-text")) {
      setLocalizedValue(hero, "fullDescription", target.textContent.trim(), state);
    }

    getRecorder().upsert("heroItem", hero.id, hero, { groupId: group.id });
  });

  els.heroesGroupsContainer.addEventListener("dblclick", (event) => {
    if (!state.editMode) return;
    const resolved = resolveHeroImageTarget(state, event.target);
    if (!resolved) return;

    event.preventDefault();
    mediaController.promptImageLabel(resolved.group, resolved.hero);
  });

  els.heroesGroupsContainer.addEventListener("click", (event) => {
    if (!state.editMode) return;

    const resetAccentButton = event.target.closest(".hero-accent-reset");
    if (resetAccentButton) {
      const expanded = resetAccentButton.closest(".hero-expanded");
      const resolved = resolveHeroFromNode(state, expanded);
      if (!resolved) return;

      event.preventDefault();
      event.stopPropagation();
      resolved.hero.accentColorOverride = "";
      getRecorder().upsert("heroItem", resolved.hero.id, resolved.hero, { groupId: resolved.group.id });
      renderHeroes();
      return;
    }

    const addLinkButton = event.target.closest(".hero-link-add");
    if (addLinkButton) {
      const expanded = addLinkButton.closest(".hero-expanded");
      const resolved = resolveHeroFromNode(state, expanded);
      if (!resolved) return;

      event.preventDefault();
      event.stopPropagation();
      const link = askForHeroLink(state);
      if (!link) return;

      resolved.hero.links = Array.isArray(resolved.hero.links) ? resolved.hero.links : [];
      resolved.hero.links.push(link);
      getRecorder().upsert("heroItem", resolved.hero.id, resolved.hero, { groupId: resolved.group.id });
      renderHeroes();
      return;
    }

    const existingLink = event.target.closest(".hero-link[data-link-index]");
    if (existingLink && event.altKey) {
      const expanded = existingLink.closest(".hero-expanded");
      const resolved = resolveHeroFromNode(state, expanded);
      if (!resolved) return;

      event.preventDefault();
      event.stopPropagation();
      const linkIndex = Number(existingLink.dataset.linkIndex);
      resolved.hero.links = (resolved.hero.links || []).filter((_, index) => index !== linkIndex);
      getRecorder().upsert("heroItem", resolved.hero.id, resolved.hero, { groupId: resolved.group.id });
      renderHeroes();
      return;
    }

    const resolved = resolveHeroImageTarget(state, event.target);
    if (!resolved) return;
    activeImageTarget = resolved;
    heroImageInput.click();
  });

  heroImageInput.addEventListener("change", async (event) => {
    const [file] = Array.from(event.target.files || []);
    if (file && activeImageTarget) {
      await mediaController.applyHeroImageFile(file, activeImageTarget.group, activeImageTarget.hero);
    }
    heroImageInput.value = "";
    activeImageTarget = null;
  });

  els.heroesGroupsContainer.addEventListener("paste", async (event) => {
    if (!state.editMode) return;
    const resolved = resolveHeroImageTarget(state, event.target);
    if (!resolved) return;

    const imageItem = Array.from(event.clipboardData?.items || []).find((item) => item.type.startsWith("image/"));
    const file = imageItem?.getAsFile();
    if (!file) return;

    event.preventDefault();
    await mediaController.applyHeroImageFile(file, resolved.group, resolved.hero);
  });

  els.heroesGroupsContainer.addEventListener("dragstart", dragController.handleDragStart);
  els.heroesGroupsContainer.addEventListener("dragend", dragController.handleDragEnd);
  els.heroesGroupsContainer.addEventListener("dragover", dragController.handleDragOver);
  els.heroesGroupsContainer.addEventListener("dragleave", dragController.handleDragLeave);
  els.heroesGroupsContainer.addEventListener("drop", dragController.handleDrop);
}
