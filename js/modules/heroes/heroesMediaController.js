import { getLocalizedText, setLocalizedValue } from "../localization.js";
import { getUiText } from "../uiLocale.js";

export function resolveHeroFromNode(state, node) {
  const groupId = node?.dataset?.groupId;
  const heroId = node?.dataset?.heroId;
  const group = state.heroesData.find((entry) => entry.id === groupId);
  const hero = group?.items?.find((entry) => entry.id === heroId);
  if (!group || !hero) return null;
  return { group, hero };
}

export function resolveHeroImageTarget(state, target) {
  const imageNode = target?.closest?.(".hero-card-portrait, .hero-expanded-portrait");
  const card = target?.closest?.(".hero-card, .hero-expanded");
  if (!imageNode || !card) return null;
  const resolved = resolveHeroFromNode(state, card);
  if (!resolved) return null;
  return { imageNode, ...resolved };
}

export function createHeroMediaController(options) {
  const {
    state,
    readFileToDataUrl,
    getRecorder,
    renderHeroes,
  } = options;

  async function applyHeroImageFile(file, group, hero) {
    if (!file || !state.editMode || !file.type?.startsWith("image/")) return;
    try {
      hero.imageUrl = await readFileToDataUrl(file);
      if (!getLocalizedText(hero, "imageLabel", state, "").trim()) {
        setLocalizedValue(hero, "imageLabel", getUiText(state, "heroes_image_label_fallback"), state);
      }
      getRecorder().upsert("heroItem", hero.id, hero, { groupId: group.id });
      renderHeroes();
    } catch (error) {
      console.error(error);
      window.alert(getUiText(state, "image_file_read_error"));
    }
  }

  function promptImageLabel(group, hero) {
    const nextLabel = window.prompt(
      getUiText(state, "heroes_image_label_prompt"),
      getLocalizedText(hero, "imageLabel", state, getUiText(state, "heroes_image_label_fallback")),
    );
    if (nextLabel == null) return;

    setLocalizedValue(hero, "imageLabel", nextLabel.trim() || getUiText(state, "heroes_image_label_fallback"), state);
    getRecorder().upsert("heroItem", hero.id, hero, { groupId: group.id });
    renderHeroes();
  }

  return {
    applyHeroImageFile,
    promptImageLabel,
  };
}
