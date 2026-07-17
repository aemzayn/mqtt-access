import { useState } from "react";
import { diffLines } from "diff";
import type { MessageRecord } from "../../ipc/types";
import { tryPrettyJson } from "../../lib/json";
import { b64ByteLength } from "../../lib/b64";
import { formatTimeMs } from "../../lib/time";

function displayText(message: MessageRecord): string {
  if (message.payloadUtf8 == null) {
    return `(binary, ${b64ByteLength(message.payloadB64)} bytes)`;
  }
  return tryPrettyJson(message.payloadUtf8) ?? message.payloadUtf8;
}

export function HistoryList({ history }: { history: MessageRecord[] }) {
  const [openSeq, setOpenSeq] = useState<number | null>(null);

  if (history.length === 0) {
    return <div className="details-empty">No history yet.</div>;
  }

  return (
    <div className="history-list">
      {history.map((message, index) => {
        const previous = history[index + 1] ?? null;
        const open = openSeq === message.seq;
        return (
          <div key={message.seq} className="history-entry">
            <div
              className="history-entry-header"
              onClick={() => setOpenSeq(open ? null : message.seq)}
            >
              <span className="history-arrow">{open ? "▾" : "▸"}</span>
              <span className="history-ts">{formatTimeMs(message.tsMs)}</span>
              <span className="history-preview">
                {(message.payloadUtf8 ?? "(binary)").slice(0, 80)}
              </span>
              <span className="history-meta">
                QoS {message.qos}
                {message.retain ? " R" : ""}
              </span>
            </div>
            {open && (
              <div className="history-entry-body">
                {previous &&
                message.payloadUtf8 != null &&
                previous.payloadUtf8 != null ? (
                  <DiffView
                    oldText={displayText(previous)}
                    newText={displayText(message)}
                  />
                ) : (
                  <pre className="payload-text">{displayText(message)}</pre>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DiffView({ oldText, newText }: { oldText: string; newText: string }) {
  if (oldText === newText) {
    return (
      <>
        <div className="diff-note">Identical to previous message.</div>
        <pre className="payload-text">{newText}</pre>
      </>
    );
  }
  const parts = diffLines(oldText, newText);
  return (
    <pre className="payload-text diff-view">
      {parts.map((part, i) => (
        <span
          key={i}
          className={
            part.added ? "diff-added" : part.removed ? "diff-removed" : undefined
          }
        >
          {part.value}
        </span>
      ))}
    </pre>
  );
}
