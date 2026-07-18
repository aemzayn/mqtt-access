import { useCallback, useRef, useState } from "react";
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
import { Button, Classes, Tooltip } from "@blueprintjs/core";

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
    <div>
      <div>
        <Tooltip content={status} className={Classes.TOOLTIP_INDICATOR}>
          <span />
        </Tooltip>
        <span>{config?.name ?? connectionId}</span>
        <span>
          {mirror.totalTopics} topics · {mirror.totalMessages} msgs ·{" "}
          {mirror.messageRate.toFixed(mirror.messageRate < 10 ? 1 : 0)} msg/s
        </span>
        <div>
          <Button onClick={clearData}>Clear</Button>
          <Button onClick={() => panelApi.maximize()}>Maximize</Button>
          <Button
            onClick={() => useLayoutStore.getState().minimize(connectionId)}
          >
            Minimize
          </Button>
        </div>
      </div>

      {/* body */}
      <div ref={bodyRef}>
        <div style={{ width: `${treeWidthPct}%` }}>
          <TopicTree connectionId={connectionId} />
        </div>
        <div onPointerDown={startDrag} />
        <div>
          <DetailsPane connectionId={connectionId} />
        </div>
      </div>
    </div>
  );
}
