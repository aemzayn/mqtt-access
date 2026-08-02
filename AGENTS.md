# AGENTS.md

Instructions for AI coding agents working in this repo. This is the Wails v2
(Go backend) port of a Tauri app; UI mirrors a VS Code Dark+ minimalist style
using Blueprint 6 + Inter.

## Commands

```sh
cd frontend && npm install     # first-time setup
wails dev                      # run the app in dev mode (from repo root)
wails build                    # production bundle
cd frontend && npm test        # frontend unit tests (vitest)
cd frontend && npm run format  # prettier --write
go test ./...                 # Go tests (from repo root)
```

`wails dev`/`wails build` read `frontend:install`/`frontend:build` from
`wails.json`, which shell out to `npm install`/`npm run build` in `frontend/`.

## Architecture

Go owns the MQTT connections and all message data. Each connection configures
a Paho MQTT client and ingests incoming messages into a per-connection
`TopicStore` (topic trie + bounded per-topic history). A 100 ms **batcher**
coalesces dirty topics and emits one `mqtt:batch` Wails event (<=10 Hz) — cost
is O(distinct topics touched), not O(messages). The frontend keeps a
lightweight off-React mirror tree for rendering and fetches full
payloads/history on demand.

Live per-message events (`mqtt:message`) are opt-in per topic via **two
independent watch sets per connection**: the tree-selection watch (one topic
at a time) and a separate trend watch set (any number of topics pinned to a
trend chart). Both must be re-issued by the frontend after every successful
(re)connect — a fresh connection handle starts with empty watch state.

Key files:
- `mqtt/client.go` — connection setup, transports, reconnect behavior, TLS
  wiring, the dual watch-set message filter
- `mqtt/store.go` — topic trie + bounded history
- `mqtt/batcher.go` — coalesced batch emission (`mqtt:batch`)
- `mqtt/handle.go` — per-connection watch state (tree-selection + trend sets)
- `app.go` — Wails-bound commands and event flow; app info, settings, and
  trend persistence
- `storage/storage.go` — reads/writes `connections.json`, `layout.json`,
  `settings.json`, `trends.json` in the OS app-config directory
- `frontend/src/lib/topicMirror.ts` — off-React tree mirror + flatten
  (render-perf linchpin)
- `frontend/src/lib/json.ts` — payload type detection, JSON path resolution,
  structured/diff-aware JSON line renderer
- `frontend/src/components/dock/DockArea.tsx` — dockview panels, minimize
  strip, layout persistence
- `frontend/src/components/trends/` — trend charts, persistence, collapsible
  bottom panel
- `frontend/src/stores/settingsStore.ts` — theme/font-size/language state,
  persisted via Go `LoadSettings`/`SaveSettings`
- `frontend/src/i18n/` — the 8 translation dictionaries and `useT()` hook

## Conventions

- All app styles live in `frontend/src/index.css` (design tokens + Blueprint
  overrides). Theme, font-scale, and the tree-blink opt-out are CSS classes on
  `<html>`, not component state.
- The app keeps `Classes.DARK` (`bp6-dark`) permanently — there is no
  Blueprint light mode toggle, only the app's own theme palettes. When
  overriding a Blueprint style, write the selector with the `.bp6-dark`/
  `.bp6-dialog` prefix (e.g. `.bp6-dark .bp6-button`), or Blueprint's own
  `.bp6-dark .bp6-X` rule wins on specificity.
- New user-facing strings need an entry in every dictionary under
  `frontend/src/i18n/`, not just English.
- Message data is RAM-only and bounded (default 1000 messages/topic); the
  topic tree and history survive disconnect/reconnect — only an explicit
  "Clear" wipes them. Don't reset either on reconnect.

## Testing with a broker

Public brokers (`broker.emqx.io`, `test.mosquitto.org`) work, but their bare
`#` wildcard is often throttled — subscribe to a specific prefix like
`bench/#`. For deterministic testing, run a local broker:

```sh
docker run -d --name mosq -p 18883:1883 -p 19001:9001 eclipse-mosquitto:2
```

Add a connection to `localhost:18883` subscribed to `bench/#` and publish
sample traffic (e.g. `mosquitto_pub`) to exercise tree updates, history, and
charts.

## Visual verification

There is no CDP access into the packaged exe (WebView2Loader doesn't open a
remote-debugging port via `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS`). To
screenshot/verify the frontend instead: run `npm run dev` in `frontend/`, then
drive Edge with `playwright-core` (`chromium.launch({ channel: "msedge" })`)
against `http://localhost:<vite-port>`, using an `addInitScript` that mocks
`window.go.main.App` (all bound methods) and `window.runtime`. The generated
`wailsjs/runtime` `EventsOn` delegates to `window.runtime.EventsOnMultiple` —
register mock event handlers there, not on `EventsOn` directly. Run the script
from `frontend/` (ESM ignores `NODE_PATH`).

## Release process

Version is tracked in `VERSION`, `wails.json` (`info.productVersion`),
`frontend/package.json`, `frontend/package-lock.json`, and
`build/windows/installer/wails_tools.nsh` (`INFO_PRODUCTVERSION`) — bump all
of them together. After bumping `frontend/package.json`, recompute
`frontend/package.json.md5` (`md5sum frontend/package.json`), which Wails uses
to detect frontend changes. Move `[Unreleased]` changelog entries in
`CHANGELOG.md` into a new `[x.y.z] - YYYY-MM-DD` section and update the
compare links at the bottom of the file. Pushing a `vX.Y.Z` tag triggers
`.github/workflows/release.yml`, which builds Windows/macOS/Linux artifacts
and publishes a GitHub release.

## GIT

Never add yourself as a co-author when creating a git commit.