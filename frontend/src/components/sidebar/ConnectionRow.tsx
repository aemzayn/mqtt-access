import { Button, Tooltip } from "@heroui/react";
import { useConnectionsStore } from "../../stores/connectionsStore";
import { useLayoutStore } from "../../stores/layoutStore";
import { focusPanel } from "../dock/dockApi";
import type { ConnectionConfig } from "../../ipc/types";
import { DeleteIcon, PenIcon } from "lucide-react";

const STATUS_DOT: Record<string, string> = {
  connected: "bg-[#4ec9b0]",
  connecting: "bg-[#cca700]",
  reconnecting: "bg-[#cca700]",
  error: "bg-[#f14c4c]",
  disconnected: "bg-[#969696]",
};

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
    <div className="flex items-center gap-2 px-2.5 py-2 border-b border-[#3c3c3c] hover:bg-[#2a2d2e]">
      <Tooltip>
        <span
          className={`w-2.5 h-2.5 rounded-full shrink-0 cursor-default ${STATUS_DOT[status] ?? "bg-[#969696]"}`}
        />

        <Tooltip.Content className="text-[11px]">
          {error ?? status}
        </Tooltip.Content>
      </Tooltip>

      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={showPanel}
        onDoubleClick={onEdit}
        title="Click to show panel · double-click to edit"
      >
        <div className="font-semibold text-[13px] whitespace-nowrap overflow-hidden text-ellipsis text-[#cccccc]">
          {config.name || config.host}
        </div>
        <div className="text-[11px] text-[#969696] whitespace-nowrap overflow-hidden text-ellipsis">
          {config.protocol}://{config.host}:{config.port}
          {error ? ` — ${error}` : ""}
        </div>
      </div>

      <div className="flex gap-1 shrink-0">
        <Button
          size="sm"
          variant="outline"
          onPress={toggle}
          className="text-[11px] h-6 px-2 min-w-0 bg-[#2d2d2d] text-[#cccccc]"
        >
          {isActive ? "Disconnect" : "Connect"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          isIconOnly
          onPress={onEdit}
          className="h-6 w-6 min-w-0 bg-[#2d2d2d] text-[#cccccc]"
          aria-label="Edit"
        >
          <PenIcon /> Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          isIconOnly
          onPress={confirmDelete}
          className="h-6 w-6 min-w-0 bg-[#2d2d2d] text-[#cccccc] hover:text-[#f14c4c]"
          aria-label="Delete"
        >
          <DeleteIcon /> Delete
        </Button>
      </div>
    </div>
  );
}
