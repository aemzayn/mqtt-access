import { useEffect, useRef, useState } from "react"
import { Panel, usePanelRef } from "react-resizable-panels"
import { useTrendsStore } from "../../stores/trendsStore"
import { useT } from "../../i18n"
import { TrendCard } from "./TrendCard"
import { Icon } from "@blueprintjs/core"

const COLLAPSED_PX = 36

export function TrendsPanel() {
  const t = useT()
  const trends = useTrendsStore(s => s.trends)
  const panelRef = usePanelRef()
  const [collapsed, setCollapsed] = useState(trends.length === 0)
  const dragId = useRef<string | null>(null)
  const prevCount = useRef(trends.length)

  // Adding a trend (e.g. from a Value tab elsewhere) should reveal it —
  // auto-expand whenever the trend count grows.
  useEffect(() => {
    if (trends.length > prevCount.current) {
      panelRef.current?.expand()
      setCollapsed(false)
    }
    prevCount.current = trends.length
  }, [trends.length, panelRef])

  const toggle = () => {
    const panel = panelRef.current
    if (!panel) return
    if (panel.isCollapsed()) {
      panel.expand()
      setCollapsed(false)
    } else {
      panel.collapse()
      setCollapsed(true)
    }
  }

  return (
    <Panel
      id="trends"
      className="trends-panel"
      panelRef={panelRef}
      collapsible
      collapsedSize={`${COLLAPSED_PX}px`}
      minSize="120px"
      maxSize="70%"
      defaultSize={trends.length > 0 ? "28%" : `${COLLAPSED_PX}px`}
      onResize={size => setCollapsed(size.inPixels <= COLLAPSED_PX + 2)}
    >
      <div
        className="trends-header"
        onClick={toggle}
        title={t("toggleTrends")}
        role="button"
      >
        <span className={`trends-chevron`}>
          <Icon icon={collapsed ? "chevron-right" : "chevron-down"} />
        </span>
        <span className="trends-title">{t("trends")}</span>
        {trends.length > 0 && (
          <span className="tree-badge">{trends.length}</span>
        )}
      </div>

      {!collapsed && (
        <div className="trends-body">
          {trends.length === 0 ? (
            <div className="trends-empty">
              <div>{t("noTrendsYet")}</div>
              <div className="trends-empty-hint">{t("trendsHint")}</div>
            </div>
          ) : (
            <div className="trends-cards">
              {trends.map(trend => (
                <div
                  key={trend.id}
                  className={`trend-card-slot trend-card-w${trend.width}`}
                  draggable
                  onDragStart={() => {
                    dragId.current = trend.id
                  }}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault()
                    if (dragId.current) {
                      useTrendsStore
                        .getState()
                        .reorder(dragId.current, trend.id)
                      dragId.current = null
                    }
                  }}
                >
                  <TrendCard trend={trend} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Panel>
  )
}
