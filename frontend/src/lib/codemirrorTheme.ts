import { EditorView } from "@codemirror/view"
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language"
import { tags } from "@lezer/highlight"
import type { Extension } from "@codemirror/state"

// Colors are CSS var() references, not literal values, so the editor
// automatically re-skins itself when the app theme changes — no need to
// recreate the editor. Palette mirrors the app's .syn-* classes used
// elsewhere (Value tab, History tab) so JSON/XML look the same everywhere.
const chrome = EditorView.theme({
  "&": {
    color: "var(--text)",
    backgroundColor: "var(--bg-input)",
    height: "100%",
    fontSize: "var(--cm-font-size, 12px)",
  },
  ".cm-content": {
    fontFamily: "var(--font-mono)",
    caretColor: "var(--text)",
    padding: "4px 8px",
  },
  ".cm-gutters": {
    display: "none",
  },
  "&.cm-focused": {
    outline: "1px solid var(--accent)",
    outlineOffset: "-1px",
  },
  ".cm-scroller": {
    fontFamily: "var(--font-mono)",
    overflow: "auto",
  },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
    backgroundColor: "var(--select) !important",
  },
  ".cm-placeholder": {
    color: "var(--text-faint)",
    fontFamily: "var(--font-ui)",
  },
})

const highlight = syntaxHighlighting(
  HighlightStyle.define([
    { tag: [tags.propertyName, tags.attributeName], color: "var(--syn-key)" },
    { tag: [tags.string, tags.docString], color: "var(--syn-string)" },
    { tag: tags.number, color: "var(--syn-number)" },
    { tag: tags.bool, color: "var(--syn-bool)" },
    { tag: tags.null, color: "var(--syn-null)", fontStyle: "italic" },
    {
      tag: [tags.punctuation, tags.bracket, tags.angleBracket, tags.squareBracket, tags.brace],
      color: "var(--syn-punct)",
    },
    { tag: [tags.tagName, tags.keyword], color: "var(--syn-key)" },
    { tag: [tags.comment, tags.lineComment, tags.blockComment], color: "var(--syn-null)" },
  ]),
)

export function appEditorTheme(): Extension[] {
  return [chrome, highlight]
}
