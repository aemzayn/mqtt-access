import { useCallback, useRef, useState } from "react";
import { Button, Tooltip } from "@heroui/react";
import type { DockviewPanelApi } from "dockview-react";
import { useConnectionsStore } from "../../stores/connectionsStore";
import { useLayoutStore } from "../../stores/layoutStore";
import {
  getMirror,
  resetMirror,
  useMirrorVersion,
} from "../../stores/treeMirror";
import { clearConnectionData } from "../../ipc/commands";
import { TopicTree } from "../tree/TopicTree";
import { DetailsPane } from "../details/DetailsPane";

type ConnectionStatus =
  "connected" | "connecting" | "reconnecting" | "error" | "disconnected";

const STATUS_DOT: Record<ConnectionStatus, string> = {
  connected: "bg-[#4ec9b0]",
  connecting: "bg-[#cca700]",
  reconnecting: "bg-[#cca700]",
  error: "bg-[#f14c4c]",
  disconnected: "bg-[#969696]",
};

export function ConnectionPanel({
  connectionId,
  panelApi,
}: {
  connectionId: string;
  panelApi: DockviewPanelApi;
}) {
  useMirrorVersion(connectionId);
  const status =
    useConnectionsStore((s) => s.statuses[connectionId]) ?? "disconnected";
  const config = useConnectionsStore((s) =>
    s.configs.find((c) => c.id === connectionId),
  );
  const mirror = getMirror(connectionId);

  const [treeWidthPct, setTreeWidthPct] = useState(55);
  const bodyRef = useRef<HTMLDivElement>(null);

  const startDrag = useCallback((e: React.PointerEvent) => {
    const body = bodyRef.current;
    if (!body) return;
    e.preventDefault();
    const rect = body.getBoundingClientRect();
    const move = (ev: PointerEvent) => {
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setTreeWidthPct(Math.min(85, Math.max(15, pct)));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }, []);

  const clearData = async () => {
    await clearConnectionData(connectionId).catch(() => {});
    resetMirror(connectionId);
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      {/* header */}
      <div className="flex items-center gap-2 px-2.5 py-1 border-b border-[#3c3c3c] bg-[#1e1e1e] shrink-0">
        <Tooltip>
          <Tooltip.Content>{status}</Tooltip.Content>
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 cursor-default ${STATUS_DOT[status] ?? "bg-[#969696]"}`}
          />
        </Tooltip>
        <span className="font-semibold text-[12px] text-[#cccccc]">
          {config?.name ?? connectionId}
        </span>
        <span className="text-[#969696] text-[11px] flex-1 text-right mr-1.5 whitespace-nowrap overflow-hidden">
          {mirror.totalTopics} topics · {mirror.totalMessages} msgs ·{" "}
          {mirror.messageRate.toFixed(mirror.messageRate < 10 ? 1 : 0)} msg/s
        </span>
        <div className="flex gap-1 shrink-0">
          <Button
            size="sm"
            variant="tertiary"
            onPress={clearData}
            // title="Clear collected data"
            className="h-6 px-2 text-[11px] min-w-0 bg-[#2d2d2d] text-[#cccccc]"
          >
            Clear
          </Button>
          <Button
            size="sm"
            variant="outline"
            isIconOnly
            onPress={() => panelApi.maximize()}
            // title="Maximize"
            className="h-6 w-6 min-w-0 bg-[#2d2d2d] text-[#cccccc]"
          >
            Maximize
          </Button>
          <Button
            size="sm"
            variant="outline"
            isIconOnly
            onPress={() => useLayoutStore.getState().minimize(connectionId)}
            // title="Minimize to strip"
            className="h-6 w-6 min-w-0 bg-[#2d2d2d] text-[#cccccc]"
          >
            Minimize
          </Button>
        </div>
      </div>

      {/* body */}
      <div className="flex flex-1 min-h-0" ref={bodyRef}>
        <div
          className="flex flex-col min-w-0"
          style={{ width: `${treeWidthPct}%` }}
        >
          <TopicTree connectionId={connectionId} />
        </div>
        <div
          className="w-1 cursor-col-resize bg-[#3c3c3c] hover:bg-[#007acc] shrink-0 transition-colors"
          onPointerDown={startDrag}
        />
        <div className="flex flex-col flex-1 min-w-0">
          <DetailsPane connectionId={connectionId} />
        </div>
      </div>
    </div>
  );
}
