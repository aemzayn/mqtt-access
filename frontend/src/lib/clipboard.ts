import { ClipboardSetText } from "../../wailsjs/runtime/runtime"

// Prefer the Wails clipboard (works without browser permissions in WebView2),
// fall back to the web API when running outside the Wails shell.
export async function copyText(text: string): Promise<boolean> {
  try {
    if (await ClipboardSetText(text)) return true
  } catch {
    // not running under Wails, or the call failed — try the web API
  }
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
