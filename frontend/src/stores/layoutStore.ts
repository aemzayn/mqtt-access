import { create } from "zustand"
import type { SerializedDockview } from "dockview-react"
import * as commands from "../ipc/commands"
import type { StoredLayout } from "../ipc/commands"

interface LayoutState {
  openPanels: string[]
  minimized: string[]
  restoredLayout: SerializedDockview | null
  loaded: boolean

  load: () => Promise<void>
  openPanel: (connectionId: string) => void
  closePanel: (connectionId: string) => void
  minimize: (connectionId: string) => void
  restore: (connectionId: string) => void
  persistDockview: (layout: SerializedDockview) => void
}

let persistTimer: ReturnType<typeof setTimeout> | null = null
let latestDockview: SerializedDockview | null = null

function schedulePersist(get: () => LayoutState) {
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(async () => {
    const state = get()
    const payload: StoredLayout = {
      dockview: latestDockview,
      minimized: state.minimized,
      openPanels: state.openPanels,
    }
    await commands.saveLayout(payload)
  }, 500)
}

export const useLayoutStore = create<LayoutState>((set, get) => ({
  openPanels: [],
  minimized: [],
  restoredLayout: null,
  loaded: false,

  load: async () => {
    const saved = await commands.loadLayout()
    set({
      openPanels: saved?.openPanels ?? [],
      minimized: saved?.minimized ?? [],
      restoredLayout: (saved?.dockview as SerializedDockview | null) ?? null,
      loaded: true,
    })
    latestDockview = (saved?.dockview as SerializedDockview | null) ?? null
  },

  openPanel: connectionId => {
    set(state => ({
      openPanels: state.openPanels.includes(connectionId)
        ? state.openPanels
        : [...state.openPanels, connectionId],
      minimized: state.minimized.filter(id => id !== connectionId),
    }))
    schedulePersist(get)
  },

  closePanel: connectionId => {
    set(state => ({
      openPanels: state.openPanels.filter(id => id !== connectionId),
      minimized: state.minimized.filter(id => id !== connectionId),
    }))
    schedulePersist(get)
  },

  minimize: connectionId => {
    set(state => ({
      minimized: state.minimized.includes(connectionId)
        ? state.minimized
        : [...state.minimized, connectionId],
    }))
    schedulePersist(get)
  },

  restore: connectionId => {
    set(state => ({
      minimized: state.minimized.filter(id => id !== connectionId),
    }))
    schedulePersist(get)
  },

  persistDockview: layout => {
    latestDockview = layout
    schedulePersist(get)
  },
}))
