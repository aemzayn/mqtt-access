import { useEffect, useRef } from "react"
import uPlot from "uplot"
import "uplot/dist/uPlot.min.css"
import { useT } from "../../i18n"
import { useSettingsStore } from "@/stores/settingsStore"
import { ThemeName } from "@/ipc/commands"

export interface ChartPoint {
  ts: number
  value: number
}

const MAX_POINTS = 10_000
const DEFAULT_COLOR = "#4fc3f7"

function toSeriesData(points: ChartPoint[]): [number[], number[]] {
  const windowed = points.slice(-MAX_POINTS)
  return [windowed.map(p => p.ts / 1000), windowed.map(p => p.value)]
}

const STROKE_COLORS: Record<ThemeName, string> = {
  dark: "#333",
  light: "#eee",
  dracula: "#333",
  "dark-contrast": "#333",
  "light-contrast": "#eee",
}

export function ValueChart({
  points,
  color,
}: {
  points: ChartPoint[]
  color?: string
}) {
  const t = useT()
  const containerRef = useRef<HTMLDivElement>(null)
  const plotRef = useRef<uPlot | null>(null)
  const pointsRef = useRef(points)
  pointsRef.current = points
  const theme = useSettingsStore(s => s.theme)
  const strokeColor = STROKE_COLORS[theme]

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const plot = new uPlot(
      {
        width: container.clientWidth || 400,
        height: container.clientHeight || 240,
        scales: { x: { time: true } },
        axes: [
          { stroke: "#9aa0a6", grid: { stroke: strokeColor } },
          { stroke: "#9aa0a6", grid: { stroke: strokeColor } },
        ],
        series: [
          {},
          {
            label: "value",
            stroke: color ?? DEFAULT_COLOR,
            width: 1.5,
            points: { show: false },
          },
        ],
        legend: { show: false },
        cursor: { y: false },
      },
      toSeriesData(pointsRef.current),
      container,
    )
    plotRef.current = plot

    const observer = new ResizeObserver(() => {
      plot.setSize({
        width: container.clientWidth || 400,
        height: container.clientHeight || 240,
      })
    })
    observer.observe(container)

    return () => {
      observer.disconnect()
      plot.destroy()
      plotRef.current = null
    }
    // uPlot has no runtime "change series color" API, so a color change
    // recreates the plot — re-seeded from pointsRef so it doesn't flash empty.
  }, [color, strokeColor])

  useEffect(() => {
    plotRef.current?.setData(toSeriesData(points))
  }, [points])

  return (
    <div className="value-chart-wrap">
      <div className="value-chart" ref={containerRef} />
      {points.length === 0 && (
        <div className="details-empty value-chart-empty">
          {t("noNumericValues")}
        </div>
      )}
    </div>
  )
}
