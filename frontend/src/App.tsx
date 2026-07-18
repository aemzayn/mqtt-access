import { useEffect, useState } from "react";
import { Sidebar } from "./components/sidebar/Sidebar";
import { DockArea } from "./components/dock/DockArea";
import { MinimizedStrip } from "./components/dock/MinimizedStrip";
import { initIpc } from "./ipc/wire";
import { useConnectionsStore } from "./stores/connectionsStore";
import { useLayoutStore } from "./stores/layoutStore";
import { Group, Panel } from "react-resizable-panels";

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        initIpc();
        await useConnectionsStore.getState().load();
        await useLayoutStore.getState().load();
        if (cancelled) return;

        const { configs, connect } = useConnectionsStore.getState();
        for (const config of configs) {
          if (config.connectOnStartup) {
            useLayoutStore.getState().openPanel(config.id);
            connect(config.id).catch(() => {});
          }
        }
        setReady(true);
      } catch (error) {
        console.error("Error during initialization:", error);
        setReady(true); // Allow the app to render even if initialization fails
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return <div>Loading…</div>;
  }

  return (
    <Group>
      <Panel maxSize={300} minSize={200} defaultSize={250}>
        <Sidebar />
      </Panel>

      <Panel>
        <DockArea />
        <MinimizedStrip />
      </Panel>
    </Group>
  );
}
