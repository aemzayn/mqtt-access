import { Icon } from "@blueprintjs/core"
import { buildJsonLines, getValueAtPath } from "../../lib/json"
import { SyntaxTokens } from "../ui/SyntaxText"
import { useT } from "../../i18n"

export function JsonView({
  value,
  previousValue,
  showDiff,
  onAddTrend,
  searchQuery = "",
}: {
  value: unknown
  previousValue?: unknown
  showDiff?: boolean
  onAddTrend?: (path: string, numeric: number) => void
  searchQuery?: string
}) {
  const t = useT()
  const lines = buildJsonLines(value)

  return (
    <pre className="payload-text json-view">
      {lines.map((line, i) => {
        const changed =
          showDiff &&
          line.path !== null &&
          previousValue !== undefined &&
          getValueAtPath(previousValue, line.path) !== line.leafValue
        return (
          <div
            key={i}
            className={`json-line${changed ? " json-line-changed" : ""}`}
            style={{ paddingLeft: line.depth * 14 }}
          >
            <SyntaxTokens tokens={line.tokens} searchQuery={searchQuery} />
            {onAddTrend && line.numeric !== null && line.path !== null && (
              <button
                type="button"
                className="json-add-trend"
                title={t("addToTrend")}
                onClick={() => onAddTrend(line.path!, line.numeric!)}
              >
                <Icon icon="timeline-line-chart" size={11} />
              </button>
            )}
          </div>
        )
      })}
    </pre>
  )
}
