import { describe, expect, it } from "vitest"
import {
  countSearchMatches,
  findSearchRanges,
  splitSearchText,
  splitSearchTextAt,
} from "./search"

describe("payload search", () => {
  it("finds case-insensitive matches and preserves surrounding text", () => {
    expect(splitSearchText("Pump is ON; pump is off", "pump")).toEqual([
      { text: "Pump", matched: true },
      { text: " is ON; ", matched: false },
      { text: "pump", matched: true },
      { text: " is off", matched: false },
    ])
    expect(countSearchMatches("Pump is ON; pump is off", "pump")).toBe(2)
  })

  it("treats search text literally and handles empty or missing queries", () => {
    expect(splitSearchText('{"value":"a.b"}', "a.b")).toContainEqual({
      text: "a.b",
      matched: true,
    })
    expect(countSearchMatches("payload", "")).toBe(0)
    expect(countSearchMatches("payload", "missing")).toBe(0)
  })

  it("highlights a match that spans syntax tokens", () => {
    const ranges = findSearchRanges('"fan": "on"', 'fan": "on')
    const segments = [
      ...splitSearchTextAt('"fan"', ranges),
      ...splitSearchTextAt(": ", ranges, 5),
      ...splitSearchTextAt('"on"', ranges, 7),
    ]
    expect(
      segments
        .filter(segment => segment.matched)
        .map(s => s.text)
        .join(""),
    ).toBe('fan": "on')
  })
})
