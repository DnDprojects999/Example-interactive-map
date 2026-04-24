import {
  getMapViewConfig,
  getMapViewLabel,
  getMapViewTextureKey,
} from "../mapViews.js";
import { getUiText } from "../uiLocale.js";

export function createMapTextureController({
  els,
  state,
  changesManager,
  readFileToDataUrl,
}) {
  function resolveTextureKeyByMode(mode = state.mapViewMode) {
    return getMapViewTextureKey(state.worldData, mode);
  }

  function applyMapTexture(source) {
    els.mapPhotoLayer.style.setProperty("--map-photo-image", source ? `url("${source}")` : "none");
  }

  function applyTextureForCurrentMapMode() {
    const textureKey = resolveTextureKeyByMode();
    applyMapTexture(state.mapTextureByType?.[textureKey] || "");
  }

  function updateMapTextureButtonLabel() {
    const view = getMapViewConfig(state.worldData, state.mapViewMode);
    const modeLabel = getMapViewLabel(view, state, view.label || view.id);
    els.uploadMapTextureButton.textContent = getUiText(state, "upload_map_texture_for_mode", { mode: modeLabel });
  }

  async function handleMapTextureSelection(file) {
    if (!file || !file.type.startsWith("image/")) return;

    const textureKey = resolveTextureKeyByMode();
    const dataUrl = await readFileToDataUrl(file);
    state.mapTextureByType[textureKey] = dataUrl;
    changesManager.upsert("mapTexture", textureKey, dataUrl);
    applyTextureForCurrentMapMode();

    const view = getMapViewConfig(state.worldData, state.mapViewMode);
    const modeLabel = getMapViewLabel(view, state, view.label || view.id);
    els.panelSubtitle.textContent = getUiText(state, "upload_map_texture_updated_subtitle", { mode: modeLabel });
    els.panelText.textContent = getUiText(state, "upload_map_texture_updated_text", {
      file: file.name,
      mode: modeLabel,
    });
  }

  return {
    resolveTextureKeyByMode,
    applyTextureForCurrentMapMode,
    updateMapTextureButtonLabel,
    handleMapTextureSelection,
  };
}
