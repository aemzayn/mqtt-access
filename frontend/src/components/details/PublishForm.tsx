import { useCallback, useEffect, useState } from "react"
import { Button, Checkbox, HTMLSelect, InputGroup } from "@blueprintjs/core"
import { publish } from "../../ipc/commands"
import { encodeUtf8ToB64, hexToB64, isValidBase64 } from "../../lib/b64"
import { prettyXml } from "../../lib/syntaxHighlight"
import { useT } from "../../i18n"
import { showErrorToast } from "../../lib/toaster"
import { CodeEditor, type EditorLanguage } from "../ui/CodeEditor"

type DataType = "plain" | "json" | "base64" | "hex" | "xml"

const DATA_TYPE_OPTIONS: { value: DataType; label: string }[] = [
  { value: "plain", label: "Plain" },
  { value: "json", label: "JSON" },
  { value: "base64", label: "Base64" },
  { value: "hex", label: "Hex" },
  { value: "xml", label: "XML" },
]

const DEFAULT_BODY_HEIGHT = 280
const MIN_BODY_HEIGHT = 140
const MAX_BODY_HEIGHT = 640

export function PublishForm({
  connectionId,
  initialTopic,
}: {
  connectionId: string
  initialTopic: string
}) {
  const t = useT()
  const [open, setOpen] = useState(true)
  const [topic, setTopic] = useState(initialTopic)
  const [dataType, setDataType] = useState<DataType>("plain")
  const [payload, setPayload] = useState("")
  const [qos, setQos] = useState(0)
  const [retain, setRetain] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [topicTouched, setTopicTouched] = useState(false)
  const [bodyHeight, setBodyHeight] = useState(DEFAULT_BODY_HEIGHT)

  const startResize = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      const startY = e.clientY
      const startHeight = bodyHeight
      const move = (ev: PointerEvent) => {
        const next = startHeight + (startY - ev.clientY)
        setBodyHeight(
          Math.min(MAX_BODY_HEIGHT, Math.max(MIN_BODY_HEIGHT, next)),
        )
      }
      const up = () => {
        window.removeEventListener("pointermove", move)
        window.removeEventListener("pointerup", up)
      }
      window.addEventListener("pointermove", move)
      window.addEventListener("pointerup", up)
    },
    [bodyHeight],
  )

  useEffect(() => {
    if (!topicTouched && initialTopic) setTopic(initialTopic)
  }, [initialTopic, topicTouched])

  const canPrettify = dataType === "json" || dataType === "xml"
  const prettify = () => {
    try {
      if (dataType === "json") {
        if (payload.trim() === "") return
        setPayload(JSON.stringify(JSON.parse(payload), null, 2))
      } else if (dataType === "xml") {
        setPayload(prettyXml(payload))
      }
    } catch {
      showErrorToast(t("invalidJson"))
    }
  }

  const encodePayload = (): string | null => {
    switch (dataType) {
      case "base64": {
        if (!isValidBase64(payload)) {
          showErrorToast(t("invalidBase64"))
          return null
        }
        return payload.trim().replace(/\s+/g, "")
      }
      case "hex": {
        const b64 = hexToB64(payload)
        if (b64 === null) {
          showErrorToast(t("invalidHex"))
          return null
        }
        return b64
      }
      case "json": {
        if (payload.trim() !== "") {
          try {
            JSON.parse(payload)
          } catch {
            showErrorToast(t("invalidJson"))
            return null
          }
        }
        return encodeUtf8ToB64(payload)
      }
      default:
        return encodeUtf8ToB64(payload)
    }
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim()) return
    const payloadB64 = encodePayload()
    if (payloadB64 === null) return
    setFeedback(null)
    try {
      await publish(connectionId, topic.trim(), payloadB64, qos, retain)
      setFeedback(t("published"))
      setTimeout(() => setFeedback(null), 2000)
    } catch (err) {
      setFeedback(String(err))
    }
  }

  const language: EditorLanguage =
    dataType === "json" ? "json" : dataType === "xml" ? "xml" : null

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
        <>
          <div className="publish-resize-handle" onPointerDown={startResize} />
          <form
            onSubmit={send}
            className="publish-body"
            style={{ height: bodyHeight }}
          >
            <InputGroup
              value={topic}
              onChange={e => {
                setTopic(e.target.value)
                setTopicTouched(true)
              }}
              placeholder="topic/to/publish"
              required
            />

            <div className="publish-editor-toolbar">
              <HTMLSelect
                minimal
                value={dataType}
                onChange={e => setDataType(e.target.value as DataType)}
                options={DATA_TYPE_OPTIONS}
                title={t("dataType")}
              />
              {canPrettify && (
                <Button
                  size="small"
                  variant="minimal"
                  icon="align-left"
                  title={t("prettify")}
                  aria-label={t("prettify")}
                  onClick={prettify}
                />
              )}
            </div>

            <CodeEditor
              value={payload}
              onChange={setPayload}
              language={language}
              placeholder={t("payload")}
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
        </>
      )}
    </div>
  )
}
