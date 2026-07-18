import { create } from "zustand"
import { nanoid } from "nanoid"
import * as commands from "../ipc/commands"
import type { TrendDef, TrendWidth } from "../ipc/commands"

interface TrendsState {
  trends: TrendDef[]
  loaded: boolean
  paused: Record<string, boolean>

  load: () => Promise<void>
  add: (connectionId: string, topic: string, path: string | null) => void
  remove: (id: string) => void
  setWidth: (id: string, width: TrendWidth) => void
  setColor: (id: string, color: string | null) => void
  reorder: (draggedId: string, overId: string) => void
  togglePause: (id: string) => void
  // Re-issues trend watches for a connection — its backend handle (and thus
  // watch state) is replaced on every (re)connect.
  rewatch: (connectionId: string) => void
}

let persistTimer: ReturnType<typeof setTimeout> | null = null
function schedulePersist(trends: TrendDef[]) {
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    commands.saveTrends(trends).catch(() => {})
  }, 500)
}

export const useTrendsStore = create<TrendsState>((set, get) => ({
  trends: [],
  loaded: false,
  paused: {},

  load: async () => {
    const trends = await commands.loadTrends().catch(() => [])
    set({ trends, loaded: true })
  },

  add: (connectionId, topic, path) => {
    const exists = get().trends.some(
      tr =>
        tr.connectionId === connectionId &&
        tr.topic === topic &&
        tr.path === path,
    )
    if (exists) return
    const trend: TrendDef = {
      id: nanoid(10),
      connectionId,
      topic,
      path,
      width: "33",
      color: null,
    }
    const trends = [...get().trends, trend]
    set({ trends })
    schedulePersist(trends)
    commands.watchTrendTopic(connectionId, topic).catch(() => {})
  },

  remove: id => {
    const removed = get().trends.find(tr => tr.id === id)
    const trends = get().trends.filter(tr => tr.id !== id)
    set(state => {
      const paused = { ...state.paused }
      delete paused[id]
      return { trends, paused }
    })
    schedulePersist(trends)
    if (
      removed &&
      !trends.some(
        tr => tr.connectionId === removed.connectionId && tr.topic === removed.topic,
      )
    ) {
      commands.unwatchTrendTopic(removed.connectionId, removed.topic).catch(() => {})
    }
  },

  setWidth: (id, width) => {
    const trends = get().trends.map(tr => (tr.id === id ? { ...tr, width } : tr))
    set({ trends })
    schedulePersist(trends)
  },

  setColor: (id, color) => {
    const trends = get().trends.map(tr => (tr.id === id ? { ...tr, color } : tr))
    set({ trends })
    schedulePersist(trends)
  },

  reorder: (draggedId, overId) => {
    if (draggedId === overId) return
    const trends = [...get().trends]
    const from = trends.findIndex(tr => tr.id === draggedId)
    const to = trends.findIndex(tr => tr.id === overId)
    if (from < 0 || to < 0) return
    const [moved] = trends.splice(from, 1)
    trends.splice(to, 0, moved)
    set({ trends })
    schedulePersist(trends)
  },

  togglePause: id =>
    set(state => ({
      paused: { ...state.paused, [id]: !state.paused[id] },
    })),

  rewatch: connectionId => {
    for (const tr of get().trends) {
      if (tr.connectionId === connectionId) {
        commands.watchTrendTopic(connectionId, tr.topic).catch(() => {})
      }
    }
  },
}))
