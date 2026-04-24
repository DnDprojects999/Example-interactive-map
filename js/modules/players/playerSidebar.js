import * as playerSidebarStorage from "./playerSidebarStorage.js";
import * as playerSidebarTargets from "./playerSidebarTargets.js";
import { createPlayerSidebarFavoritesController } from "./playerSidebarFavoritesController.js";
import { createPlayerSidebarNotesController } from "./playerSidebarNotesController.js";
import { createPlayerSidebarRosterController } from "./playerSidebarRosterController.js";

// Favorites and notes are personal helpers layered on top of the project data,
// while the player roster itself is part of editable shared content.
export function createPlayerSidebarController(options) {
  const {
    els,
    state,
    getChangeRecorder,
    getUiText,
    onNavigate,
    onPlayersChanged,
  } = options;

  let favorites = playerSidebarStorage.normalizeStoredFavorites(
    playerSidebarStorage.safeReadStorage(playerSidebarStorage.FAVORITES_STORAGE_KEY, []),
    playerSidebarTargets.normalizeTarget,
  );
  let notesState = playerSidebarStorage.normalizeNotesState(
    playerSidebarStorage.safeReadStorage(playerSidebarStorage.NOTES_STORAGE_KEY, ""),
  );
  let activePanel = null;

  const t = (key, params = {}) => (typeof getUiText === "function" ? getUiText(key, params) : key);

  function getNotesPageLabel(label) {
    if (playerSidebarStorage.isDefaultNotePageLabel(label)) return t("notes_default_page");
    return String(label || "").trim();
  }

  function persistFavorites() {
    playerSidebarStorage.safeWriteStorage(playerSidebarStorage.FAVORITES_STORAGE_KEY, favorites);
  }

  function persistNotes() {
    playerSidebarStorage.safeWriteStorage(playerSidebarStorage.NOTES_STORAGE_KEY, notesState);
  }

  function close() {
    activePanel = null;
    els.favoritesPanel.hidden = true;
    els.notesPanel.hidden = true;
    els.playersPanel.hidden = true;
    els.favoritesToggleButton.classList.remove("active");
    els.notesToggleButton.classList.remove("active");
    els.playersToggleButton.classList.remove("active");
  }

  const favoritesController = createPlayerSidebarFavoritesController({
    els,
    state,
    t,
    onNavigate,
    onClose: close,
    getFavorites: () => favorites,
    setFavorites: (nextFavorites) => {
      favorites = nextFavorites;
    },
    persistFavorites,
  });

  const notesController = createPlayerSidebarNotesController({
    els,
    t,
    getNotesState: () => notesState,
    setNotesState: (nextState) => {
      notesState = nextState;
    },
    persistNotes,
    getNotesPageLabel,
  });

  const rosterController = createPlayerSidebarRosterController({
    els,
    state,
    t,
    getChangeRecorder,
    onNavigate: (target) => onNavigate?.(target),
    onPlayersChanged,
  });

  function rerenderActivePanels() {
    if (activePanel === "favorites") favoritesController.renderFavorites();
    if (activePanel === "players") rosterController.renderPlayers();
  }

  function setPlayerTarget(target) {
    rosterController.setPlayerTarget(target);
    rerenderActivePanels();
  }

  function open(panelName) {
    activePanel = panelName;
    els.favoritesPanel.hidden = panelName !== "favorites";
    els.notesPanel.hidden = panelName !== "notes";
    els.playersPanel.hidden = panelName !== "players";
    els.favoritesToggleButton.classList.toggle("active", panelName === "favorites");
    els.notesToggleButton.classList.toggle("active", panelName === "notes");
    els.playersToggleButton.classList.toggle("active", panelName === "players");
    if (panelName === "favorites") favoritesController.renderFavorites();
    if (panelName === "notes") notesController.renderNotes();
    if (panelName === "players") rosterController.renderPlayers();
  }

  function toggle(panelName) {
    if (activePanel === panelName) {
      close();
      return;
    }
    open(panelName);
  }

  function remapHeroReference(heroId, fromGroupId, toGroupId) {
    favoritesController.remapHeroReference(heroId, fromGroupId, toGroupId);
    rerenderActivePanels();
  }

  function remapArchiveItemReference(itemId, fromGroupId, toGroupId) {
    favoritesController.remapArchiveItemReference(itemId, fromGroupId, toGroupId);
    rerenderActivePanels();
  }

  function setup() {
    favoritesController.renderFavorites();
    notesController.renderNotes();
    rosterController.renderPlayers();

    els.favoritesToggleButton.addEventListener("click", () => toggle("favorites"));
    els.notesToggleButton.addEventListener("click", () => toggle("notes"));
    els.playersToggleButton.addEventListener("click", () => toggle("players"));
    els.favoritesCloseButton.addEventListener("click", close);
    els.notesCloseButton.addEventListener("click", close);
    els.playersCloseButton.addEventListener("click", close);
    els.addFavoriteButton.addEventListener("click", () => favoritesController.addCurrentFavorite());
    els.addPlayerButton.addEventListener("click", () => rosterController.createPlayer());
    els.clearNotesButton.addEventListener("click", () => notesController.clearNotes());
    els.addNotesPageButton.addEventListener("click", () => notesController.addNotePage());
    els.deleteNotesPageButton.addEventListener("click", () => notesController.deleteCurrentNotePage());
    els.notesTextarea.addEventListener("input", () => {
      const activePage = notesController.getActiveNotePage();
      if (!activePage) return;
      activePage.text = els.notesTextarea.value;
      persistNotes();
      notesController.renderNotes();
    });

    document.addEventListener("click", (event) => {
      if (els.favoritesPanel.hidden && els.notesPanel.hidden && els.playersPanel.hidden) return;
      if (
        els.favoritesPanel.contains(event.target)
        || els.notesPanel.contains(event.target)
        || els.playersPanel.contains(event.target)
        || els.favoritesToggleButton.contains(event.target)
        || els.notesToggleButton.contains(event.target)
        || els.playersToggleButton.contains(event.target)
      ) {
        return;
      }
      close();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && activePanel) close();
    });
  }

  return {
    close,
    open,
    remapArchiveItemReference,
    remapHeroReference,
    renderFavorites: () => favoritesController.renderFavorites(),
    renderNotes: () => notesController.renderNotes(),
    renderPlayers: () => rosterController.renderPlayers(),
    setPlayerTarget,
    setup,
    toggle,
  };
}
