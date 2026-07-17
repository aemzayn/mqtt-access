import { create } from "zustand";
import * as commands from "../ipc/commands";

interface SelectionState {
  selected: Record<string, string | null>;
  select: (connectionId: string, topic: string | null) => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selected: {},
  select: (connectionId, topic) => {
    set((state) => ({
      selected: { ...state.selected, [connectionId]: topic },
    }));
    if (topic) {
      commands.watchTopic(connectionId, topic).catch(() => {});
    } else {
      commands.unwatchTopic(connectionId).catch(() => {});
    }
  },
}));
