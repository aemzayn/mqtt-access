// Thin typed layer over Wails runtime events.
import { EventsOn, EventsOff } from "../../wailsjs/runtime/runtime"
import type { BatchEvent, MessageEvent, StatusEvent } from "./types"

type Unlisten = () => void

export const onStatus = (handler: (e: StatusEvent) => void): Unlisten => {
  EventsOn("mqtt:status", handler)
  return () => EventsOff("mqtt:status")
}

export const onBatch = (handler: (e: BatchEvent) => void): Unlisten => {
  EventsOn("mqtt:batch", handler)
  return () => EventsOff("mqtt:batch")
}

export const onMessage = (handler: (e: MessageEvent) => void): Unlisten => {
  EventsOn("mqtt:message", handler)
  return () => EventsOff("mqtt:message")
}
