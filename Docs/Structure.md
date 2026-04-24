# Project Structure

This document describes the current modular structure of Serkonia after the UI, editor, localization, theme, and content systems were split into focused files.

## Root

- `index.html`: static HTML shell, editor access config, topbar/sidebar/panel containers, popovers, editor panel, and script entrypoint.
- `README.md`: public project overview and quick start.
- `Docs/Editor.md`: editor workflow and publishing notes.
- `Docs/Structure.md`: this architecture map.
- `data/`: world content and browser-edit overlay.
- `assets/`: static icons and media.
- `css/`: split style layers imported by `css/style.css`.
- `js/`: application bootstrap and modules.
- `scripts/`: local maintenance and smoke-test scripts.

## CSS Layers

`css/style.css` is now only an import hub. The real styles are split by responsibility:

- `css/theme-foundation.css`: variables, base theme tokens, global defaults, and shared primitives.
- `css/loading.css`: boot/loading screen and loading preview styles.
- `css/topbar.css`: global navigation, language menu, audio popover, map-view controls, and topbar tools.
- `css/shell.css`: app shell, map frame, sidebars, player utilities, hover hints, and shared popovers.
- `css/content.css`: timeline, archive, homebrew, heroes, detail panels, and section content.
- `css/editor.css`: editor panel, editor controls, audit/log/notification windows, draw tools, and editor-only states.
- `css/theme-presets.css`: site-theme overrides such as the sci-fi command-deck theme and its palette variants.

When adding a new style theme, prefer `theme-presets.css` for visual overrides and `js/modules/siteThemes.js` for theme metadata/variables.

## JavaScript Entry

- `js/app.js`: main bootstrap. It loads data, applies changes, initializes UI/map/editor/audio/controllers, wires import/export, and manages the loading sequence.

The entry file should stay as orchestration code. New behavior should usually live in a module under `js/modules/`.

## Core Data And State

- `js/modules/state.js`: shared runtime state for current mode, language, map view, editor flags, selected marker, palettes, and loaded content.
- `js/modules/data.js`: loads JSON files from `data/` and normalizes missing optional pieces.
- `js/modules/changes.js`: public facade for change validation, applying overlays, and creating the change manager.
- `js/modules/changesApply.js`: applies imported/exported overlay payloads to runtime data.
- `js/modules/changesManager.js`: records browser edits as structured changes.
- `js/modules/changesSchema.js`: validates the shape of change payloads.
- `js/modules/worldInfo.js`: world branding, loading copy, language settings, map views, site theme, and audio defaults.

## UI Shell

- `js/modules/ui.js`: central UI composer. It creates controllers, passes shared callbacks, and exposes high-level UI methods to the app.
- `js/modules/ui/shellScaffoldController.js`: base shell rendering and layout scaffolding.
- `js/modules/ui/shellEventsController.js`: shared shell events and panel behavior.
- `js/modules/ui/modeController.js`: switches between map, timeline, archive, homebrew, and heroes.
- `js/modules/ui/navigationController.js`: topbar navigation and mode buttons.
- `js/modules/ui/editorChromeController.js`: bottom editor panel layout, collapse behavior, and editor chrome state.
- `js/modules/ui/setupController.js`: startup UI synchronization.
- `js/modules/ui/referenceRemapper.js`: keeps cross-links stable when ids change.
- `js/modules/ui/timelineSurfaceController.js`: timeline surface setup inside the shared shell.
- `js/modules/ui/timelineActsController.js`, `timelineActsActionsController.js`, `timelineActsViewController.js`: timeline act UI and editor actions.

## Map System

- `js/modules/map.js`: marker rendering, map interactions, viewport behavior, and map surface updates.
- `js/modules/mapControls.js`: map view controls and visibility toggles.
- `js/modules/mapViews.js`: map-view definitions and normalization.
- `js/modules/mapTextToolbar.js`: region-label text toolbar.
- `js/modules/sidebarLegend.js`: layer legend and layer editor UI.
- `js/modules/paletteControls.js`: palette popover, palette groups per site theme, and custom palette creation.
- `js/modules/panelDetails.js`: detail panel facade.
- `js/modules/panelDetailsViewController.js`: read-only detail rendering.
- `js/modules/panelDetailsEditingController.js`: editor fields for selected details.
- `js/modules/panelDetailsLinksController.js`: timeline/archive linking from the detail panel.
- `js/modules/panelImages.js`: image URL/upload behavior for detail panels.

## Editor System

- `js/modules/editor.js`: map-editor facade and editor integration.
- `js/modules/editorActions.js`: editor action hub for map/content/world controls.
- `js/modules/editorCollectionActions.js`: shared collection create/update/delete helpers.
- `js/modules/editorTimelineActions.js`: timeline-specific editor actions.
- `js/modules/editor/defaults.js`: editor defaults and constants.
- `js/modules/editor/drawLayersController.js`: draw-layer controls and brush settings.
- `js/modules/editor/mapTextureController.js`: texture upload and map texture handling.
- `js/modules/editor/regionLabelsController.js`: region label creation and editing.
- `js/modules/editor/sidebarController.js`: editor sidebar integration.
- `js/modules/editor/statusController.js`: editor status messages.

