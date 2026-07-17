import { useEffect, useState } from "react";
import { useSelectionStore } from "../../stores/selectionStore";
import { subscribeMessages } from "../../stores/messageBus";
import { getTopicDetails, getTopicHistory } from "../../ipc/commands";
import type { MessageRecord } from "../../ipc/types";
import { PayloadView } from "./PayloadView";
import { HistoryList } from "./HistoryList";
import { ValueChart } from "./ValueChart";
import { PublishForm } from "./PublishForm";
import { parseNumeric } from "../../lib/json";

const HISTORY_FETCH = 200;
const HISTORY_CAP = 1000;

type Tab = "value" | "history" | "chart";

export function DetailsPane({ connectionId }: { connectionId: string }) {
  const topic = useSelectionStore(
    (s) => s.selected[connectionId] ?? null,
  );
  return (
    <div className="details-pane">
      {topic ? (
        <TopicDetailsView
          key={`${connectionId}:${topic}`}
          connectionId={connectionId}
          topic={topic}
        />
      ) : (
        <div className="details-empty">Select a topic to inspect it.</div>
      )}
      <PublishForm connectionId={connectionId} initialTopic={topic ?? ""} />
    </div>
  );
}

function TopicDetailsView({
  connectionId,
  topic,
}: {
  connectionId: string;
  topic: string;
}) {
  const [tab, setTab] = useState<Tab>("value");
  const [history, setHistory] = useState<MessageRecord[]>([]);
  const [msgCount, setMsgCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [details, records] = await Promise.all([
          getTopicDetails(connectionId, topic),
          getTopicHistory(connectionId, topic, HISTORY_FETCH),
        ]);
        if (cancelled) return;
        setHistory(records);
        setMsgCount(details.msgCount);
      } catch {
        // topic may not exist yet
      }
    })();

    const unsubscribe = subscribeMessages(connectionId, (event) => {
      if (event.topic !== topic) return;
      setHistory((prev) => {
        if (prev.length > 0 && prev[0].seq >= event.message.seq) return prev;
        return [event.message, ...prev].slice(0, HISTORY_CAP);
      });
      setMsgCount((count) => count + 1);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [connectionId, topic]);

  const latest = history[0] ?? null;
  const chartPoints = [...history]
    .reverse()
    .map((m) => ({ ts: m.tsMs, value: parseNumeric(m.payloadUtf8) }))
    .filter((p): p is { ts: number; value: number } => p.value !== null);

  return (
    <div className="details-view">
      <div className="details-topic" title={topic}>
        {topic}
        <span className="details-count">{msgCount} msgs</span>
      </div>
      <div className="details-tabs">
        {(["value", "history", "chart"] as const).map((t) => (
          <button
            key={t}
            className={`details-tab${tab === t ? " details-tab-active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "value"
              ? "Value"
              : t === "history"
                ? `History (${history.length})`
                : "Chart"}
          </button>
        ))}
      </div>
      <div className="details-content">
        {tab === "value" && <PayloadView message={latest} />}
        {tab === "history" && <HistoryList history={history} />}
        {tab === "chart" && <ValueChart points={chartPoints} />}
      </div>
    </div>
  );
}
