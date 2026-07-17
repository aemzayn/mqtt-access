import { useEffect, useState } from "react";
import { Sidebar } from "./components/sidebar/Sidebar";
import { DockArea } from "./components/dock/DockArea";
import { MinimizedStrip } from "./components/dock/MinimizedStrip";
import { initIpc } from "./ipc/wire";
import { useConnectionsStore } from "./stores/connectionsStore";
import { useLayoutStore } from "./stores/layoutStore";

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
    return (
      <div className="flex items-center justify-center h-screen bg-[#1e1e1e] text-[#969696] text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#1e1e1e] text-[#cccccc]">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <DockArea />
        <MinimizedStrip />
      </main>
    </div>
  );
}
