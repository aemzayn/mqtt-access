// One-time wiring of backend push events into the frontend stores.
import { onBatch, onMessage, onStatus } from "./events"
import { getMirror } from "../stores/treeMirror"
import { useConnectionsStore } from "../stores/connectionsStore"
import { dispatchMessage } from "../stores/messageBus"
import { showErrorToast } from "../lib/toaster"
import { translate } from "../i18n"

let wired = false

// Synchronous in the Wails version — EventsOn registers immediately.
export function initIpc(): void {
  if (wired) return
  wired = true

  onStatus(e => {
    const store = useConnectionsStore.getState()
    store.setStatus(e.connectionId, e.status, e.error)
    // A disconnected status carrying an error means the connect attempt failed.
    if (e.status === "disconnected" && e.error) {
      const config = store.configs.find(c => c.id === e.connectionId)
      const name = config?.name || config?.host || e.connectionId
      showErrorToast(`${translate("connectFailed", { name })}: ${e.error}`)
    }
  })

  onBatch(e => {
    getMirror(e.connectionId).applyBatch(e)
  })

  onMessage(dispatchMessage)
}
