import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";

export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        ui: ["-apple-system", "BlinkMacSystemFont", '"Segoe UI"', '"Segoe WPC"', "system-ui", "sans-serif"],
        mono: ['"Cascadia Mono"', '"Cascadia Code"', "Consolas", '"Courier New"', "monospace"],
      },
    },
  },
  plugins: [
    heroui({
      themes: {
        dark: {
          extend: "dark",
          colors: {
            background: "#1e1e1e",
            foreground: "#cccccc",
            divider: "#3c3c3c",
            focus: "#007acc",
            content1: "#252526",
            content2: "#2d2d2d",
            content3: "#3c3c3c",
            content4: "#454545",
            overlay: "#000000",
            primary: {
              50: "#e0f0ff",
              100: "#b3d6ff",
              200: "#80bcff",
              300: "#4da2ff",
              400: "#1a88ff",
              500: "#007acc",
              600: "#0062a3",
              700: "#004b7a",
              800: "#003352",
              900: "#001c29",
              DEFAULT: "#007acc",
              foreground: "#ffffff",
            },
            success: { DEFAULT: "#4ec9b0", foreground: "#000000" },
            warning: { DEFAULT: "#cca700", foreground: "#000000" },
            danger:  { DEFAULT: "#f14c4c", foreground: "#ffffff" },
            default: {
              DEFAULT: "#3c3c3c",
              foreground: "#cccccc",
            },
          },
        },
      },
    }),
  ],
} satisfies Config;
