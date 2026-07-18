import { JSX, useState } from "react";
import { openFilePicker } from "../../ipc/commands";
import type {
  ConnectionConfig,
  Protocol,
  Qos,
  Subscription,
} from "../../ipc/types";
import { PlusIcon, XIcon } from "lucide-react";
import {
  Button,
  Checkbox,
  FormGroup,
  InputGroup,
  MenuItem,
  NumericInput,
} from "@blueprintjs/core";
import { ItemRenderer, Select } from "@blueprintjs/select";

const DEFAULT_PORTS: Record<Protocol, number> = {
  mqtt: 1883,
  mqtts: 8883,
  ws: 8083,
  wss: 8084,
};

const generateRandomClientId = () => {
  const randomString = Math.random().toString(36).substring(2, 10);
  return `mqtt-access-${randomString}`;
};

interface QosOption {
  title: string;
  value: Qos;
}

interface ProtocolOption {
  title: string;
  value: Protocol;
}

const QOS_OPTIONS: QosOption[] = [
  { value: 0, title: "QoS 0" },
  { value: 1, title: "QoS 1" },
  { value: 2, title: "QoS 2" },
];

const PROTOCOL_OPTIONS: ProtocolOption[] = [
  { value: "mqtt", title: "mqtt://" },
  { value: "mqtts", title: "mqtts://" },
  { value: "ws", title: "ws://" },
  { value: "wss", title: "wss://" },
];

const renderOption = <T extends { value: string | number; title: string }>(
  option: T,
  { handleClick, handleFocus, modifiers }: any,
): JSX.Element | null => {
  if (!modifiers.matchesPredicate) {
    return null;
  }
  return (
    <MenuItem
      active={modifiers.active}
      disabled={modifiers.disabled}
      key={option.value}
      onClick={handleClick}
      onFocus={handleFocus}
      roleStructure="listoption"
      text={option.title}
    />
  );
};

