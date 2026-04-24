export function createUiNavigationController(options) {
  const {
    els,
    state,
    playerSidebar,
    panelDetails,
    archiveController,
    heroesController,
    getHomebrewController,
    openMapMode,
    openTimelineMode,
    openArchiveMode,
    openHeroesMode,
    openHomebrewMode,
  } = options;

  function updateTimelineCurrentSelection() {
    const cards = els.timelineContainer.querySelectorAll(".event-card");
    cards.forEach((card) => card.classList.toggle("current", card.dataset.eventId === state.currentTimelineEventId));
  }

  function highlightElement(element, className = "search-hit") {
    if (!element) return;
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
    setTimeout(() => element.classList.remove(className), 1800);
  }

  function highlightOnNextFrame(resolveElement, options = {}) {
    requestAnimationFrame(() => {
      const element = resolveElement();
      if (options.scrollTarget) {
        options.scrollTarget(element)?.scrollIntoView?.(
          options.scrollOptions || { behavior: "smooth", block: "nearest" },
        );
      }
      options.beforeHighlight?.(element);
      highlightElement(element);
    });
  }

  function canOpenSection(sectionKey) {
    return state.editMode || state.worldData?.sectionVisibility?.[sectionKey] !== false;
  }

  function navigateToEntity(target) {
    // Navigation is intentionally entity-based, not view-based. Search, player
    // links, archive links, and homebrew all route through the same dispatcher.
    if (!target) return;
    playerSidebar.setPlayerTarget(target);

    if (target.type === "marker") {
      const marker = (state.markersData || []).find((entry) => entry.id === target.id);
      openMapMode();
      if (marker) panelDetails.updateFromMarker(marker);
      highlightOnNextFrame(() => els.markersContainer.querySelector(`[data-marker-id="${target.id}"]`));
      return;
    }

    if (target.type === "timeline") {
      if (!canOpenSection("timeline")) {
        openMapMode();
        return;
      }
      const timelineEvent = (state.eventsData || []).find((entry) => entry.id === target.id);
      state.currentTimelineEventId = target.id;
      state.currentTimelineEvent = timelineEvent || null;
      state.currentTimelineActId = timelineEvent?.actId || "";
      openTimelineMode();
      if (timelineEvent) panelDetails.updateFromTimelineEvent(timelineEvent);
      highlightOnNextFrame(
        () => els.timelineContainer.querySelector(`[data-event-id="${target.id}"]`),
        {
          scrollTarget: (eventCard) => eventCard?.closest(".timeline-event-item") || eventCard,
          scrollOptions: { behavior: "smooth", inline: "center", block: "nearest" },
          beforeHighlight: () => updateTimelineCurrentSelection(),
        },
      );
      return;
    }

    if (target.type === "archiveGroup") {
      if (!canOpenSection("archive")) {
        openMapMode();
        return;
      }
      state.activeArchiveGroupId = target.id;
      state.currentArchiveItemId = null;
      openArchiveMode();
      highlightOnNextFrame(
        () => els.archiveGroupsContainer.querySelector(`[data-archive-group="${target.id}"]`),
        {
          scrollTarget: (section) => section,
          scrollOptions: { behavior: "smooth", block: "start" },
        },
      );
      return;
    }

    if (target.type === "archiveItem") {
      if (!canOpenSection("archive")) {
        openMapMode();
        return;
      }
      state.activeArchiveGroupId = target.groupId || state.activeArchiveGroupId;
      state.currentArchiveItemId = target.id;
      openArchiveMode();
      highlightOnNextFrame(() => {
        archiveController.focusItem(target.groupId, target.id);
        return els.archiveGroupsContainer.querySelector(`[data-card-id="${target.groupId}-${target.id}"]`);
      });
      return;
    }

    if (target.type === "heroGroup") {
      if (!canOpenSection("heroes")) {
        openMapMode();
        return;
      }
      state.activeHeroGroupId = target.id;
      state.currentHeroId = null;
      openHeroesMode();
      highlightOnNextFrame(
        () => els.heroesGroupsContainer.querySelector(`[data-hero-group="${target.id}"]`),
        {
          scrollTarget: (section) => section,
          scrollOptions: { behavior: "smooth", block: "start" },
        },
      );
      return;
    }

    if (target.type === "heroItem") {
      if (!canOpenSection("heroes")) {
        openMapMode();
        return;
      }
      state.activeHeroGroupId = target.groupId || state.activeHeroGroupId;
      state.currentHeroId = target.id;
      openHeroesMode();
      highlightOnNextFrame(() => {
        heroesController.focusItem(target.groupId, target.id);
        return els.heroesGroupsContainer.querySelector(
          `[data-group-id="${target.groupId}"][data-hero-id="${target.id}"]`,
        );
      });
      return;
    }

    if (target.type === "homebrewArticle") {
      if (!canOpenSection("homebrew")) {
        openMapMode();
        return;
      }
      state.currentHomebrewArticleId = target.id;
      openHomebrewMode();
      getHomebrewController().focusArticle?.(target.id);
    }
  }

  return {
    navigateToEntity,
    updateTimelineCurrentSelection,
  };
}
