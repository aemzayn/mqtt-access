import { create } from "zustand";
import {
  loadSettings,
  saveSettings,
  type AppSettings,
  type FontSizeName,
  type ThemeName,
} from "../ipc/commands";

export const THEMES: { value: ThemeName; label: string }[] = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "dracula", label: "Dracula" },
  { value: "dark-contrast", label: "Dark high contrast" },
  { value: "light-contrast", label: "White high contrast" },
];

export const FONT_SIZES: { value: FontSizeName; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "normal", label: "Normal" },
  { value: "big", label: "Big" },
];

const DEFAULTS: AppSettings = { theme: "dark", fontSize: "normal", blink: true };

// Themes/font-size/blink are driven by classes on <html> so Blueprint portals
// (dialogs, tooltips) and the app root all pick up the same CSS variables.
function applyToDom(settings: AppSettings) {
  const el = document.documentElement;
  const keep = el.className
    .split(/\s+/)
    .filter(
      (c) =>
        c !== "" &&
        !c.startsWith("theme-") &&
        !c.startsWith("font-") &&
        c !== "no-flash",
    );
  keep.push(`theme-${settings.theme}`, `font-${settings.fontSize}`);
  if (!settings.blink) keep.push("no-flash");
  el.className = keep.join(" ");
}

interface SettingsState extends AppSettings {
  load: () => Promise<void>;
  update: (patch: Partial<AppSettings>) => void;
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  ...DEFAULTS,

  load: async () => {
    const stored = await loadSettings().catch(() => null);
    const settings = { ...DEFAULTS, ...stored };
    set(settings);
    applyToDom(settings);
  },

  update: (patch) => {
    set(patch);
    const { theme, fontSize, blink } = get();
    applyToDom({ theme, fontSize, blink });
    saveSettings({ theme, fontSize, blink }).catch(() => {});
  },
}));
