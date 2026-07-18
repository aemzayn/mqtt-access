import { memo, useRef } from "react"
import type { FlatRow } from "../../lib/topicMirror"

export const ROW_HEIGHT = 22

interface TreeRowProps {
  row: FlatRow
  selected: boolean
  onToggle: (path: string) => void
  onSelect: (path: string) => void
}

export const TreeRow = memo(
  function TreeRow({ row, selected, onToggle, onSelect }: TreeRowProps) {
    // Blink on activity: bump a key whenever this subtree receives messages so
    // the row remounts and the flash animation restarts. Initialized to the
    // current count, so rows scrolled into view don't flash on mount.
    const seenMsgCount = useRef(row.subtreeMsgCount)
    const flashKey = useRef(0)
    if (seenMsgCount.current !== row.subtreeMsgCount) {
      seenMsgCount.current = row.subtreeMsgCount
      flashKey.current += 1
    }

    return (
      <div
        key={flashKey.current}
        className={`tree-row${selected ? " tree-row-selected" : ""}${
          flashKey.current > 0 ? " tree-row-flash" : ""
        }`}
        style={{ paddingLeft: row.depth * 14 + 4 }}
        onClick={() => onSelect(row.path)}
        onDoubleClick={() => {
          if (row.hasChildren) onToggle(row.path)
        }}
      >
        <span
          className={`tree-arrow${row.hasChildren ? "" : " tree-arrow-hidden"}`}
          onClick={e => {
            e.stopPropagation()
            if (row.hasChildren) onToggle(row.path)
          }}
        >
          {row.expanded ? "⌄" : "›"}
        </span>

        <span className="tree-segment">{row.segment}</span>

        {row.hasChildren && !row.expanded && (
          <span className="tree-badge">{row.subtreeTopicCount}</span>
        )}

        {row.retain && row.hasMessage && <span className="tree-retain">R</span>}

        {row.hasMessage && (
          <span className="tree-preview"> = {row.preview}</span>
        )}
      </div>
    )
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
    prev.row.subtreeMsgCount === next.row.subtreeMsgCount &&
    prev.row.retain === next.row.retain,
)
