# MQTT Access

A cross-platform desktop MQTT explorer that connects to **multiple brokers
simultaneously**, each in its own dockable panel. Inspired by MQTT Explorer.

Built with **Wails v2** (Go backend) + **React + TypeScript** (Vite frontend).

## Features

- Multiple concurrent broker connections, each in a resizable / draggable /
	minimizable dock panel (dockview).
- Live hierarchical topic tree (virtualized) with per-topic latest-value
	preview, message counts, and retained flags.
- Per-topic details: raw + pretty-JSON payload, message history with
	consecutive-payload diffs, and a live numeric value chart (uPlot).
- Publish with QoS 0/1/2 and retain.
- Transports: `mqtt`, `mqtts`, `ws`, `wss` — with username/password auth and
	TLS options (CA cert, client cert/key, allow self-signed).
- Connections and window layout persist locally; optional connect-on-startup.
- Message data is kept in RAM only while relevant, with a bounded per-topic
	history (default 1000 messages/topic).

## Architecture

Go owns the MQTT connections and all message data. Each connection configures a
Paho MQTT client and ingests incoming messages into a per-connection `TopicStore`
(topic trie + bounded per-topic history). A 100 ms **batcher** coalesces dirty
topics and emits one `mqtt:batch` Wails event (<=10 Hz) — cost is O(distinct
topics touched), not O(messages), so high-volume brokers don't flood the bridge.
The frontend keeps a lightweight off-React mirror tree for rendering and fetches
full payloads/history on demand.

Key files:
- `mqtt/client.go` — connection setup, transports, reconnect behavior, TLS wiring
- `mqtt/store.go` — topic trie + bounded history
- `mqtt/batcher.go` — coalesced batch emission (`mqtt:batch`)
- `app.go` — Wails-bound commands and event flow
- `frontend/src/lib/topicMirror.ts` — off-React tree mirror + flatten (render-perf linchpin)
- `frontend/src/components/dock/DockArea.tsx` — dockview panels, minimize strip, layout persistence

## Develop

```sh
cd frontend && npm install
cd ..
wails dev            # launch the app (dev)
wails build          # production bundle
cd frontend && npm test   # frontend unit tests (vitest)
go test ./...        # Go tests
```

## Testing with a broker

Public brokers (`broker.emqx.io`, `test.mosquitto.org`) work, but note that
their **bare `#` wildcard is often throttled/blocked** — subscribe to a specific
prefix like `bench/#` when testing.

For deterministic testing, run a local broker:

```sh
docker run -d --name mosq -p 18883:1883 -p 19001:9001 eclipse-mosquitto:2
```

Then add a connection to `localhost:18883` subscribed to `bench/#`, and publish
sample traffic (for example with `mosquitto_pub`) to validate tree updates,
history, and charts.
