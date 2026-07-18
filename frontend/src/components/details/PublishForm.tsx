import { useEffect, useState } from "react"
import {
  Button,
  Checkbox,
  HTMLSelect,
  InputGroup,
  TextArea,
} from "@blueprintjs/core"
import { publish } from "../../ipc/commands"
import { encodeUtf8ToB64 } from "../../lib/b64"
import { useT } from "../../i18n"

export function PublishForm({
  connectionId,
  initialTopic,
}: {
  connectionId: string
  initialTopic: string
}) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [topic, setTopic] = useState(initialTopic)
  const [payload, setPayload] = useState("")
  const [qos, setQos] = useState(0)
  const [retain, setRetain] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [topicTouched, setTopicTouched] = useState(false)

  useEffect(() => {
    if (!topicTouched && initialTopic) setTopic(initialTopic)
  }, [initialTopic, topicTouched])

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim()) return
    setFeedback(null)
    try {
      await publish(
        connectionId,
        topic.trim(),
        encodeUtf8ToB64(payload),
        qos,
        retain,
      )
      setFeedback(t("published"))
      setTimeout(() => setFeedback(null), 2000)
    } catch (err) {
      setFeedback(String(err))
    }
  }

  return (
    <div className={`publish-form${open ? " publish-form-open" : ""}`}>
      <button
        type="button"
        className="publish-toggle"
        onClick={() => setOpen(!open)}
      >
        {open ? "▾" : "▸"} {t("publish")}
        {feedback && <span className="publish-feedback"> {feedback}</span>}
      </button>
      {open && (
        <form onSubmit={send} className="publish-body">
          <InputGroup
            value={topic}
            onChange={e => {
              setTopic(e.target.value)
              setTopicTouched(true)
            }}
            placeholder="topic/to/publish"
            required
          />
          <TextArea
            value={payload}
            onChange={e => setPayload(e.target.value)}
            placeholder={t("payload")}
            rows={3}
            fill
          />
          <div className="publish-row">
            <HTMLSelect
              value={qos}
              onChange={e => setQos(Number(e.target.value))}
              options={[
                { value: 0, label: "QoS 0" },
                { value: 1, label: "QoS 1" },
                { value: 2, label: "QoS 2" },
              ]}
            />
            <Checkbox
              checked={retain}
              onChange={e => setRetain(e.target.checked)}
            >
              {t("retain")}
            </Checkbox>
            <Button type="submit" intent="primary" className="publish-submit">
              {t("publish")}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
