import { useState } from "react"
import { Checkbox } from "@blueprintjs/core"
import type { MessageRecord } from "../../ipc/types"
import { tryPrettyJson } from "../../lib/json"
import { b64ByteLength } from "../../lib/b64"
import { formatTimeMs } from "../../lib/time"
import { useT } from "../../i18n"
import { CopyButton } from "../ui/CopyButton"

export function PayloadView({ message }: { message: MessageRecord | null }) {
  const t = useT()
  const [raw, setRaw] = useState(false)

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
        <div className="payload-binary">
          {t("binaryPayload", { n: b64ByteLength(message.payloadB64) })}
        </div>
      </div>
    )
  }

  const pretty = tryPrettyJson(message.payloadUtf8)
  const showPretty = pretty !== null && !raw

  return (
    <div className="payload-view">
      <div className="payload-head">
        <PayloadMeta message={message} />
        <CopyButton
          getText={() =>
            showPretty && pretty !== null ? pretty : (message.payloadUtf8 ?? "")
          }
          title={t("copyPayload")}
        />
      </div>
      {pretty !== null && (
        <Checkbox
          className="payload-toggle"
          checked={raw}
          onChange={e => setRaw(e.target.checked)}
        >
          {t("showRaw")}
        </Checkbox>
      )}
      <pre className="payload-text">
        {showPretty ? pretty : message.payloadUtf8}
      </pre>
    </div>
  )
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
