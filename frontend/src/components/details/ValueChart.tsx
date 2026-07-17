import { useEffect, useRef } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";

export interface ChartPoint {
  ts: number;
  value: number;
}

const MAX_POINTS = 10_000;

export function ValueChart({ points }: { points: ChartPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<uPlot | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const plot = new uPlot(
      {
        width: container.clientWidth || 400,
        height: container.clientHeight || 240,
        scales: { x: { time: true } },
        axes: [
          { stroke: "#9aa0a6", grid: { stroke: "#333" } },
          { stroke: "#9aa0a6", grid: { stroke: "#333" } },
        ],
        series: [
          {},
          {
            label: "value",
            stroke: "#4fc3f7",
            width: 1.5,
            points: { show: false },
          },
        ],
        legend: { show: false },
        cursor: { y: false },
      },
      [[], []],
      container,
    );
    plotRef.current = plot;

    const observer = new ResizeObserver(() => {
      plot.setSize({
        width: container.clientWidth || 400,
        height: container.clientHeight || 240,
      });
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      plot.destroy();
      plotRef.current = null;
    };
  }, []);

  useEffect(() => {
    const windowed = points.slice(-MAX_POINTS);
    const xs = windowed.map((p) => p.ts / 1000);
    const ys = windowed.map((p) => p.value);
    plotRef.current?.setData([xs, ys]);
  }, [points]);

  return (
    <div className="value-chart-wrap">
      <div className="value-chart" ref={containerRef} />
      {points.length === 0 && (
        <div className="details-empty value-chart-empty">
          No numeric values on this topic yet.
        </div>
      )}
    </div>
  );
}
