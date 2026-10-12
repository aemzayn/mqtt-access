export interface SearchTextSegment {
  text: string
  matched: boolean
}

export interface SearchRange {
  start: number
  end: number
}

export function findSearchRanges(text: string, query: string): SearchRange[] {
  if (!query) return []

  const ranges: SearchRange[] = []
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const matches = text.matchAll(new RegExp(escapedQuery, "giu"))

  for (const match of matches) {
    ranges.push({ start: match.index, end: match.index + match[0].length })
  }
  return ranges
}

export function splitSearchTextAt(
  text: string,
  ranges: SearchRange[],
  offset = 0,
): SearchTextSegment[] {
  const segments: SearchTextSegment[] = []
  let cursor = 0

  for (const range of ranges) {
    const start = Math.max(range.start - offset, 0)
    const end = Math.min(range.end - offset, text.length)
    if (start >= text.length || end <= cursor) continue
    if (start > cursor) {
      segments.push({ text: text.slice(cursor, start), matched: false })
    }
    segments.push({
      text: text.slice(Math.max(start, cursor), end),
      matched: true,
    })
    cursor = end
  }

  if (cursor < text.length)
    segments.push({ text: text.slice(cursor), matched: false })
  return segments.length ? segments : [{ text, matched: false }]
}

export function splitSearchText(
  text: string,
  query: string,
): SearchTextSegment[] {
  return splitSearchTextAt(text, findSearchRanges(text, query))
}

export function countSearchMatches(text: string, query: string): number {
  return findSearchRanges(text, query).length
}
