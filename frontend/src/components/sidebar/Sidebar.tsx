import { useState } from "react";
import { nanoid } from "nanoid";
import { Button } from "@blueprintjs/core";
import { useConnectionsStore } from "../../stores/connectionsStore";
import { useLayoutStore } from "../../stores/layoutStore";
import {
  defaultConnectionConfig,
  type ConnectionConfig,
} from "../../ipc/types";
import { ConnectionRow } from "./ConnectionRow";
import { ConnectionFormDialog } from "./ConnectionFormDialog";
import { SettingsDialog } from "../settings/SettingsDialog";

export function Sidebar() {
  const configs = useConnectionsStore((s) => s.configs);
  const hasActive = useConnectionsStore((s) =>
    Object.values(s.statuses).some(
      (status) => status !== "disconnected" && status !== "error",
    ),
  );
  const [editing, setEditing] = useState<ConnectionConfig | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const startAdd = () => setEditing(defaultConnectionConfig(nanoid(10)));

  const save = async (config: ConnectionConfig) => {
    await useConnectionsStore.getState().upsert(config);
    setEditing(null);
  };

  const remove = async (id: string) => {
    useLayoutStore.getState().closePanel(id);
    await useConnectionsStore.getState().remove(id);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Connections</span>
        <span className="sidebar-header-actions">
          <Button
            size="small"
            variant="minimal"
            icon="plus"
            onClick={startAdd}
            aria-label="Add connection"
            title="Add connection"
          />
          <Button
            size="small"
            variant="minimal"
            icon="power"
            disabled={!hasActive}
            onClick={() => useConnectionsStore.getState().disconnectAll()}
            aria-label="Disconnect all"
            title="Disconnect all"
          />
          <Button
            size="small"
            variant="minimal"
            icon="cog"
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
            title="Settings"
          />
        </span>
      </div>

      <div className="sidebar-list">
        {configs.length === 0 && (
          <div className="sidebar-empty">
            No connections yet.
            <br />
            Add one with the + button.
          </div>
        )}
        {configs.map((config) => (
          <ConnectionRow
            key={config.id}
            config={config}
            onEdit={() => setEditing(config)}
            onDelete={() => remove(config.id)}
          />
        ))}
      </div>

      {editing && (
        <ConnectionFormDialog
          initial={editing}
          isNew={!configs.some((c) => c.id === editing.id)}
          onSave={save}
          onCancel={() => setEditing(null)}
        />
      )}

      {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}
    </aside>
  );
}
