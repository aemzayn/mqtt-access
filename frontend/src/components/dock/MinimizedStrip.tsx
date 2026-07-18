import { useConnectionsStore } from "../../stores/connectionsStore";
import { useLayoutStore } from "../../stores/layoutStore";

const STATUS_DOT: Record<string, string> = {
  connected: "bg-[#4ec9b0]",
  connecting: "bg-[#cca700]",
  reconnecting: "bg-[#cca700]",
  error: "bg-[#f14c4c]",
  disconnected: "bg-[#969696]",
};

export function MinimizedStrip() {
  const minimized = useLayoutStore((s) => s.minimized);
  const configs = useConnectionsStore((s) => s.configs);
  const statuses = useConnectionsStore((s) => s.statuses);

  if (minimized.length === 0) return null;

  return (
    <div>
      {minimized.map((id) => {
        const config = configs.find((c) => c.id === id);
        const status = statuses[id] ?? "disconnected";
        return (
          <button
            key={id}
            onClick={() => useLayoutStore.getState().restore(id)}
            title="Restore panel"
          >
            <span />
            {config?.name || id}
          </button>
        );
      })}
    </div>
  );
}
