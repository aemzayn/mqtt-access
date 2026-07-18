import type { JsonToken } from "../../lib/json"
import { tokenizeText } from "../../lib/syntaxHighlight"

export function SyntaxTokens({ tokens }: { tokens: JsonToken[] }) {
  return (
    <>
      {tokens.map((tok, i) =>
        tok.cls ? (
          <span key={i} className={tok.cls}>
            {tok.text}
          </span>
        ) : (
          <span key={i}>{tok.text}</span>
        ),
      )}
    </>
  )
}

export function SyntaxText({ text }: { text: string }) {
  return <SyntaxTokens tokens={tokenizeText(text)} />
}
