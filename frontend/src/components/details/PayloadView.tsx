import { useState } from "react"
import { diffLines } from "diff"
import { Button, ButtonGroup } from "@blueprintjs/core"
import type { MessageRecord } from "../../ipc/types"
import { detectPayloadType, type PayloadType } from "../../lib/json"
import { b64ByteLength } from "../../lib/b64"
import { formatTimeMs } from "../../lib/time"
import { useT, type MsgKey } from "../../i18n"
import { CopyButton } from "../ui/CopyButton"
import { SyntaxText } from "../ui/SyntaxText"
import { JsonView } from "./JsonView"
import { useTrendsStore } from "../../stores/trendsStore"

type Mode = "diff" | "raw"

const TYPE_LABEL: Record<PayloadType, MsgKey> = {
  json: "dataTypeJson",
  number: "dataTypeNumber",
  boolean: "dataTypeBoolean",
  string: "dataTypeString",
  binary: "dataTypeBinary",
}

function textForMessage(message: MessageRecord): string {
  if (message.payloadUtf8 == null) return ""
  if (detectPayloadType(message.payloadUtf8) === "json") {
    try {
      const parsed: unknown = JSON.parse(message.payloadUtf8)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return message.payloadUtf8
    }
  }
  return message.payloadUtf8
}

export function PayloadView({
  message,
  previous,
  connectionId,
  topic,
}: {
  message: MessageRecord | null
  previous: MessageRecord | null
  connectionId: string
  topic: string
}) {
  const t = useT()
  const [mode, setMode] = useState<Mode>("diff")

  if (!message) {
    return <div className="details-empty">{t("noMessageYet")}</div>
  }

  if (message.payloadUtf8 == null) {
    return (
      <div className="payload-view">
        <div className="payload-head">
          <PayloadMeta message={message} />
          <CopyButton
            getText={() => message.payloadB64}
            title={t("copyPayload")}
          />
        </div>
        <TypeBadge type="binary" />
        <div className="payload-binary">
          {t("binaryPayload", { n: b64ByteLength(message.payloadB64) })}
        </div>
      </div>
    )
  }

  const type = detectPayloadType(message.payloadUtf8)
  const isJson = type === "json"
  const currentText = textForMessage(message)

  const addTrend = (path: string | null) =>
    useTrendsStore.getState().add(connectionId, topic, path)

  let parsed: unknown = null
  let previousParsed: unknown
  if (isJson) {
    try {
      parsed = JSON.parse(message.payloadUtf8)
    } catch {
      parsed = null
    }
    if (previous?.payloadUtf8 != null) {
      try {
        previousParsed = JSON.parse(previous.payloadUtf8)
      } catch {
        previousParsed = undefined
      }
    }
  }

  return (
    <div className="payload-view">
      <div className="payload-head">
        <PayloadMeta message={message} />
        <div className="payload-head-actions">
          {type === "number" && (
            <Button
              size="small"
              variant="minimal"
              icon="timeline-line-chart"
              title={t("addToTrend")}
              aria-label={t("addToTrend")}
              onClick={() => addTrend(null)}
            />
          )}
          <CopyButton getText={() => currentText} title={t("copyPayload")} />
        </div>
      </div>

      <div className="payload-controls">
        <TypeBadge type={type} />
        <ButtonGroup>
          <Button
            size="small"
            active={mode === "diff"}
            onClick={() => setMode("diff")}
          >
            {t("modeDiff")}
          </Button>
          <Button
            size="small"
            active={mode === "raw"}
            onClick={() => setMode("raw")}
          >
            {t("modeRaw")}
          </Button>
        </ButtonGroup>
      </div>

      {isJson ? (
        <JsonView
          value={parsed}
          previousValue={previousParsed}
          showDiff={mode === "diff"}
          onAddTrend={path => addTrend(path)}
        />
      ) : mode === "raw" ? (
        <pre className="payload-text">
          <SyntaxText text={currentText} />
        </pre>
      ) : (
        <TextDiffPreview previous={previous} message={message} />
      )}
    </div>
  )
}

function TextDiffPreview({
  previous,
  message,
}: {
  previous: MessageRecord | null
  message: MessageRecord
}) {
  const t = useT()
  const currentText = textForMessage(message)

  if (!previous || previous.payloadUtf8 == null) {
    return (
      <pre className="payload-text">
        <SyntaxText text={currentText} />
      </pre>
    )
  }

  const previousText = textForMessage(previous)
  if (previousText === currentText) {
    return (
      <>
        <div className="diff-note">{t("identicalPrevious")}</div>
        <pre className="payload-text">
          <SyntaxText text={currentText} />
        </pre>
      </>
    )
  }

  const parts = diffLines(previousText, currentText)
  return (
    <pre className="payload-text diff-view">
      {parts.map((part, i) => (
        <span
          key={i}
          className={
            part.added ? "diff-added" : part.removed ? "diff-removed" : undefined
          }
        >
          <SyntaxText text={part.value} />
        </span>
      ))}
    </pre>
  )
}

function TypeBadge({ type }: { type: PayloadType }) {
  const t = useT()
  return <span className={`type-badge type-badge-${type}`}>{t(TYPE_LABEL[type])}</span>
}

export function PayloadMeta({ message }: { message: MessageRecord }) {
  const t = useT()
  return (
    <div className="payload-meta">
      {formatTimeMs(message.tsMs)} · QoS {message.qos}
      {message.retain ? ` · ${t("retainedWord")}` : ""} ·{" "}
      {b64ByteLength(message.payloadB64)} B
    </div>
  )
}
