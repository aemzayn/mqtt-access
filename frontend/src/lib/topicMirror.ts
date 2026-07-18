import type { TopicUpdate } from "../ipc/types"

export interface MirrorNode {
  segment: string
  path: string
  children: Map<string, MirrorNode>
  sortedChildren: MirrorNode[] | null
  hasMessage: boolean
  preview: string
  msgCount: number
  lastTsMs: number
  retain: boolean
  numeric: number | null
  subtreeTopicCount: number
  subtreeMsgCount: number
}

export interface FlatRow {
  path: string
  segment: string
  depth: number
  hasChildren: boolean
  expanded: boolean
  hasMessage: boolean
  preview: string
  msgCount: number
  subtreeTopicCount: number
  subtreeMsgCount: number
  retain: boolean
}

function makeNode(segment: string, path: string): MirrorNode {
  return {
    segment,
    path,
    children: new Map(),
    sortedChildren: null,
    hasMessage: false,
    preview: "",
    msgCount: 0,
    lastTsMs: 0,
    retain: false,
    numeric: null,
    subtreeTopicCount: 0,
    subtreeMsgCount: 0,
  }
}

export function createRoot(): MirrorNode {
  return makeNode("", "")
}

export function applyUpdates(root: MirrorNode, updates: TopicUpdate[]): void {
  for (const update of updates) {
    const ancestors: MirrorNode[] = [root]
    let node = root
    for (const segment of update.topic.split("/")) {
      let child = node.children.get(segment)
      if (!child) {
        child = makeNode(
          segment,
          node.path === "" ? segment : `${node.path}/${segment}`,
        )
        node.children.set(segment, child)
        node.sortedChildren = null
      }
      node = child
      ancestors.push(node)
    }

    if (!node.hasMessage) {
      node.hasMessage = true
      for (const ancestor of ancestors) {
        ancestor.subtreeTopicCount += 1
      }
    }
    // Propagate the message delta so ancestor rows can signal child activity.
    const msgDelta = update.msgCount - node.msgCount
    if (msgDelta !== 0) {
      for (const ancestor of ancestors) {
        ancestor.subtreeMsgCount += msgDelta
      }
    }
    node.preview = update.preview
    node.msgCount = update.msgCount
    node.lastTsMs = update.lastTsMs
    node.retain = update.retain
    node.numeric = update.numeric
  }
}

function sortedChildrenOf(node: MirrorNode): MirrorNode[] {
  if (!node.sortedChildren) {
    node.sortedChildren = [...node.children.values()].sort((a, b) =>
      a.segment.localeCompare(b.segment),
    )
  }
  return node.sortedChildren
}

export function flattenVisible(
  root: MirrorNode,
  expanded: ReadonlySet<string>,
  filter?: string,
): FlatRow[] {
  const rows: FlatRow[] = []
  const lowerFilter = filter?.toLowerCase()

  const visit = (node: MirrorNode, depth: number) => {
    for (const child of sortedChildrenOf(node)) {
      if (lowerFilter && !subtreeMatches(child, lowerFilter)) continue
      const hasChildren = child.children.size > 0
      const isExpanded =
        hasChildren && (lowerFilter ? true : expanded.has(child.path))
      rows.push({
        path: child.path,
        segment: child.segment,
        depth,
        hasChildren,
        expanded: isExpanded,
        hasMessage: child.hasMessage,
        preview: child.preview,
        msgCount: child.msgCount,
        subtreeTopicCount: child.subtreeTopicCount,
        subtreeMsgCount: child.subtreeMsgCount,
        retain: child.retain,
      })
      if (isExpanded) visit(child, depth + 1)
    }
  }
  visit(root, 0)
  return rows
}

function subtreeMatches(node: MirrorNode, lowerFilter: string): boolean {
  if (node.path.toLowerCase().includes(lowerFilter)) return true
  for (const child of node.children.values()) {
    if (subtreeMatches(child, lowerFilter)) return true
  }
  return false
}

export function findNode(root: MirrorNode, path: string): MirrorNode | null {
  let node = root
  for (const segment of path.split("/")) {
    const child = node.children.get(segment)
    if (!child) return null
    node = child
  }
  return node
}
