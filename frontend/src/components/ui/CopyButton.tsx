import { useEffect, useRef, useState } from "react"
import { Button, Icon } from "@blueprintjs/core"
import { copyText } from "../../lib/clipboard"

export function CopyButton({
  getText,
  title,
}: {
  getText: () => string
  title: string
}) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (await copyText(getText())) {
      setCopied(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <Button
      size="small"
      variant="minimal"
      icon={<Icon icon={copied ? "tick" : "duplicate"} size={11} />}
      onClick={copy}
      aria-label={title}
      title={title}
      className="copy-button"
    />
  )
}
