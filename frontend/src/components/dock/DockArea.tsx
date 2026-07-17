import { useEffect, useRef, useState } from "react";
import {
  DockviewReact,
  themeVisualStudio,
  type DockviewApi,
  type DockviewReadyEvent,
  type IDockviewPanelProps,
} from "dockview-react";
import "dockview-react/dist/styles/dockview.css";
import { useLayoutStore } from "../../stores/layoutStore";
import { useConnectionsStore } from "../../stores/connectionsStore";
import { ConnectionPanel } from "./ConnectionPanel";
import { setDockApi } from "./dockApi";

function ConnectionPanelHost(
  props: IDockviewPanelProps<{ connectionId: string }>,
) {
  return (
    <ConnectionPanel
      connectionId={props.params.connectionId}
      panelApi={props.api}
    />
  );
}

const components = { connection: ConnectionPanelHost };

export function DockArea() {
  const apiRef   = useRef<DockviewApi | null>(null);
  const [apiReady, setApiReady] = useState(false);
  const openPanels = useLayoutStore((s) => s.openPanels);
  const minimized  = useLayoutStore((s) => s.minimized);
  const configs    = useConnectionsStore((s) => s.configs);

  const onReady = (event: DockviewReadyEvent) => {
    apiRef.current = event.api;
    setDockApi(event.api);

    const restored = useLayoutStore.getState().restoredLayout;
    if (restored) {
      try {
        event.api.fromJSON(restored);
      } catch {
        // stale layout — fall through
      }
    }

    event.api.onDidLayoutChange(() => {
      useLayoutStore.getState().persistDockview(event.api.toJSON());
    });
    event.api.onDidRemovePanel((panel) => {
      const layout = useLayoutStore.getState();
      if (!layout.minimized.includes(panel.id)) {
        layout.closePanel(panel.id);
      }
    });
    setApiReady(true);
  };

  useEffect(() => {
    const api = apiRef.current;
    if (!api || !apiReady) return;

    const wanted = openPanels.filter((id) => !minimized.includes(id));
    for (const id of wanted) {
      if (!api.getPanel(id)) {
        const config   = configs.find((c) => c.id === id);
        const existing = api.panels;
        const reference = existing[existing.length - 1];
        api.addPanel({
          id,
          component: "connection",
          params: { connectionId: id },
          title: config?.name || id,
          ...(reference
            ? { position: { referencePanel: reference.id, direction: "right" as const } }
            : {}),
        });
      }
    }
    for (const panel of [...api.panels]) {
      if (!wanted.includes(panel.id)) api.removePanel(panel);
    }
  }, [openPanels, minimized, configs, apiReady]);

  return (
    <div className="flex-1 relative min-h-0">
      {/* dndStrategy="pointer" avoids OS-level drag interception in WebView2 */}
      <DockviewReact
        theme={themeVisualStudio}
        components={components}
        onReady={onReady}
        dndStrategy="pointer"
      />
      {openPanels.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-[#969696] pointer-events-none">
          <p>Connect to a broker to open its topic tree here.</p>
        </div>
      )}
    </div>
  );
}
