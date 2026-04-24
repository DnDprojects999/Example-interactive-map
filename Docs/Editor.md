# Editor Mode & Workflow

## Opening Editor Mode

Editor mode turns Serkonia from a player-facing world portal into a browser-based content editor.

Use this shortcut:

```text
Ctrl + Shift + `
```

Local addresses such as `localhost`, `127.0.0.1`, and `::1` can open editor mode automatically. Published GitHub Pages builds keep editor mode private unless `publicEditorAccess` is set to `true` in `index.html`.

## What The Editor Can Change

The editor is split into contextual tools so the main interface stays readable.

- `Information`: opens data audit, runtime logs, notifications, and hover-hint reset controls.
- `World`: edits the loading screen, preview loading state, and loading artwork.
- `Map`: adds region labels, toggles draw mode, edits map markers, and works with map texture/view tools in the topbar.
- `Timeline`: adds and edits acts/events while the timeline section is open.
- `Archive`: adds and edits archive groups, cards, images, and linked records.
- `Homebrew`: adds categories, articles, blocks, tables, and section content.
- `Hall of Heroes`: adds hero groups, hero cards, media, accent colors, and links.
- `Site style`: switches the visual theme and palette group used by the current world.
- `Audio`: edits global sound toggles, volume levels, UI sounds, open sounds, and ambience per mode.

Homebrew and Hall of Heroes use their own section-specific editor controls, so the bottom editor panel hides there when it is not needed.

## Saving Model

Serkonia does not write directly to the project files from the browser. Instead, browser edits are tracked as an overlay.

Base content files:

- `data/markers.json`
- `data/timeline.json`
- `data/archive.json`
- `data/heroes.json`
- `data/homebrew.json`
- `data/players.json`
- `data/world.json`

Browser edit overlay:

- `data/changes.json`

The usual workflow is:

1. Run the project locally.
2. Open editor mode.
3. Edit map, timeline, archive, heroes, homebrew, world settings, styles, or audio.
4. Use `Export JSON` to download the current change overlay.
5. Replace or merge `data/changes.json` in the repository.
6. Commit and publish.

You can also use `Import JSON` to continue from an exported overlay in another browser or another copy of the project.

## Local Vs Published Editing

For a player-facing public site, keep this setting in `index.html`:

```html
window.SERKONIA_CONFIG = {
  publicEditorAccess: false,
};
```

For a private fork or a public editable copy, change it to:

```html
window.SERKONIA_CONFIG = {
  publicEditorAccess: true,
};
```

Be careful with public editor access. Anyone who can open the published site can use the editor UI, export data, and prepare changes.

## Data Audit

The `Audit` button checks the main content files for common publishing problems: missing images, broken links, empty text, unresolved references, and inconsistent structure.

Use audit before publishing a release. It is a content-quality helper, not a replacement for opening the site and checking the visual result.

## Hover Hints

Hover hints are small one-time explanations for interface buttons and sections.

They disappear for a user only after the user keeps the hint visible for about one second and then leaves the target. This avoids accidentally burning hints by quickly moving the mouse across the UI.

Editor tools include reset buttons so you can test the hint system again.

## Recommended Release Workflow

1. Run locally.
2. Import the latest `data/changes.json` if needed.
3. Check map, timeline, archive, homebrew, heroes, audio, language, and themes.
4. Run `Audit`.
5. Export JSON.
6. Commit data and documentation updates.
7. Publish through GitHub Pages.