## App-Level Controllers

- `js/modules/app/compactTopbarMenus.js`: compact topbar menu behavior.
- `js/modules/app/languageSwitcher.js`: language switching controller.
- `js/modules/app/languagePopoverController.js`: language popover rendering and editor language actions.
- `js/modules/app/loadingScreenAdminController.js`: loading screen editor orchestration.
- `js/modules/app/loadingScreenFormController.js`: loading screen form fields.
- `js/modules/app/mapViewAdminController.js`: editor tools for map-view names, visibility, and texture targets.
- `js/modules/app/techConsoleController.js`: sci-fi system log/command overlay.
- `js/modules/app/hintsController.js`: hover-hint registration, placement, timers, and dismissal logic.
- `js/modules/app/hintsStorage.js`: local storage for viewed hover hints.

## Content Sections

- `js/modules/archive/`: archive controller, view, sidebar, images, and interactions.
- `js/modules/heroes/`: Hall of Heroes controller, view, drag behavior, media tools, link picker, and accent handling.
- `js/modules/homebrew/`: homebrew state, shared helpers, article blocks, reader view, editor view, and controller.
- `js/modules/players/`: player roster, sidebar, favorites, notes, storage, targets, and player-related popouts.

## Localization And UI Text

- `js/modules/localization.js`: content translation helpers and language normalization.
- `js/modules/uiLocale.js`: UI-locale resolver and loading flavor helpers.
- `js/modules/uiLocaleStrings.js`: Russian and English UI strings.

For user-facing text, prefer adding a key to `uiLocaleStrings.js` instead of hard-coding strings in a controller.

## Themes And Palettes

- `js/modules/siteThemes.js`: built-in site themes, theme labels, CSS variable allowlist, and theme application.
- `js/modules/paletteControls.js`: palette selection and theme-specific palette groups.
- `css/theme-presets.css`: visual implementation of theme and palette variants.

Current built-in site themes:

- `serkonia`: default restrained fantasy interface.
- `serkonia-command`: sci-fi command-deck interface with theme-specific palettes.

## Data Quality And Diagnostics

- `js/modules/dataQuality.js`: data audit controller and audit UI connection.
- `js/modules/quality/runAudit.js`: audit runner.
- `js/modules/quality/rules/`: content rules for map, timeline, archive, heroes, and homebrew.
- `js/modules/quality/issueCatalog.js`, `issueKeys.js`, `formatIssue.js`, `utils.js`: issue definitions and formatting.
- `js/modules/diagnostics/`: runtime logs, editor action reporting, notification store, and error bus.

## Audio

- `js/modules/audio/audioManager.js`: audio controller facade used by the app.
- `js/modules/audio/audioEngine.js`: playback, volume, and ambience handling.
- `js/modules/audio/audioPersistence.js`: local/default audio settings persistence.
- `js/modules/audio/audioUiController.js`: audio popover UI and editor upload controls.

## Data Files

- `data/markers.json`: map layers, markers, region labels, textures, and map-related content.
- `data/timeline.json`: timeline acts and events.
- `data/archive.json`: archive groups and cards.
- `data/heroes.json`: hero groups and hero cards.
- `data/homebrew.json`: homebrew categories and articles.
- `data/players.json`: player roster data.
- `data/world.json`: world-level config, branding, language, map views, theme, and audio defaults.
- `data/changes.json`: browser-edit overlay.
- `data/schemas/`: JSON schemas used by validation tooling.

## Where To Edit Common Things

- Branding, world name, loading copy: editor mode or `data/world.json`.
- Site themes: `js/modules/siteThemes.js` and `css/theme-presets.css`.
- Palette behavior: `js/modules/paletteControls.js` and `css/theme-presets.css`.
- Global layout: `css/topbar.css`, `css/shell.css`, and `css/content.css`.
- Editor panel: `css/editor.css` and `js/modules/ui/editorChromeController.js`.
- Map behavior: `js/modules/map.js`, `mapControls.js`, `mapViews.js`, and `sidebarLegend.js`.
- Detail panel: `panelDetails*.js` and `panelImages.js`.
- Timeline: `timelineModel.js`, `timelineView.js`, `timelineSidebar.js`, and `js/modules/ui/timelineActs*.js`.
- Archive: `js/modules/archive/`.
- Heroes: `js/modules/heroes/`.
- Homebrew: `js/modules/homebrew/`.
- Player tools: `js/modules/players/`.
- Hover hints: `js/modules/app/hintsController.js`, `hintsStorage.js`, and `uiLocaleStrings.js`.
- Data audit: `js/modules/quality/` and `js/modules/dataQuality.js`.
