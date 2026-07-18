import { useEffect, useState } from "react"
import { Classes, FocusStyleManager } from "@blueprintjs/core"
import { Group, Panel, Separator } from "react-resizable-panels"
import { Sidebar } from "./components/sidebar/Sidebar"
import { DockArea } from "./components/dock/DockArea"
import { MinimizedStrip } from "./components/dock/MinimizedStrip"
import { initIpc } from "./ipc/wire"
import { useConnectionsStore } from "./stores/connectionsStore"
import { useLayoutStore } from "./stores/layoutStore"
import { useSettingsStore } from "./stores/settingsStore"
import { useTrendsStore } from "./stores/trendsStore"
import { TrendsPanel } from "./components/trends/TrendsPanel"

// Show focus rings for keyboard navigation only, not mouse clicks.
FocusStyleManager.onlyShowFocusOnTabs()

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        initIpc()
        await useSettingsStore.getState().load()
        await useConnectionsStore.getState().load()
        await useLayoutStore.getState().load()
        await useTrendsStore.getState().load()
        if (cancelled) return

        // Auto-connect flagged connections once everything is wired.
        const { configs, connect } = useConnectionsStore.getState()
        for (const config of configs) {
          if (config.connectOnStartup) {
            useLayoutStore.getState().openPanel(config.id)
            connect(config.id).catch(() => {})
          }
        }
        setReady(true)
      } catch (error) {
        console.error("Error during initialization:", error)
        setReady(true) // Allow the app to render even if initialization fails
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (!ready) {
    return <div className={`app-loading ${Classes.DARK}`}>…</div>
  }

  return (
    <div className={`app ${Classes.DARK}`}>
      <Group className="app-split">
        <Panel
          className="sidebar-panel"
          minSize={180}
          maxSize={340}
          defaultSize={260}
        >
          <Sidebar />
        </Panel>
        <Separator className="app-separator" />
        <Panel className="main-panel">
          <Group className="app-split" orientation="vertical">
            <Panel minSize="160px">
              <main className="main-area">
                <DockArea />
                <MinimizedStrip />
              </main>
            </Panel>
            <Separator className="app-separator app-separator-h" />
            <TrendsPanel />
          </Group>
        </Panel>
      </Group>
    </div>
  )
}
