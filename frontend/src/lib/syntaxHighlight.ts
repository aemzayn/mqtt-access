import type { JsonToken } from "./json"

// Loose JSON-flavored tokenizer for arbitrary text (diffed lines, compact
// JSON, or plain strings) — coloring is best-effort, not a real parser.
const TOKEN_RE =
  /("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(\btrue\b|\bfalse\b)|(\bnull\b)/g

export function tokenizeText(text: string): JsonToken[] {
  const tokens: JsonToken[] = []
  let last = 0
  for (const m of text.matchAll(TOKEN_RE)) {
    const idx = m.index ?? 0
    if (idx > last) tokens.push({ text: text.slice(last, idx) })
    if (m[1]) tokens.push({ text: m[1], cls: "syn-key" })
    else if (m[2]) tokens.push({ text: m[2], cls: "syn-string" })
    else if (m[3]) tokens.push({ text: m[3], cls: "syn-number" })
    else if (m[4]) tokens.push({ text: m[4], cls: "syn-bool" })
    else if (m[5]) tokens.push({ text: m[5], cls: "syn-null" })
    last = idx + m[0].length
  }
  if (last < text.length) tokens.push({ text: text.slice(last) })
  return tokens
}

// Loose XML tokenizer: tag brackets/names, attribute names, attribute
// values, and comments — enough to make a payload scannable, not a parser.
const XML_TOKEN_RE =
  /(<!--[\s\S]*?-->)|(<\/?[a-zA-Z_][\w:.-]*)|(\/?>)|([a-zA-Z_:][\w:.-]*)(?=\s*=)|("[^"]*"|'[^']*')/g

export function tokenizeXml(text: string): JsonToken[] {
  const tokens: JsonToken[] = []
  let last = 0
  for (const m of text.matchAll(XML_TOKEN_RE)) {
    const idx = m.index ?? 0
    if (idx > last) tokens.push({ text: text.slice(last, idx) })
    if (m[1]) tokens.push({ text: m[1], cls: "syn-null" })
    else if (m[2]) tokens.push({ text: m[2], cls: "syn-key" })
    else if (m[3]) tokens.push({ text: m[3], cls: "syn-key" })
    else if (m[4]) tokens.push({ text: m[4], cls: "syn-bool" })
    else if (m[5]) tokens.push({ text: m[5], cls: "syn-string" })
    last = idx + m[0].length
  }
  if (last < text.length) tokens.push({ text: text.slice(last) })
  return tokens
}

// Best-effort XML pretty printer (line-per-node with indentation) — not a
// real parser, just enough to make hand-typed payloads readable.
export function prettyXml(xml: string): string {
  const collapsed = xml.replace(/>\s+</g, "><").trim()
  if (collapsed === "") return xml
  const nodes = collapsed.split(/(?=<)/g).filter(n => n.length > 0)
  let pad = 0
  const lines: string[] = []
  for (const node of nodes) {
    if (/^<\/\w/.test(node)) {
      pad = Math.max(pad - 1, 0)
      lines.push("  ".repeat(pad) + node)
    } else if (
      /^<\?/.test(node) ||
      /\/>\s*$/.test(node) ||
      /^<!--/.test(node) ||
      /^<\w[^>]*>[^<]*<\/\w[^>]*>$/.test(node)
    ) {
      lines.push("  ".repeat(pad) + node)
    } else if (/^<\w/.test(node)) {
      lines.push("  ".repeat(pad) + node)
      pad++
    } else {
      lines.push("  ".repeat(pad) + node.trim())
    }
  }
  return lines.join("\n")
}
