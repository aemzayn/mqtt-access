import type {
  ConnectionConfig,
  MessageRecord,
  TopicDetails,
  TopicUpdate,
} from "./types";

// Thin type-safe wrapper around the Wails Go binding bridge.
// window['go']['main']['App'] is populated at runtime by Wails.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const go = () => (window as any)["go"]["main"]["App"];

function call<T>(method: string, ...args: unknown[]): Promise<T> {
  return go()[method](...args) as Promise<T>;
}

export interface StoredLayout {
  dockview: unknown | null;
  minimized: string[];
  openPanels: string[];
}

export const connect = (config: ConnectionConfig) =>
  call<void>("Connect", config);

export const disconnect = (connectionId: string) =>
  call<void>("Disconnect", connectionId);

export const publish = (
  connectionId: string,
  topic: string,
  payloadB64: string,
  qos: number,
  retain: boolean,
) => call<void>("Publish", connectionId, topic, payloadB64, qos, retain);

export const getTreeSnapshot = (connectionId: string) =>
  call<TopicUpdate[]>("GetTreeSnapshot", connectionId);

export const getTopicDetails = (connectionId: string, topic: string) =>
  call<TopicDetails>("GetTopicDetails", connectionId, topic);

export const getTopicHistory = (
  connectionId: string,
  topic: string,
  limit: number,
  beforeSeq?: number,
) =>
  call<MessageRecord[]>(
    "GetTopicHistory",
    connectionId,
    topic,
    limit,
    beforeSeq ?? null,
  );

export const watchTopic = (connectionId: string, topic: string) =>
  call<void>("WatchTopic", connectionId, topic);

export const unwatchTopic = (connectionId: string) =>
  call<void>("UnwatchTopic", connectionId);

export const clearConnectionData = (connectionId: string) =>
  call<void>("ClearConnectionData", connectionId);

export const loadConnections = () =>
  call<ConnectionConfig[]>("LoadConnections");

export const saveConnections = (configs: ConnectionConfig[]) =>
  call<void>("SaveConnections", configs);

export const loadLayout = () =>
  call<StoredLayout | null>("LoadLayout");

export const saveLayout = (data: StoredLayout) =>
  call<void>("SaveLayout", data);

export const openFilePicker = () =>
  call<string>("OpenFilePicker");
