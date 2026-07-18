import { useEffect, useRef, useState } from "react"
import { Button, HTMLSelect } from "@blueprintjs/core"
import type { TrendDef, TrendWidth } from "../../ipc/commands"
import { getTopicHistory, saveTextFile } from "../../ipc/commands"
import { useConnectionsStore } from "../../stores/connectionsStore"
import { useTrendsStore } from "../../stores/trendsStore"
import { subscribeMessages } from "../../stores/messageBus"
import { getNumericAtPath } from "../../lib/json"
import { useT } from "../../i18n"
import { ValueChart, type ChartPoint } from "../details/ValueChart"

const BACKFILL = 300
const MAX_POINTS = 10_000
const DEFAULT_COLOR = "#4fc3f7"

const WIDTH_VALUES: TrendWidth[] = ["33", "50", "100", "auto"]

function sanitizeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, "_")
}

export function TrendCard({ trend }: { trend: TrendDef }) {
  const t = useT()
  const config = useConnectionsStore(s =>
    s.configs.find(c => c.id === trend.connectionId),
  )
  const paused = useTrendsStore(s => !!s.paused[trend.id])
  const pausedRef = useRef(paused)
  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  const [points, setPoints] = useState<ChartPoint[]>([])

  useEffect(() => {
    let cancelled = false
    setPoints([])
    getTopicHistory(trend.connectionId, trend.topic, BACKFILL)
      .then(records => {
        if (cancelled) return
        const seeded = [...records]
          .reverse()
          .map(m => ({
            ts: m.tsMs,
            value: getNumericAtPath(m.payloadUtf8, trend.path),
          }))
          .filter((p): p is ChartPoint => p.value !== null)
        setPoints(seeded)
      })
      .catch(() => {
        // Not connected (yet), or topic has no data — chart starts empty.
      })

    const unsubscribe = subscribeMessages(trend.connectionId, event => {
      if (event.topic !== trend.topic || pausedRef.current) return
      const value = getNumericAtPath(event.message.payloadUtf8, trend.path)
      if (value === null) return
      setPoints(prev =>
        [...prev, { ts: event.message.tsMs, value }].slice(-MAX_POINTS),
      )
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [trend.connectionId, trend.topic, trend.path])

  const label = config?.name || trend.connectionId

  const download = async () => {
    const rows = points
      .map(p => `${new Date(p.ts).toISOString()},${p.value}`)
      .join("\n")
    const csv = `timestamp,value\n${rows}${rows ? "\n" : ""}`
    const safeName = sanitizeFilename(
      trend.path ? `${trend.topic}_${trend.path}` : trend.topic,
    )
    await saveTextFile(`${safeName}.csv`, csv).catch(() => {})
  }

  return (
    <div className="trend-card">
      <div className="trend-card-header">
        <div className="trend-card-label" title={`${label} · ${trend.topic}`}>
          <span className="trend-card-topic">{trend.topic}</span>
          {trend.path !== null && (
            <span className="trend-card-path"> · {trend.path}</span>
          )}
          <span className="trend-card-conn"> ({label})</span>
        </div>
        <div className="trend-card-actions">
          <input
            type="color"
            className="trend-color-input"
            value={trend.color ?? DEFAULT_COLOR}
            title={t("trendColor")}
            aria-label={t("trendColor")}
            onChange={e =>
              useTrendsStore.getState().setColor(trend.id, e.target.value)
            }
          />
          <HTMLSelect
            className="trend-width-select"
            minimal
            value={trend.width}
            onChange={e =>
              useTrendsStore
                .getState()
                .setWidth(trend.id, e.target.value as TrendWidth)
            }
            options={WIDTH_VALUES.map(w => ({
              value: w,
              label: t(
                w === "33"
                  ? "trendWidth33"
                  : w === "50"
                    ? "trendWidth50"
                    : w === "100"
                      ? "trendWidth100"
                      : "trendWidthAuto",
              ),
            }))}
          />
          <Button
            size="small"
            variant="minimal"
            icon="eraser"
            title={t("clearTrendData")}
            aria-label={t("clearTrendData")}
            onClick={() => setPoints([])}
          />
          <Button
            size="small"
            variant="minimal"
            icon="download"
            title={t("downloadCsv")}
            aria-label={t("downloadCsv")}
            onClick={download}
          />
          <Button
            size="small"
            variant="minimal"
            icon={paused ? "play" : "pause"}
            title={paused ? t("resumeChart") : t("pauseChart")}
            aria-label={paused ? t("resumeChart") : t("pauseChart")}
            onClick={() => useTrendsStore.getState().togglePause(trend.id)}
          />
          <Button
            size="small"
            variant="minimal"
            icon="cross"
            title={t("removeTrend")}
            aria-label={t("removeTrend")}
            onClick={() => useTrendsStore.getState().remove(trend.id)}
          />
        </div>
      </div>
      <div className="trend-card-chart">
        <ValueChart points={points} color={trend.color ?? undefined} />
      </div>
    </div>
  )
}
