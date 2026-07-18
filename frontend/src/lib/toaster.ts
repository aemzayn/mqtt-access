import { createRoot } from "react-dom/client"
import { Classes, OverlayToaster, Position } from "@blueprintjs/core"

// React 19 removed ReactDOM.render, so give Blueprint a createRoot renderer.
const toaster = OverlayToaster.createAsync(
  { position: Position.BOTTOM, className: `${Classes.DARK} app-toaster` },
  {
    domRenderer: (element, container) => createRoot(container).render(element),
  },
)

export async function showErrorToast(message: string) {
  ;(await toaster).show({ message, intent: "danger", timeout: 6000 })
}
