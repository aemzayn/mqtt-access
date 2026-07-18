import { create } from "zustand"
import * as commands from "../ipc/commands"
import type { ConnectionConfig, ConnectionStatus } from "../ipc/types"
import { useSelectionStore } from "./selectionStore"
import { showErrorToast } from "../lib/toaster"
import { translate } from "../i18n"

const ACTIVE_STATUSES: ConnectionStatus[] = [
  "connected",
  "connecting",
  "reconnecting",
]

interface ConnectionsState {
  configs: ConnectionConfig[]
  loaded: boolean
  statuses: Record<string, ConnectionStatus>
  errors: Record<string, string | undefined>

  load: () => Promise<void>
  upsert: (config: ConnectionConfig) => Promise<void>
  remove: (id: string) => Promise<void>
  connect: (id: string) => Promise<void>
  disconnect: (id: string) => Promise<void>
  disconnectAll: () => Promise<void>
  setStatus: (id: string, status: ConnectionStatus, error?: string) => void
}

export const useConnectionsStore = create<ConnectionsState>((set, get) => ({
  configs: [],
  loaded: false,
  statuses: {},
  errors: {},

  load: async () => {
    const configs = await commands.loadConnections()
    set({ configs, loaded: true })
  },

  upsert: async config => {
    const configs = [...get().configs]
    const index = configs.findIndex(c => c.id === config.id)
    if (index >= 0) configs[index] = config
    else configs.push(config)
    set({ configs })
    await commands.saveConnections(configs)
  },

  remove: async id => {
    const status = get().statuses[id]
    if (status && status !== "disconnected") {
      await commands.disconnect(id).catch(() => {})
    }
    const configs = get().configs.filter(c => c.id !== id)
    set({ configs })
    await commands.saveConnections(configs)
  },

  connect: async id => {
    const config = get().configs.find(c => c.id === id)
    if (!config) throw new Error(`unknown connection: ${id}`)
    // The backend keeps the store across reconnects, so the mirror stays too.
    get().setStatus(id, "connecting")
    try {
      await commands.connect(config)
    } catch (e) {
      // No scary red dot for a failed attempt — back to gray, tell the user why.
      get().setStatus(id, "disconnected", String(e))
      showErrorToast(
        `${translate("connectFailed", { name: config.name || config.host })}: ${String(e)}`,
      )
      throw e
    }
    // Connecting replaces the backend handle, which loses the watched topic —
    // re-issue it so the selected topic keeps getting live messages.
    const topic = useSelectionStore.getState().selected[id]
    if (topic) {
      commands.watchTopic(id, topic).catch(() => {})
    }
  },

  disconnect: async id => {
    await commands.disconnect(id)
  },

  disconnectAll: async () => {
    const { statuses } = get()
    const active = Object.entries(statuses)
      .filter(([, status]) => ACTIVE_STATUSES.includes(status))
      .map(([id]) => id)
    await Promise.all(active.map(id => commands.disconnect(id).catch(() => {})))
  },

  setStatus: (id, status, error) =>
    set(state => ({
      statuses: { ...state.statuses, [id]: status },
      errors: { ...state.errors, [id]: error },
    })),
}))
