import { useSyncExternalStore } from "react";
import { applyUpdates, createRoot, type MirrorNode } from "../lib/topicMirror";
import type { BatchEvent, TopicUpdate } from "../ipc/types";

export class ConnectionMirror {
  root: MirrorNode = createRoot();
  version = 0;
  totalMessages = 0;
  totalTopics = 0;
  messageRate = 0;
  private lastRateSample = { tsMs: 0, totalMessages: 0 };
  private listeners = new Set<() => void>();

  applyBatch(event: BatchEvent) {
    applyUpdates(this.root, event.updates);
    this.totalMessages = event.totalMessages;
    this.totalTopics = event.totalTopics;
    this.sampleRate();
    this.bump();
  }

  applySnapshot(updates: TopicUpdate[]) {
    applyUpdates(this.root, updates);
    this.bump();
  }

  reset() {
    this.root = createRoot();
    this.totalMessages = 0;
    this.totalTopics = 0;
    this.messageRate = 0;
    this.lastRateSample = { tsMs: 0, totalMessages: 0 };
    this.bump();
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private sampleRate() {
    const now = Date.now();
    const prev = this.lastRateSample;
    if (prev.tsMs > 0 && now > prev.tsMs) {
      const instant =
        ((this.totalMessages - prev.totalMessages) / (now - prev.tsMs)) * 1000;
      this.messageRate = this.messageRate * 0.7 + instant * 0.3;
    }
    this.lastRateSample = { tsMs: now, totalMessages: this.totalMessages };
  }

  private bump() {
    this.version += 1;
    for (const listener of this.listeners) listener();
  }
}

const mirrors = new Map<string, ConnectionMirror>();

export function getMirror(connectionId: string): ConnectionMirror {
  let mirror = mirrors.get(connectionId);
  if (!mirror) {
    mirror = new ConnectionMirror();
    mirrors.set(connectionId, mirror);
  }
  return mirror;
}

export function resetMirror(connectionId: string) {
  mirrors.get(connectionId)?.reset();
}

export function useMirrorVersion(connectionId: string): number {
  const mirror = getMirror(connectionId);
  return useSyncExternalStore(mirror.subscribe, () => mirror.version);
}
