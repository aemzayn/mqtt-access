# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Release workflow:
1. Add all upcoming changes under [Unreleased].
2. On release, move those entries into a new version section like [x.y.z] - YYYY-MM-DD.
3. Update [Unreleased] compare link to start from the new tag.
4. Add a version link for [x.y.z] that points to the GitHub release tag.

## [Unreleased]

## [1.0.0] - 2026-07-19

### Added
- Minimalist UI rebuilt on Blueprint 6 + Inter, matching the VS Code Dark+
  style of the original Tauri app.
- 5 themes (Dark, Light, Dracula, Dark high contrast, White high contrast),
  3 font sizes, and 8 languages (English, Türkçe, Bahasa Indonesia, 日本語,
  中文, Español, Deutsch, Français), configurable in a new Settings dialog.
- Settings → About section: app version, developer, license, website and
  GitHub links.
- Blink-on-activity animation for topics with new messages in the tree
  (toggleable in Settings).
- "Disconnect all" button in the sidebar.
- Copy-to-clipboard buttons for topics, payload values, and individual
  history entries.
- "Test connection" button in the connection form — dials the broker without
  saving or touching any live connection, and reports the result as a toast.
  Saving is never blocked by a failed test.
- Data-type badge (JSON/Number/Boolean/String/Binary) and a Diff/Raw mode
  toggle on the Value tab. Diff mode highlights exactly which JSON fields
  changed since the previous message, at the field level.
- Syntax highlighting for JSON/XML payloads in the Value tab, History tab,
  and the Publish editor.
- Trends: pin any numeric value (bare payload or a JSON field) to a live
  chart from the Value tab. Trends live in a collapsible, resizable panel at
  the bottom of the app, keep updating live no matter what's selected in any
  topic tree, and persist across restarts. Each chart supports pause/resume,
  a custom series color, a clear-data button, CSV export, adjustable width
  (33% / 50% / 100% / auto), and drag-to-reorder.
- Publish panel: payload data-type selector (Plain/JSON/Base64/Hex/XML) with
  format validation, a syntax-highlighted editor, and a prettify button. The
  panel is open by default and its height is resizable.
- Middle-click closes a dock tab, like a browser tab.

### Changed
- The topic tree and message history now survive a disconnect/reconnect
  cycle instead of resetting; "Clear" is the only way to wipe them.
- Failed or dropped connections report a toast with the underlying error
  instead of hanging in "connecting" or showing a permanent red status dot.
- Rewrote README to project-specific documentation for Wails v2 + Go backend
  and React + TypeScript frontend.
- Updated architecture, key-file references, development commands, and
  broker testing guidance.

### Fixed
- Disconnect button did nothing (the backend never reported the status
  change back to the UI).
- The Value tab's History pane could freeze after a reconnect or a "Clear".

## [0.1.0] - 2026-07-18

### Changed
- Rewrote README to project-specific documentation for Wails v2 + Go backend and React + TypeScript frontend.
- Updated architecture, key-file references, development commands, and broker testing guidance.

[Unreleased]: https://github.com/aemzayn/mqtt-access/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/aemzayn/mqtt-access/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/aemzayn/mqtt-access/releases/tag/v0.1.0
