import { useEffect, useState } from "react";
import { publish } from "../../ipc/commands";
import { encodeUtf8ToB64 } from "../../lib/b64";

export function PublishForm({
  connectionId,
  initialTopic,
}: {
  connectionId: string;
  initialTopic: string;
}) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState(initialTopic);
  const [payload, setPayload] = useState("");
  const [qos, setQos] = useState(0);
  const [retain, setRetain] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [topicTouched, setTopicTouched] = useState(false);

  useEffect(() => {
    if (!topicTouched && initialTopic) setTopic(initialTopic);
  }, [initialTopic, topicTouched]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setFeedback(null);
    try {
      await publish(connectionId, topic.trim(), encodeUtf8ToB64(payload), qos, retain);
      setFeedback("Published ✓");
      setTimeout(() => setFeedback(null), 2000);
    } catch (err) {
      setFeedback(String(err));
    }
  };

  return (
    <div className={`publish-form${open ? " publish-form-open" : ""}`}>
      <button
        type="button"
        className="publish-toggle"
        onClick={() => setOpen(!open)}
      >
        {open ? "▾" : "▸"} Publish
        {feedback && (
          <span className="publish-feedback"> {feedback}</span>
        )}
      </button>
      {open && (
        <form onSubmit={send} className="publish-body">
          <input
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              setTopicTouched(true);
            }}
            placeholder="topic/to/publish"
            required
          />
          <textarea
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            placeholder="Payload"
            rows={3}
          />
          <div className="publish-row">
            <select
              value={qos}
              onChange={(e) => setQos(Number(e.target.value))}
            >
              <option value={0}>QoS 0</option>
              <option value={1}>QoS 1</option>
              <option value={2}>QoS 2</option>
            </select>
            <label className="form-check">
              <input
                type="checkbox"
                checked={retain}
                onChange={(e) => setRetain(e.target.checked)}
              />
              Retain
            </label>
            <button type="submit" className="btn btn-primary">
              Publish
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
