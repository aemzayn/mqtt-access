import { Button } from "@blueprintjs/core"
import { BrowserOpenURL } from "../../../wailsjs/runtime/runtime"
import { useT } from "../../i18n"
import type { AppInfo } from "../../ipc/commands"

// Opens in the user's default browser, not the app's own WebView.
const openExternal = (url: string) => () => BrowserOpenURL(url)

export function AboutSection({ info }: { info: AppInfo | null }) {
  const t = useT()

  return (
    <div className="about-section">
      <div className="about-heading">{t("about")}</div>
      {info ? (
        <>
          <div className="about-app">
            {info.name} <span className="about-version">v{info.version}</span>
          </div>
          <div className="about-row">
            {t("developedBy")}{" "}
            <span
              className="about-link"
              onClick={openExternal(`mailto:${info.developerEmail}`)}
              title={info.developerEmail}
            >
              {info.developer}
            </span>
          </div>
          <div className="about-row">
            {t("license")}: {info.license}
          </div>
          <div className="about-links">
            <Button
              minimal
              small
              icon="globe-network"
              onClick={openExternal(info.website)}
            >
              {t("website")}
            </Button>
            <Button
              minimal
              small
              icon="git-branch"
              onClick={openExternal(info.github)}
            >
              GitHub
            </Button>
          </div>
        </>
      ) : (
        <div className="about-app">…</div>
      )}
    </div>
  )
}
