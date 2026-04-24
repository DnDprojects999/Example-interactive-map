import * as playerSidebarStorage from "./playerSidebarStorage.js";

export function createPlayerSidebarNotesController(options) {
  const {
    els,
    t,
    getNotesState,
    setNotesState,
    persistNotes,
    getNotesPageLabel,
  } = options;

  /**
   * Notes must always have one active page so the textarea can be rebound
   * after deletions, migrations and partially broken localStorage payloads.
   */
  function getActiveNotePage() {
    const notesState = getNotesState();
    if (!Array.isArray(notesState.pages) || !notesState.pages.length) {
      setNotesState(playerSidebarStorage.createDefaultNotesState());
      persistNotes();
    }

    const currentState = getNotesState();
    const active = currentState.pages.find((page) => page.id === currentState.activePageId);
    if (active) return active;

    currentState.activePageId = currentState.pages[0]?.id || playerSidebarStorage.createNotePage().id;
    persistNotes();
    return currentState.pages.find((page) => page.id === currentState.activePageId) || currentState.pages[0] || null;
  }

  function renderNotes() {
    // Notes are page-based so long campaign journals stay manageable and do not
    // collapse into one ever-growing textarea.
    const notesState = getNotesState();
    const activePage = getActiveNotePage();
    if (!activePage) return;

    els.notesPagesList.innerHTML = "";
    notesState.pages.forEach((page) => {
      const tab = document.createElement("button");
      tab.className = "player-notes-tab";
      tab.type = "button";
      tab.textContent = getNotesPageLabel(page.label);
      tab.title = getNotesPageLabel(page.label);
      tab.classList.toggle("active", page.id === notesState.activePageId);
      tab.addEventListener("click", () => {
        notesState.activePageId = page.id;
        persistNotes();
        renderNotes();
      });
      tab.addEventListener("dblclick", () => renameNotePage(page.id));
      els.notesPagesList.appendChild(tab);
    });

    els.addNotesPageButton.disabled = notesState.pages.length >= playerSidebarStorage.MAX_NOTE_PAGES;
    els.deleteNotesPageButton.disabled = notesState.pages.length <= 1;

    if (document.activeElement !== els.notesTextarea) {
      els.notesTextarea.value = activePage.text;
    }

    const trimmed = activePage.text.trim();
    if (!trimmed) {
      els.notesStatus.textContent = t("notes_page_empty", { label: getNotesPageLabel(activePage.label) });
      return;
    }

    const lines = trimmed.split(/\r?\n/).filter((line) => line.trim()).length;
    const chars = trimmed.length;
    els.notesStatus.textContent = t("notes_page_stats", { label: getNotesPageLabel(activePage.label), lines, chars });
  }

  function clearNotes() {
    const activePage = getActiveNotePage();
    if (!activePage) return;
    activePage.text = "";
    persistNotes();
    els.notesTextarea.value = "";
    renderNotes();
  }

  function addNotePage() {
    const notesState = getNotesState();
    if (notesState.pages.length >= playerSidebarStorage.MAX_NOTE_PAGES) return;
    const label = window.prompt(t("notes_add_page"), "");
    if (label == null) return;
    if (!String(label).trim()) return;

    const page = playerSidebarStorage.createNotePage(label);
    notesState.pages.push(page);
    notesState.activePageId = page.id;
    persistNotes();
    renderNotes();
    els.notesTextarea.focus();
  }

  function renameNotePage(pageId) {
    const notesState = getNotesState();
    const page = notesState.pages.find((entry) => entry.id === pageId);
    if (!page) return;

    const label = window.prompt(t("notes_rename_page"), getNotesPageLabel(page.label));
    if (label == null) return;
    if (!String(label).trim()) return;

    page.label = playerSidebarStorage.normalizeNotePageLabel(label);
    persistNotes();
    renderNotes();
  }

  function deleteCurrentNotePage() {
    const notesState = getNotesState();
    if (notesState.pages.length <= 1) {
      clearNotes();
      return;
    }

    const activePage = getActiveNotePage();
    if (!activePage) return;

    const shouldDelete = window.confirm(t("notes_delete_page", { label: getNotesPageLabel(activePage.label) }));
    if (!shouldDelete) return;

    const activeIndex = notesState.pages.findIndex((page) => page.id === activePage.id);
    notesState.pages = notesState.pages.filter((page) => page.id !== activePage.id);
    const fallbackIndex = Math.max(0, Math.min(activeIndex, notesState.pages.length - 1));
    notesState.activePageId = notesState.pages[fallbackIndex]?.id || notesState.pages[0]?.id || "";
    persistNotes();
    renderNotes();
  }

  return {
    addNotePage,
    clearNotes,
    deleteCurrentNotePage,
    getActiveNotePage,
    renderNotes,
    renameNotePage,
  };
}
