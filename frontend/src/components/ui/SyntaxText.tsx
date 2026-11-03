import type { JsonToken } from "../../lib/json"
import { tokenizeText } from "../../lib/syntaxHighlight"
import { findSearchRanges, splitSearchTextAt } from "../../lib/search"

export function SyntaxTokens({
  tokens,
  searchQuery = "",
}: {
  tokens: JsonToken[]
  searchQuery?: string
}) {
  const ranges = findSearchRanges(
    tokens.map(token => token.text).join(""),
    searchQuery,
  )
  let offset = 0

  return (
    <>
      {tokens.map((tok, i) => {
        const text = splitSearchTextAt(tok.text, ranges, offset).map(
          (segment, j) =>
            segment.matched ? (
              <mark key={j} className="payload-search-match">
                {segment.text}
              </mark>
            ) : (
              segment.text
            ),
        )
        offset += tok.text.length
        return tok.cls ? (
          <span key={i} className={tok.cls}>
            {text}
          </span>
        ) : (
          <span key={i}>{text}</span>
        )
      })}
    </>
  )
}

export function SyntaxText({
  text,
  searchQuery = "",
}: {
  text: string
  searchQuery?: string
}) {
  return <SyntaxTokens tokens={tokenizeText(text)} searchQuery={searchQuery} />
}
