import { useConnectionsStore } from "../../stores/connectionsStore";
import { useLayoutStore } from "../../stores/layoutStore";
import { focusPanel } from "../dock/dockApi";
import type { ConnectionConfig } from "../../ipc/types";
import { DeleteIcon, PenIcon } from "lucide-react";
import { Button, Tooltip } from "@blueprintjs/core";

// const STATUS_DOT: Record<string, string> = {
//   connected: "bg-[#4ec9b0]",
//   connecting: "bg-[#cca700]",
//   reconnecting: "bg-[#cca700]",
//   error: "bg-[#f14c4c]",
//   disconnected: "bg-[#969696]",
// };

export function ConnectionRow({
  config,
  onEdit,
  onDelete,
}: {
  config: ConnectionConfig;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status =
    useConnectionsStore((s) => s.statuses[config.id]) ?? "disconnected";
  const error = useConnectionsStore((s) => s.errors[config.id]);
  const isActive =
    status === "connected" ||
    status === "connecting" ||
    status === "reconnecting";

  const toggle = async () => {
    const store = useConnectionsStore.getState();
    if (isActive) {
      await store.disconnect(config.id).catch(() => {});
    } else {
      useLayoutStore.getState().openPanel(config.id);
      await store.connect(config.id).catch(() => {});
    }
  };

  const showPanel = () => {
    if (!focusPanel(config.id)) {
      useLayoutStore.getState().openPanel(config.id);
    }
  };

  const confirmDelete = () => {
    if (window.confirm(`Delete connection "${config.name || config.host}"?`)) {
      onDelete();
    }
  };

  return (
    <div>
      <Tooltip content={error ?? status}>
        <span />
      </Tooltip>

      <div
        onClick={showPanel}
        onDoubleClick={onEdit}
        title="Click to show panel · double-click to edit"
      >
        <div>{config.name || config.host}</div>
        <div>
          {config.protocol}://{config.host}:{config.port}
          {error ? ` — ${error}` : ""}
        </div>
      </div>

      <div>
        <Button onClick={toggle}>{isActive ? "Disconnect" : "Connect"}</Button>
        <Button onClick={onEdit} aria-label="Edit">
          <PenIcon /> Edit
        </Button>
        <Button onClick={confirmDelete} aria-label="Delete">
          <DeleteIcon /> Delete
        </Button>
      </div>
    </div>
  );
}
