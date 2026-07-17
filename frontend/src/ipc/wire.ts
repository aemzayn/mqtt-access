// One-time wiring of backend push events into the frontend stores.
import { onBatch, onMessage, onStatus } from "./events";
import { getMirror } from "../stores/treeMirror";
import { useConnectionsStore } from "../stores/connectionsStore";
import { dispatchMessage } from "../stores/messageBus";

let wired = false;

// Synchronous in the Wails version — EventsOn registers immediately.
export function initIpc(): void {
  if (wired) return;
  wired = true;

  onStatus((e) => {
    useConnectionsStore.getState().setStatus(e.connectionId, e.status, e.error);
  });

  onBatch((e) => {
    getMirror(e.connectionId).applyBatch(e);
  });

  onMessage(dispatchMessage);
}
