import type { DockviewApi } from "dockview-react"

let api: DockviewApi | null = null

export function setDockApi(next: DockviewApi | null): void {
  api = next
}

export function focusPanel(connectionId: string): boolean {
  const panel = api?.getPanel(connectionId)
  if (panel) {
    panel.api.setActive()
    return true
  }
  return false
}
