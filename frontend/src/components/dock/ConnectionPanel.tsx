import { useCallback, useRef, useState } from "react";
import type { DockviewPanelApi } from "dockview-react";
import { Button } from "@blueprintjs/core";
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

export function ConnectionPanel({
  connectionId,
  panelApi,
}: {
  connectionId: string;
  panelApi: DockviewPanelApi;
}) {
  useMirrorVersion(connectionId); // keeps header stats live
  const status =
    useConnectionsStore((s) => s.statuses[connectionId]) ?? "disconnected";
  const error = useConnectionsStore((s) => s.errors[connectionId]);
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
    <div className="conn-panel">
      <div className="conn-panel-header">
        <span
          className={`status-dot status-${status}`}
          title={error ?? status}
        />
        <span className="conn-panel-title">
          {config?.name ?? connectionId}
        </span>
        <span className="conn-panel-stats">
          {mirror.totalTopics} topics · {mirror.totalMessages} msgs ·{" "}
          {mirror.messageRate.toFixed(mirror.messageRate < 10 ? 1 : 0)} msg/s
        </span>
        <span className="conn-panel-actions">
          <Button size="small" onClick={clearData} title="Clear collected data">
            Clear
          </Button>
          <Button
            size="small"
            icon="maximize"
            onClick={() => panelApi.maximize()}
            aria-label="Maximize panel"
            title="Maximize panel"
          />
          <Button
            size="small"
            icon="minus"
            onClick={() => useLayoutStore.getState().minimize(connectionId)}
            aria-label="Minimize to strip"
            title="Minimize to strip"
          />
        </span>
      </div>
      <div className="conn-panel-body" ref={bodyRef}>
        <div className="conn-panel-tree" style={{ width: `${treeWidthPct}%` }}>
          <TopicTree connectionId={connectionId} />
        </div>
        <div className="conn-panel-divider" onPointerDown={startDrag} />
        <div className="conn-panel-details">
          <DetailsPane connectionId={connectionId} />
        </div>
      </div>
    </div>
  );
}
