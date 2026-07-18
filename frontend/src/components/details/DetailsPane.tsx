import { useEffect, useState } from "react"
import { useSelectionStore } from "../../stores/selectionStore"
import { useConnectionsStore } from "../../stores/connectionsStore"
import { subscribeMessages } from "../../stores/messageBus"
import { getTopicDetails, getTopicHistory } from "../../ipc/commands"
import type { MessageRecord } from "../../ipc/types"
import { PayloadView } from "./PayloadView"
import { HistoryList } from "./HistoryList"
import { PublishForm } from "./PublishForm"
import { useT } from "../../i18n"
import { CopyButton } from "../ui/CopyButton"

const HISTORY_FETCH = 200
const HISTORY_CAP = 1000

type Tab = "value" | "history"

export function DetailsPane({ connectionId }: { connectionId: string }) {
  const t = useT()
  const topic = useSelectionStore(s => s.selected[connectionId] ?? null)
  return (
    <div className="details-pane">
      {topic ? (
        <TopicDetailsView
          key={`${connectionId}:${topic}`}
          connectionId={connectionId}
          topic={topic}
        />
      ) : (
        <div className="details-empty">{t("selectTopic")}</div>
      )}
      <PublishForm connectionId={connectionId} initialTopic={topic ?? ""} />
    </div>
  )
}

function TopicDetailsView({
  connectionId,
  topic,
}: {
  connectionId: string
  topic: string
}) {
  const t = useT()
  const [tab, setTab] = useState<Tab>("value")
  const [history, setHistory] = useState<MessageRecord[]>([])
  const [msgCount, setMsgCount] = useState(0)
  // Reconnecting replaces the backend store, so refetch when we come back up.
  const connected =
    useConnectionsStore(s => s.statuses[connectionId]) === "connected"

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [details, records] = await Promise.all([
          getTopicDetails(connectionId, topic),
          getTopicHistory(connectionId, topic, HISTORY_FETCH),
        ])
        if (cancelled) return
        setHistory(records)
        setMsgCount(details.msgCount)
      } catch {
        // Topic does not exist (yet) in the current session's store.
        if (cancelled) return
        setHistory([])
        setMsgCount(0)
      }
    })()

    const unsubscribe = subscribeMessages(connectionId, event => {
      if (event.topic !== topic) return
      setHistory(prev => {
        const head = prev[0]
        if (head && head.seq === event.message.seq) return prev // duplicate of fetch
        // Seq went backwards: the store was cleared or the connection was
        // re-established with a fresh store — start over instead of freezing.
        if (head && event.message.seq < head.seq) return [event.message]
        return [event.message, ...prev].slice(0, HISTORY_CAP)
      })
      setMsgCount(count => count + 1)
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [connectionId, topic, connected])

  const latest = history[0] ?? null
  const previous = history[1] ?? null

  return (
    <div className="details-view">
      <div className="details-topic" title={topic}>
        <span className="details-topic-text">
          {topic}
          <span className="details-count">
            {t("msgsSuffix", { n: msgCount })}
          </span>
        </span>
        <CopyButton getText={() => topic} title={t("copyTopic")} />
      </div>
      <div className="details-tabs">
        {(["value", "history"] as const).map(tabId => (
          <button
            key={tabId}
            className={`details-tab${tab === tabId ? " details-tab-active" : ""}`}
            onClick={() => setTab(tabId)}
          >
            {tabId === "value" ? t("tabValue") : t("tabHistory", { n: history.length })}
          </button>
        ))}
      </div>
      <div className="details-content">
        {tab === "value" && (
          <PayloadView
            message={latest}
            previous={previous}
            connectionId={connectionId}
            topic={topic}
          />
        )}
        {tab === "history" && <HistoryList history={history} />}
      </div>
    </div>
  )
}
