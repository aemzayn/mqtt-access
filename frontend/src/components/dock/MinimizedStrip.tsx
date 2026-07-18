import { useConnectionsStore } from "../../stores/connectionsStore"
import { useLayoutStore } from "../../stores/layoutStore"
import { useT } from "../../i18n"

export function MinimizedStrip() {
  const minimized = useLayoutStore(s => s.minimized)
  const configs = useConnectionsStore(s => s.configs)
  const statuses = useConnectionsStore(s => s.statuses)
  const t = useT()

  if (minimized.length === 0) return null

  return (
    <div className="minimized-strip">
      {minimized.map(id => {
        const config = configs.find(c => c.id === id)
        const status = statuses[id] ?? "disconnected"
        return (
          <button
            key={id}
            className="minimized-chip"
            onClick={() => useLayoutStore.getState().restore(id)}
            title={t("restorePanel")}
          >
            <span className={`status-dot status-${status}`} />
            {config?.name || id}
          </button>
        )
      })}
    </div>
  )
}
