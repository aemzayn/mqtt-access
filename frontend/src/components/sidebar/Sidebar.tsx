import { useState } from "react";
import { nanoid } from "nanoid";
import { Button } from "@heroui/react";
import { useConnectionsStore } from "../../stores/connectionsStore";
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
    <aside className="w-72 min-w-50 bg-taupe-900 border-r border-taupe-800 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 shrink-0">
        <span className="text-sm font-bold uppercase flex items-center gap-1 ">
          Connections
        </span>
        <Button size="sm" onPress={startAdd} isIconOnly variant="ghost">
          <PlusIcon />
        </Button>
      </div>

      <div className="p-2 flex-1 overflow-y-auto border-taupe-800 border-t">
        {configs.length === 0 && (
          <div className="text-center mt-5">No connections found.</div>
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
    </aside>
  );
}
