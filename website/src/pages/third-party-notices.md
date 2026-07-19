---
layout: ../layouts/DocLayout.astro
title: Third-Party Notices
description: Open-source components and licenses used by MQTT Access.
---

# Third-Party Notices

This project includes third-party open-source software.

## 1. Source of truth

Authoritative dependency lists are defined in:
- `go.mod` / `go.sum`
- `frontend/package.json` (and lockfile, when present)

## 2. Major direct dependencies

Backend (Go):
- `github.com/eclipse/paho.mqtt.golang`
- `github.com/wailsapp/wails/v2`

Frontend (TypeScript/React):
- `react`
- `react-dom`
- `vite`
- `typescript`
- `vitest`
- `dockview-react`
- `uplot`
- `zustand`
- `@blueprintjs/core`

## 3. Licenses

Each dependency is licensed by its respective authors under its own terms.
You must review and comply with those licenses when redistributing this
software.

The project itself is licensed under MIT. See the [License](/license) page.

## 4. How to refresh notices

Recommended process before release:
1. Review direct and transitive dependency lists from Go and npm.
2. Collect license metadata for each dependency.
3. Update this file with any newly added components and required attributions.

Optional tooling examples (run locally if available):
- Go: `go list -m all`
- npm: `npm ls --all`

## 5. Trademark notice

All product names, logos, and brands are property of their respective owners.
Use of these names does not imply endorsement.
