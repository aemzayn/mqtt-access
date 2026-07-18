import { Button } from "@blueprintjs/core"
import { useConnectionsStore } from "../../stores/connectionsStore"
import { useLayoutStore } from "../../stores/layoutStore"
import { focusPanel } from "../dock/dockApi"
import { useT } from "../../i18n"
import type { ConnectionConfig } from "../../ipc/types"

export function ConnectionRow({
  config,
  onEdit,
  onDelete,
}: {
  config: ConnectionConfig
  onEdit: () => void
  onDelete: () => void
}) {
  const t = useT()
  const status =
    useConnectionsStore(s => s.statuses[config.id]) ?? "disconnected"
  const error = useConnectionsStore(s => s.errors[config.id])
  const isActive =
    status === "connected" ||
    status === "connecting" ||
    status === "reconnecting"

  const toggle = async () => {
    const store = useConnectionsStore.getState()
    if (isActive) {
      await store.disconnect(config.id).catch(() => {})
    } else {
      useLayoutStore.getState().openPanel(config.id)
      await store.connect(config.id).catch(() => {})
    }
  }

  // Re-open (or focus) this connection's panel. Fixes the case where the panel
  // was closed via its tab X — without this there's no way back short of a
  // reconnect. Focus if already open; otherwise add it back to the dock.
  const showPanel = () => {
    if (!focusPanel(config.id)) {
      useLayoutStore.getState().openPanel(config.id)
    }
  }

  const confirmDelete = () => {
    if (
      window.confirm(t("deleteConfirm", { name: config.name || config.host }))
    ) {
      onDelete()
    }
  }

  return (
    <div className={`conn-row conn-row-${status}`} title={error ?? undefined}>
      <span className={`status-dot status-${status}`} title={error ?? status} />
      <div
        className="conn-row-main"
        onClick={showPanel}
        onDoubleClick={onEdit}
        title={t("rowHint")}
      >
        <div className="conn-row-name">{config.name || config.host}</div>
        <div className="conn-row-sub">
          {config.protocol}://{config.host}:{config.port}
          {error ? ` — ${error}` : ""}
        </div>
      </div>
      <div className="conn-row-actions">
        <Button size="small" onClick={toggle}>
          {isActive ? t("disconnect") : t("connect")}
        </Button>
        <Button
          size="small"
          icon="edit"
          onClick={onEdit}
          aria-label="Edit"
          title={t("edit")}
        />
        <Button
          size="small"
          icon="trash"
          onClick={confirmDelete}
          aria-label="Delete"
          title={t("delete")}
        />
      </div>
    </div>
  )
}
