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
