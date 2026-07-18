export type Protocol = "mqtt" | "mqtts" | "ws" | "wss";

export type Qos = 0 | 1 | 2;

export interface Subscription {
  topic: string;
  qos: number;
}

export interface TlsConfig {
  caCertPath?: string | null;
  clientCertPath?: string | null;
  clientKeyPath?: string | null;
  allowInvalidCerts: boolean;
}

export interface ConnectionConfig {
  id: string;
  name: string;
  protocol: Protocol;
  host: string;
  port: number;
  wsPath?: string | null;
  username?: string | null;
  password?: string | null;
  clientId?: string | null;
  keepAliveSecs: number;
  cleanSession: boolean;
  subscriptions: Subscription[];
  tls?: TlsConfig | null;
  historyLimit: number;
  connectOnStartup: boolean;
}

export interface MessageRecord {
  seq: number;
  tsMs: number;
  payloadB64: string;
  payloadUtf8: string | null;
  qos: number;
  retain: boolean;
}

export interface TopicUpdate {
  topic: string;
  preview: string;
  msgCount: number;
  lastTsMs: number;
  retain: boolean;
  numeric: number | null;
}

export interface TopicDetails {
  topic: string;
  latest: MessageRecord | null;
  msgCount: number;
  historyLen: number;
}

export type ConnectionStatus =
  "connecting" | "connected" | "reconnecting" | "disconnected" | "error";

export interface StatusEvent {
  connectionId: string;
  status: ConnectionStatus;
  error?: string;
}

export interface BatchEvent {
  connectionId: string;
  updates: TopicUpdate[];
  totalMessages: number;
  totalTopics: number;
}

export interface MessageEvent {
  connectionId: string;
  topic: string;
  message: MessageRecord;
}

export function defaultConnectionConfig(id: string): ConnectionConfig {
  return {
    id,
    name: "",
    protocol: "mqtt",
    host: "",
    port: 1883,
    wsPath: "/mqtt",
    username: null,
    password: null,
    clientId: null,
    keepAliveSecs: 60,
    cleanSession: true,
    subscriptions: [{ topic: "#", qos: 0 }],
    tls: null,
    historyLimit: 1000,
    connectOnStartup: false,
  };
}
