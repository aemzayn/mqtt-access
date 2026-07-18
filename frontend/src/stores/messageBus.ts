import type { MessageEvent } from "../ipc/types"

type Handler = (event: MessageEvent) => void

const handlers = new Map<string, Set<Handler>>()

export function subscribeMessages(
  connectionId: string,
  handler: Handler,
): () => void {
  let set = handlers.get(connectionId)
  if (!set) {
    set = new Set()
    handlers.set(connectionId, set)
  }
  set.add(handler)
  return () => {
    set!.delete(handler)
    if (set!.size === 0) handlers.delete(connectionId)
  }
}

export function dispatchMessage(event: MessageEvent): void {
  const set = handlers.get(event.connectionId)
  if (set) {
    for (const handler of set) handler(event)
  }
}
