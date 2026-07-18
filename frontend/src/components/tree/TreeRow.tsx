import { memo } from "react";
import type { FlatRow } from "../../lib/topicMirror";
import { Badge } from "../ui/badge";

export const ROW_HEIGHT = 22;

interface TreeRowProps {
  row: FlatRow;
  selected: boolean;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
}

export const TreeRow = memo(
  function TreeRow({ row, selected, onToggle, onSelect }: TreeRowProps) {
    return (
      <div
        style={{ paddingLeft: row.depth * 14 + 4 }}
        onClick={() => onSelect(row.path)}
      >
        <span
          onClick={(e) => {
            e.stopPropagation();
            if (row.hasChildren) onToggle(row.path);
          }}
        >
          {row.expanded ? "⌄" : "›"}
        </span>

        <span>{row.segment}</span>

        {row.hasChildren && !row.expanded && (
          <Badge variant="count">{row.subtreeTopicCount}</Badge>
        )}

        {row.retain && row.hasMessage && <Badge variant="retain">R</Badge>}

        {row.hasMessage && <span> = {row.preview}</span>}
      </div>
    );
  },
  (prev, next) =>
    prev.selected === next.selected &&
    prev.row.path === next.row.path &&
    prev.row.depth === next.row.depth &&
    prev.row.expanded === next.row.expanded &&
    prev.row.hasChildren === next.row.hasChildren &&
    prev.row.preview === next.row.preview &&
    prev.row.msgCount === next.row.msgCount &&
    prev.row.subtreeTopicCount === next.row.subtreeTopicCount &&
    prev.row.retain === next.row.retain,
);
