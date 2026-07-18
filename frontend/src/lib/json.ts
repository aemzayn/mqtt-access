export function tryPrettyJson(text: string): string | null {
  const trimmed = text.trim()
  if (
    !trimmed.startsWith("{") &&
    !trimmed.startsWith("[") &&
    !trimmed.startsWith('"')
  ) {
    return null
  }
  try {
    return JSON.stringify(JSON.parse(trimmed), null, 2)
  } catch {
    return null
  }
}

export function parseNumeric(text: string | null): number | null {
  if (text == null) return null
  const value = Number(text.trim())
  return Number.isFinite(value) && text.trim() !== "" ? value : null
}

export type PayloadType = "json" | "number" | "boolean" | "string" | "binary"

// JSON only when the payload parses to an object/array — a bare quoted
// string or a numeric/boolean literal is classified by its own type below.
export function detectPayloadType(payloadUtf8: string | null): PayloadType {
  if (payloadUtf8 == null) return "binary"
  const text = payloadUtf8.trim()
  if (text === "") return "string"
  try {
    const parsed: unknown = JSON.parse(text)
    if (parsed !== null && typeof parsed === "object") return "json"
  } catch {
    // not JSON — fall through to the scalar checks below
  }
  if (parseNumeric(text) !== null) return "number"
  if (text === "true" || text === "false") return "boolean"
  return "string"
}

// A JSON path segment is either an object key ("foo") or an array index
// ("[3]"); paths chain them without a separator before "[" (e.g. "a.b[0].c").
export function getValueAtPath(root: unknown, path: string): unknown {
  if (!path) return root
  const tokens = path.match(/[^.[\]]+|\[\d+\]/g) ?? []
  let cur: unknown = root
  for (const tok of tokens) {
    if (cur == null) return undefined
    if (tok.startsWith("[")) {
      cur = (cur as unknown[])[Number(tok.slice(1, -1))]
    } else {
      cur = (cur as Record<string, unknown>)[tok]
    }
  }
  return cur
}

// path === null means "the whole payload is a bare number" (no JSON parse).
export function getNumericAtPath(
  payloadUtf8: string | null,
  path: string | null,
): number | null {
  if (payloadUtf8 == null) return null
  if (path === null) return parseNumeric(payloadUtf8)
  try {
    const parsed: unknown = JSON.parse(payloadUtf8)
    const value = getValueAtPath(parsed, path)
    return typeof value === "number" && Number.isFinite(value) ? value : null
  } catch {
    return null
  }
}

export interface JsonToken {
  text: string
  cls?: "syn-key" | "syn-string" | "syn-number" | "syn-bool" | "syn-null" | "syn-punct"
}

export interface JsonRenderLine {
  depth: number
  tokens: JsonToken[]
  // Set for every leaf (string/number/boolean/null), not just numbers, so
  // diff mode can detect "this field changed" regardless of its type.
  path: string | null
  // Only set when the leaf is actually a number — gates "add to trend".
  numeric: number | null
  // The leaf's JS value, for diff comparison against a previous message.
  leafValue?: string | number | boolean | null
}

// Walks a parsed JSON value into one render line per leaf/bracket, carrying
// the dotted/bracketed path so the UI can offer "add to trend" on individual
// numeric fields, and highlight fields that changed since the last message.
export function buildJsonLines(value: unknown): JsonRenderLine[] {
  const lines: JsonRenderLine[] = []

  const pushLeaf = (
    depth: number,
    tokens: JsonToken[],
    path: string,
    numeric: number | null,
    leafValue: string | number | boolean | null,
  ) => {
    lines.push({ depth, tokens, path, numeric, leafValue })
  }

  const pushStructural = (depth: number, tokens: JsonToken[]) => {
    lines.push({ depth, tokens, path: null, numeric: null })
  }

  const walk = (
    val: unknown,
    depth: number,
    keyToken: JsonToken | null,
    path: string,
    isLast: boolean,
  ) => {
    const prefix = keyToken ? [keyToken] : []
    const comma: JsonToken = { text: isLast ? "" : ",", cls: "syn-punct" }

    if (val === null) {
      pushLeaf(depth, [...prefix, { text: "null", cls: "syn-null" }, comma], path, null, null)
      return
    }
    if (typeof val === "boolean") {
      pushLeaf(
        depth,
        [...prefix, { text: String(val), cls: "syn-bool" }, comma],
        path,
        null,
        val,
      )
      return
    }
    if (typeof val === "number") {
      pushLeaf(
        depth,
        [...prefix, { text: String(val), cls: "syn-number" }, comma],
        path,
        Number.isFinite(val) ? val : null,
        val,
      )
      return
    }
    if (typeof val === "string") {
      pushLeaf(
        depth,
        [...prefix, { text: JSON.stringify(val), cls: "syn-string" }, comma],
        path,
        null,
        val,
      )
      return
    }
    if (Array.isArray(val)) {
      if (val.length === 0) {
        pushStructural(depth, [...prefix, { text: "[]", cls: "syn-punct" }, comma])
        return
      }
      pushStructural(depth, [...prefix, { text: "[", cls: "syn-punct" }])
      val.forEach((item, i) =>
        walk(item, depth + 1, null, `${path}[${i}]`, i === val.length - 1),
      )
      pushStructural(depth, [{ text: "]", cls: "syn-punct" }, comma])
      return
    }
    if (typeof val === "object") {
      const entries = Object.entries(val as Record<string, unknown>)
      if (entries.length === 0) {
        pushStructural(depth, [...prefix, { text: "{}", cls: "syn-punct" }, comma])
        return
      }
      pushStructural(depth, [...prefix, { text: "{", cls: "syn-punct" }])
      entries.forEach(([k, v], i) => {
        const keyTok: JsonToken = { text: `${JSON.stringify(k)}: `, cls: "syn-key" }
        const childPath = path ? `${path}.${k}` : k
        walk(v, depth + 1, keyTok, childPath, i === entries.length - 1)
      })
      pushStructural(depth, [{ text: "}", cls: "syn-punct" }, comma])
      return
    }
  }

  walk(value, 0, null, "", true)
  return lines
}