export function ConnectionFormDialog({
  initial,
  isNew,
  onSave,
  onCancel,
}: {
  initial: ConnectionConfig;
  isNew: boolean;
  onSave: (config: ConnectionConfig) => void;
  onCancel: () => void;
}) {
  const [config, setConfig] = useState<ConnectionConfig>({
    ...initial,
    port: initial.port ?? DEFAULT_PORTS[initial.protocol],
    clientId: initial.clientId ?? generateRandomClientId(),
    protocol: "mqtt",
  });

  const patch = (p: Partial<ConnectionConfig>) =>
    setConfig((c) => ({ ...c, ...p }));

  const isTls = config.protocol === "mqtts" || config.protocol === "wss";
  const isWs = config.protocol === "ws" || config.protocol === "wss";

  const setProtocol = (protocol: Protocol) => {
    const portWasDefault = config.port === DEFAULT_PORTS[config.protocol];
    patch({
      protocol,
      port: portWasDefault ? DEFAULT_PORTS[protocol] : config.port,
      tls:
        protocol === "mqtts" || protocol === "wss"
          ? (config.tls ?? { allowInvalidCerts: false })
          : config.tls,
    });
  };

  const setSubscription = (index: number, sub: Partial<Subscription>) => {
    const subscriptions = config.subscriptions.map((s, i) =>
      i === index ? { ...s, ...sub } : s,
    );
    patch({ subscriptions });
  };

  const pickFile = async (
    field: "caCertPath" | "clientCertPath" | "clientKeyPath",
  ) => {
    const path = await openFilePicker().catch(() => null);
    if (path) {
      patch({
        tls: { allowInvalidCerts: false, ...config.tls, [field]: path },
      });
    }
  };

  const submit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!config.host.trim()) return;
    onSave({
      ...config,
      name: config.name.trim() || config.host,
      subscriptions: config.subscriptions.filter((s) => s.topic.trim() !== ""),
    });
  };

  const headerLabel = isNew ? "Add connection" : "Edit connection";

  return (
    <form onSubmit={submit}>
      <FormGroup label="Name" labelFor="name">
        <InputGroup
          id="name"
          value={config.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="My broker"
          autoFocus
        />
      </FormGroup>

      <div>
        <Select<ProtocolOption>
          itemRenderer={renderOption}
          items={PROTOCOL_OPTIONS}
          onItemSelect={(e) => setProtocol(e.value)}
        >
          <Button
            text={
              PROTOCOL_OPTIONS.find((p) => p.value === config.protocol)?.title
            }
            endIcon="double-caret-vertical"
          />
        </Select>

        <FormGroup label="Host" labelFor="host">
          <InputGroup
            required
            id="host"
            value={config.host}
            onChange={(e) => patch({ host: e.target.value })}
            placeholder="broker.example.com"
          />
        </FormGroup>

        <FormGroup label="Port" labelFor="port">
          <NumericInput
            id="port"
            type="number"
            min={1}
            max={65535}
            value={config.port}
            onChange={(e) => patch({ port: Number(e.target.value) })}
          />
        </FormGroup>
      </div>

      {isWs && (
        <FormGroup label="WebSocket path" labelFor="wsPath">
          <InputGroup
            id="wsPath"
            value={config.wsPath ?? ""}
            onChange={(e) => patch({ wsPath: e.target.value || null })}
            placeholder="/mqtt"
          />
        </FormGroup>
      )}

      <div>
        <FormGroup label="Username" labelFor="username">
          <InputGroup
            value={config.username ?? ""}
            onChange={(e) => patch({ username: e.target.value || null })}
            autoComplete="off"
          />
        </FormGroup>

        <FormGroup label="Password" labelFor="password">
          <InputGroup
            id="password"
            placeholder="blank = none"
            type="password"
            value={config.password ?? ""}
            onChange={(e) => patch({ password: e.target.value || null })}
            autoComplete="new-password"
          />
        </FormGroup>
      </div>

      <div>
        <FormGroup label="Client ID" labelFor="clientId">
          <InputGroup
            id="clientId"
            placeholder="blank = random"
            value={config.clientId ?? ""}
            onChange={(e) => patch({ clientId: e.target.value || null })}
          />
        </FormGroup>

        <FormGroup label="Keepalive (s)" labelFor="keepalive">
          <NumericInput
            min={5}
            type="number"
            value={config.keepAliveSecs}
            onChange={(e) => patch({ keepAliveSecs: e.target.valueAsNumber })}
          />
        </FormGroup>

        <FormGroup label="History/topic" labelFor="historyLimit">
          <InputGroup
            type="number"
            min={1}
            max={100000}
            value={String(config.historyLimit)}
            onChange={(e) => patch({ historyLimit: e.target.valueAsNumber })}
          />
        </FormGroup>
      </div>

      {/* Subscriptions */}
      <div>
        <span>Subscriptions</span>
        {config.subscriptions.map((sub, i) => (
          <div key={i}>
            <InputGroup
              value={sub.topic}
              onChange={(e) => setSubscription(i, { topic: e.target.value })}
              placeholder="topic/filter/#"
            />

            <Select<QosOption>
              items={QOS_OPTIONS}
              onItemSelect={(qos) => setSubscription(i, { qos: qos.value })}
              itemRenderer={renderOption}
            >
              <Button text={`QoS ${sub.qos}`} endIcon="double-caret-vertical" />
            </Select>

            <Button
              onClick={() =>
                patch({
                  subscriptions: config.subscriptions.filter((_, j) => j !== i),
                })
              }
            >
              <XIcon />
            </Button>
          </div>
        ))}
        <Button
          onClick={() =>
            patch({
              subscriptions: [...config.subscriptions, { topic: "", qos: 0 }],
            })
          }
        >
          <PlusIcon />
          Add subscription
        </Button>
      </div>

      {/* TLS */}
      {isTls && (
        <div>
          <span>TLS</span>
          <FilePickerRow
            label="CA certificate"
            value={config.tls?.caCertPath ?? null}
            onPick={() => pickFile("caCertPath")}
            onClear={() =>
              patch({
                tls: {
                  allowInvalidCerts: false,
                  ...config.tls,
                  caCertPath: null,
                },
              })
            }
          />
          <FilePickerRow
            label="Client certificate"
            value={config.tls?.clientCertPath ?? null}
            onPick={() => pickFile("clientCertPath")}
            onClear={() =>
              patch({
                tls: {
                  allowInvalidCerts: false,
                  ...config.tls,
                  clientCertPath: null,
                },
              })
            }
          />
          <FilePickerRow
            label="Client key"
            value={config.tls?.clientKeyPath ?? null}
            onPick={() => pickFile("clientKeyPath")}
            onClear={() =>
              patch({
                tls: {
                  allowInvalidCerts: false,
                  ...config.tls,
                  clientKeyPath: null,
                },
              })
            }
          />
          <Checkbox
            checked={config.tls?.allowInvalidCerts ?? false}
            onChange={(e) =>
              patch({
                tls: { ...config.tls, allowInvalidCerts: e.target.checked },
              })
            }
          >
            Allow invalid / self-signed certificates
          </Checkbox>
        </div>
      )}

      {/* <Checkbox
        isSelected={config.connectOnStartup}
        onChange={(v) => patch({ connectOnStartup: v })}
        name="connectOnStartup"
        // size="sm"
        // classNames={{ label: "text-[13px] text-[#cccccc]" }}
      >
        <Checkbox.Content>
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
          Connect on startup
        </Checkbox.Content>
      </Checkbox> */}
    </form>
  );
}

function FilePickerRow({
  label,
  value,
  onPick,
  onClear,
}: {
  label: string;
  value: string | null | undefined;
  onPick: () => void;
  onClear: () => void;
}) {
  return (
    <div>
      <span>{label}</span>
      <span title={value ?? undefined}>
        {value ? value.split(/[\\/]/).pop() : "(none)"}
      </span>
      <Button onClick={onPick}>Browse…</Button>
      {value && (
        <Button onClick={onClear}>
          <XIcon />
        </Button>
      )}
    </div>
  );
}
