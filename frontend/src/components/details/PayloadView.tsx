import { useState } from "react";
import type { MessageRecord } from "../../ipc/types";
import { tryPrettyJson } from "../../lib/json";
import { b64ByteLength } from "../../lib/b64";
import { formatTimeMs } from "../../lib/time";

export function PayloadView({ message }: { message: MessageRecord | null }) {
  const [raw, setRaw] = useState(false);

  if (!message) {
    return <div className="details-empty">No message received yet.</div>;
  }

  if (message.payloadUtf8 == null) {
    return (
      <div className="payload-view">
        <PayloadMeta message={message} />
        <div className="payload-binary">
          Binary payload, {b64ByteLength(message.payloadB64)} bytes
        </div>
      </div>
    );
  }

  const pretty = tryPrettyJson(message.payloadUtf8);
  const showPretty = pretty !== null && !raw;

  return (
    <div className="payload-view">
      <PayloadMeta message={message} />
      {pretty !== null && (
        <label className="form-check payload-toggle">
          <input
            type="checkbox"
            checked={raw}
            onChange={(e) => setRaw(e.target.checked)}
          />
          Show raw
        </label>
      )}
      <pre className="payload-text">
        {showPretty ? pretty : message.payloadUtf8}
      </pre>
    </div>
  );
}

export function PayloadMeta({ message }: { message: MessageRecord }) {
  return (
    <div className="payload-meta">
      {formatTimeMs(message.tsMs)} · QoS {message.qos}
      {message.retain ? " · retained" : ""} · {b64ByteLength(message.payloadB64)}{" "}
      B
    </div>
  );
}
