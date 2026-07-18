import { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { flattenVisible } from "../../lib/topicMirror";
import { getMirror, useMirrorVersion } from "../../stores/treeMirror";
import { useSelectionStore } from "../../stores/selectionStore";
import { getTreeSnapshot } from "../../ipc/commands";
import { TreeRow, ROW_HEIGHT } from "./TreeRow";
import { InputGroup } from "@blueprintjs/core";
import { useT } from "../../i18n";

export function TopicTree({ connectionId }: { connectionId: string }) {
  const version = useMirrorVersion(connectionId);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );
  const [filter, setFilter] = useState("");
  const selected = useSelectionStore((s) => s.selected[connectionId] ?? null);
  const parentRef = useRef<HTMLDivElement>(null);
  const t = useT();

  useEffect(() => {
    getTreeSnapshot(connectionId)
      .then((updates) => getMirror(connectionId).applySnapshot(updates))
      .catch(() => {});
  }, [connectionId]);

  const rows = useMemo(
    () =>
      flattenVisible(
        getMirror(connectionId).root,
        expanded,
        filter.trim() || undefined,
      ),
    [connectionId, expanded, filter, version],
  );

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
  });

  const toggle = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const select = (path: string) => {
    useSelectionStore.getState().select(connectionId, path);
  };

  return (
    <div className="topic-tree">
      <InputGroup
        size="small"
        className="tree-filter"
        leftIcon="filter"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder={t("filterTopics")}
      />

      <div className="tree-scroll" ref={parentRef}>
        {rows.length === 0 && (
          <div className="tree-empty">
            {filter ? t("noTopicsMatch") : t("waitingMessages")}
          </div>
        )}
        <div
          style={{ height: virtualizer.getTotalSize(), position: "relative" }}
        >
          {virtualizer.getVirtualItems().map((item) => {
            const row = rows[item.index];
            return (
              <div
                key={row.path}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: item.size,
                  transform: `translateY(${item.start}px)`,
                }}
              >
                <TreeRow
                  row={row}
                  selected={row.path === selected}
                  onToggle={toggle}
                  onSelect={select}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
