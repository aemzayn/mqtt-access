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
    <div className="flex gap-1.5 px-2 py-1.5 bg-[#252526] border-t border-[#3c3c3c] overflow-x-auto shrink-0">
      {minimized.map((id) => {
        const config = configs.find((c) => c.id === id);
        const status = statuses[id] ?? "disconnected";
        return (
          <button
            key={id}
            className="inline-flex items-center gap-1.5 bg-[#2d2d2d] text-[#cccccc] border border-[#3c3c3c] rounded px-2.5 py-1 cursor-pointer text-[12px] whitespace-nowrap hover:border-[#007acc] transition-colors"
            onClick={() => useLayoutStore.getState().restore(id)}
            title="Restore panel"
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[status] ?? "bg-[#969696]"}`}
            />
            {config?.name || id}
          </button>
        );
      })}
    </div>
  );
}
