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
        className={`flex items-center h-[22px] whitespace-nowrap overflow-hidden cursor-pointer gap-[3px] ${
          selected ? "bg-[#094771]" : "hover:bg-[#2a2d2e]"
        }`}
        style={{ paddingLeft: row.depth * 14 + 4 }}
        onClick={() => onSelect(row.path)}
      >
        <span
          className={`w-[14px] text-[#969696] text-center shrink-0 ${row.hasChildren ? "" : "invisible"}`}
          onClick={(e) => {
            e.stopPropagation();
            if (row.hasChildren) onToggle(row.path);
          }}
        >
          {row.expanded ? "⌄" : "›"}
        </span>

        <span className="font-normal text-[#cccccc]">{row.segment}</span>

        {row.hasChildren && !row.expanded && (
          <Badge variant="count">{row.subtreeTopicCount}</Badge>
        )}

        {row.retain && row.hasMessage && <Badge variant="retain">R</Badge>}

        {row.hasMessage && (
          <span className="text-[#969696] overflow-hidden text-ellipsis text-[12px]">
            {" "}
            = {row.preview}
          </span>
        )}
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
