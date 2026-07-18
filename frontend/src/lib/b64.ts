export function encodeUtf8ToB64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ""
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

export function b64ByteLength(b64: string): number {
  const padding = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0
  return (b64.length * 3) / 4 - padding
}

export function isValidBase64(text: string): boolean {
  const cleaned = text.trim().replace(/\s+/g, "")
  if (cleaned === "") return true
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned) || cleaned.length % 4 !== 0) {
    return false
  }
  try {
    atob(cleaned)
    return true
  } catch {
    return false
  }
}

// Returns null if the text isn't valid hex (optionally separated by
// whitespace, colons, or dashes — common ways hex bytes get pasted in).
export function hexToB64(hex: string): string | null {
  const cleaned = hex.trim().replace(/[\s:,-]+/g, "")
  if (cleaned === "") return ""
  if (!/^[0-9a-fA-F]*$/.test(cleaned) || cleaned.length % 2 !== 0) return null
  const bytes = new Uint8Array(cleaned.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.substr(i * 2, 2), 16)
  }
  let binary = ""
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}
