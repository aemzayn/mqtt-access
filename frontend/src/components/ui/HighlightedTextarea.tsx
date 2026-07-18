import { useRef } from "react"
import { tokenizeText, tokenizeXml } from "../../lib/syntaxHighlight"
import { SyntaxTokens } from "./SyntaxText"

export type EditorLanguage = "json" | "xml" | null

// Classic transparent-textarea-over-highlighted-<pre> technique: the
// textarea supplies real editing/selection/caret behavior while an
// absolutely-positioned <pre> underneath renders the colored tokens.
export function HighlightedTextarea({
  value,
  onChange,
  language,
  rows,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  language: EditorLanguage
  rows: number
  placeholder: string
}) {
  const preRef = useRef<HTMLPreElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)

  const syncScroll = () => {
    if (preRef.current && taRef.current) {
      preRef.current.scrollTop = taRef.current.scrollTop
      preRef.current.scrollLeft = taRef.current.scrollLeft
    }
  }

  const tokens =
    language === "json"
      ? tokenizeText(value)
      : language === "xml"
        ? tokenizeXml(value)
        : null

  return (
    <div className="publish-editor">
      {tokens && (
        <pre ref={preRef} className="publish-editor-highlight" aria-hidden="true">
          <SyntaxTokens tokens={tokens} />
          {"\n"}
        </pre>
      )}
      <textarea
        ref={taRef}
        className={`publish-editor-input bp6-input${tokens ? " publish-editor-input-transparent" : ""}`}
        value={value}
        onChange={e => onChange(e.target.value)}
        onScroll={syncScroll}
        rows={rows}
        placeholder={placeholder}
        spellCheck={false}
      />
    </div>
  )
}
