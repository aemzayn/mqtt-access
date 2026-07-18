import { useState } from "react";
import { nanoid } from "nanoid";
import { useConnectionsStore } from "../../stores/connectionsStore";
import { Button } from "@blueprintjs/core";
import { useLayoutStore } from "../../stores/layoutStore";
import {
  defaultConnectionConfig,
  type ConnectionConfig,
} from "../../ipc/types";
import { ConnectionRow } from "./ConnectionRow";
import { ConnectionFormDialog } from "./ConnectionFormDialog";
import { PlusIcon } from "lucide-react";

export function Sidebar() {
  const configs = useConnectionsStore((s) => s.configs);
  const [editing, setEditing] = useState<ConnectionConfig | null>(null);

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
    <aside>
      <div>
        <span>Connections</span>
        <Button size="small" onClick={startAdd} variant="minimal">
          <PlusIcon />
        </Button>
      </div>

      <div>
        {configs.length === 0 && <div>No connections found.</div>}
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
    </aside>
  );
}
