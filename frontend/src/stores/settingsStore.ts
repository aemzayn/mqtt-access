import { create } from "zustand"
import { loadSettings, saveSettings, type AppSettings } from "../ipc/commands"

const DEFAULTS: AppSettings = {
  theme: "dark",
  fontSize: "normal",
  blink: true,
  language: "en",
}

// Themes/font-size/blink are driven by classes on <html> so Blueprint portals
// (dialogs, tooltips) and the app root all pick up the same CSS variables.
function applyToDom(settings: AppSettings) {
  const el = document.documentElement
  const keep = el.className
    .split(/\s+/)
    .filter(
      c =>
        c !== "" &&
        !c.startsWith("theme-") &&
        !c.startsWith("font-") &&
        c !== "no-flash",
    )
  keep.push(`theme-${settings.theme}`, `font-${settings.fontSize}`)
  if (!settings.blink) keep.push("no-flash")
  el.className = keep.join(" ")
}

interface SettingsState extends AppSettings {
  load: () => Promise<void>
  update: (patch: Partial<AppSettings>) => void
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  ...DEFAULTS,

  load: async () => {
    const stored = await loadSettings().catch(() => null)
    const settings = { ...DEFAULTS, ...stored }
    set(settings)
    applyToDom(settings)
  },

  update: patch => {
    set(patch)
    const { theme, fontSize, blink, language } = get()
    applyToDom({ theme, fontSize, blink, language })
    saveSettings({ theme, fontSize, blink, language }).catch(() => {})
  },
}))
