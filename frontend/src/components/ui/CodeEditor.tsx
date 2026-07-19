import { useMemo } from "react"
import CodeMirror from "@uiw/react-codemirror"
import type { Extension } from "@codemirror/state"
import { json as jsonLang } from "@codemirror/lang-json"
import { xml as xmlLang } from "@codemirror/lang-xml"
import { appEditorTheme } from "../../lib/codemirrorTheme"

export type EditorLanguage = "json" | "xml" | null

export function CodeEditor({
  value,
  onChange,
  language,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  language: EditorLanguage
  placeholder: string
}) {
  const extensions = useMemo<Extension[]>(() => {
    const lang =
      language === "json" ? [jsonLang()] : language === "xml" ? [xmlLang()] : []
    return [...lang, ...appEditorTheme()]
  }, [language])

  return (
    <div className="code-editor">
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={extensions}
        placeholder={placeholder}
        theme="none"
        height="100%"
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          highlightActiveLine: false,
          highlightActiveLineGutter: false,
        }}
      />
    </div>
  )
}
