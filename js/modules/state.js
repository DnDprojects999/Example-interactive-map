import { DEFAULT_WORLD_INFO } from "./worldInfo.js";
import { DEFAULT_SITE_THEME_ID } from "./siteThemes.js";

// This is the shared client-side state tree for the whole app. Feature modules
// read and write here, while renderers decide which parts should be visible.
export const state = {
  currentSlide: 0,
  currentPalette: "ember",
  currentPaletteByGroup: {
    default: "ember",
    "serkonia-command": "blue",
  },
  currentSiteTheme: DEFAULT_SITE_THEME_ID,
  customPalettes: [],
  worldData: {
    ...DEFAULT_WORLD_INFO,
    languages: Array.isArray(DEFAULT_WORLD_INFO.languages) ? [...DEFAULT_WORLD_INFO.languages] : [],
    translations: { ...(DEFAULT_WORLD_INFO.translations || {}) },
  },
  currentLanguage: DEFAULT_WORLD_INFO.defaultLanguage || "ru",
  playersData: [],

  groupsData: [],
  markersData: [],
  timelineActsData: [],
  eventsData: [],
  archiveData: [],
  heroesData: [],
  homebrewCategoriesData: [],
  homebrewArticlesData: [],
  regionLabelsData: [],
  drawLayersData: [],

  currentMarker: null,
  currentRegionLabel: null,
  currentTimelineEvent: null,
  currentTimelineEventId: null,
  currentTimelineActId: "",
  currentArchiveItemId: null,
  currentHeroId: null,
  playerCurrentTarget: null,
  editMode: false,
  editorGroupId: null,
  activeDrawLayerId: null,
  drawMode: false,
  drawBrushColor: "#7dd3fc",
  drawBrushSize: 2,
  regionLabelsVisible: true,
  regionTextMode: false,
  regionTextMoveMode: false,
  timelineMode: false,
  archiveMode: false,
  heroesMode: false,
  homebrewMode: false,
  activeArchiveGroupId: null,
  activeHeroGroupId: null,
  currentHomebrewArticleId: null,
  currentHomebrewEditingArticleId: null,
  currentHomebrewEditingCategoryId: null,
  currentHomebrewCategoryPickerArticleId: null,
  currentHomebrewCategoryId: "all",
  currentHomebrewType: "change",
  homebrewSearchQuery: "",
  mapViewMode: "author",
  mapTextureByType: {
  },
  baseDataSnapshot: null,

  currentPanelEntity: {
    entity: "marker",
  },

  mapScale: 1,
  mapOffsetX: 0,
  mapOffsetY: 0,
  isPanning: false,
  panPointerId: null,
  panStartX: 0,
  panStartY: 0,
};

export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}
