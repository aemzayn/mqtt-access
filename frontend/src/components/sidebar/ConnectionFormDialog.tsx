import { useState } from "react";
import {
  Button,
  Checkbox,
  Classes,
  Dialog,
  DialogBody,
  DialogFooter,
  FormGroup,
  HTMLSelect,
  InputGroup,
} from "@blueprintjs/core";
import { openFilePicker } from "../../ipc/commands";
import { useT } from "../../i18n";
import type {
  ConnectionConfig,
  Protocol,
  Subscription,
} from "../../ipc/types";

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
  const t = useT();
  const [config, setConfig] = useState<ConnectionConfig>({
    ...initial,
    clientId: initial.clientId ?? generateRandomClientId(),
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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.host.trim()) return;
    onSave({
      ...config,
      name: config.name.trim() || config.host,
      subscriptions: config.subscriptions.filter((s) => s.topic.trim() !== ""),
    });
  };

  return (
    <Dialog
      isOpen
      title={isNew ? t("addConnection") : t("editConnection")}
      onClose={onCancel}
      className={Classes.DARK}
    >
      <form onSubmit={submit}>
        <DialogBody>
          <div className="form-grid">
            <FormGroup label={t("name")} labelFor="conn-name">
              <InputGroup
                id="conn-name"
                value={config.name}
                onChange={(e) => patch({ name: e.target.value })}
                placeholder={t("namePlaceholder")}
                autoFocus
              />
            </FormGroup>

            <div className="form-row">
              <FormGroup label={t("protocol")} className="form-narrow">
                <HTMLSelect
                  fill
                  value={config.protocol}
                  onChange={(e) => setProtocol(e.target.value as Protocol)}
                  options={[
                    { value: "mqtt", label: "mqtt://" },
                    { value: "mqtts", label: "mqtts://" },
                    { value: "ws", label: "ws://" },
                    { value: "wss", label: "wss://" },
                  ]}
                />
              </FormGroup>
              <FormGroup label={t("host")} labelFor="conn-host" className="form-grow">
                <InputGroup
                  id="conn-host"
                  required
                  value={config.host}
                  onChange={(e) => patch({ host: e.target.value })}
                  placeholder="broker.example.com"
                />
              </FormGroup>
              <FormGroup label={t("port")} labelFor="conn-port" className="form-narrow">
                <InputGroup
                  id="conn-port"
                  type="number"
                  min={1}
                  max={65535}
                  value={String(config.port)}
                  onChange={(e) => patch({ port: Number(e.target.value) })}
                />
              </FormGroup>
            </div>

            {isWs && (
              <FormGroup label={t("wsPath")} labelFor="conn-ws-path">
                <InputGroup
                  id="conn-ws-path"
                  value={config.wsPath ?? ""}
                  onChange={(e) => patch({ wsPath: e.target.value || null })}
                  placeholder="/mqtt"
                />
              </FormGroup>
            )}

            <div className="form-row">
              <FormGroup
                label={t("username")}
                labelFor="conn-username"
                className="form-grow"
              >
                <InputGroup
                  id="conn-username"
                  value={config.username ?? ""}
                  onChange={(e) => patch({ username: e.target.value || null })}
                  autoComplete="off"
                />
              </FormGroup>
              <FormGroup
                label={t("password")}
                labelFor="conn-password"
                className="form-grow"
              >
                <InputGroup
                  id="conn-password"
                  type="password"
                  value={config.password ?? ""}
                  onChange={(e) => patch({ password: e.target.value || null })}
                  autoComplete="new-password"
                />
              </FormGroup>
            </div>

            <div className="form-row">
              <FormGroup
                label={t("clientId")}
                labelInfo={t("blankRandom")}
                labelFor="conn-client-id"
                className="form-grow"
              >
                <InputGroup
                  id="conn-client-id"
                  value={config.clientId ?? ""}
                  onChange={(e) => patch({ clientId: e.target.value || null })}
                />
              </FormGroup>
              <FormGroup
                label={t("keepalive")}
                labelFor="conn-keepalive"
                className="form-narrow"
              >
                <InputGroup
                  id="conn-keepalive"
                  type="number"
                  min={5}
                  value={String(config.keepAliveSecs)}
                  onChange={(e) =>
                    patch({ keepAliveSecs: Number(e.target.value) })
                  }
                />
              </FormGroup>
              <FormGroup
                label={t("historyPerTopic")}
                labelFor="conn-history"
                className="form-narrow"
              >
                <InputGroup
                  id="conn-history"
                  type="number"
                  min={1}
                  max={100000}
                  value={String(config.historyLimit)}
                  onChange={(e) =>
                    patch({ historyLimit: Number(e.target.value) })
                  }
                />
              </FormGroup>
            </div>

            <fieldset className="form-subs">
              <legend>{t("subscriptions")}</legend>
              {config.subscriptions.map((sub, i) => (
                <div className="form-row" key={i}>
                  <InputGroup
                    className="form-grow"
                    value={sub.topic}
                    onChange={(e) =>
                      setSubscription(i, { topic: e.target.value })
                    }
                    placeholder="topic/filter/#"
                  />
                  <HTMLSelect
                    value={sub.qos}
                    onChange={(e) =>
                      setSubscription(i, { qos: Number(e.target.value) })
                    }
                    options={[
                      { value: 0, label: "QoS 0" },
                      { value: 1, label: "QoS 1" },
                      { value: 2, label: "QoS 2" },
                    ]}
                  />
                  <Button
                    size="small"
                    icon="cross"
                    aria-label="Remove subscription"
                    title={t("removeSubscription")}
                    onClick={() =>
                      patch({
                        subscriptions: config.subscriptions.filter(
                          (_, j) => j !== i,
                        ),
                      })
                    }
                  />
                </div>
              ))}
              <Button
                size="small"
                icon="plus"
                className="form-subs-add"
                onClick={() =>
                  patch({
                    subscriptions: [
                      ...config.subscriptions,
                      { topic: "", qos: 0 },
                    ],
                  })
                }
              >
                {t("addSubscription")}
              </Button>
            </fieldset>

            {isTls && (
              <fieldset className="form-subs">
                <legend>{t("tls")}</legend>
                <FilePickerRow
                  label={t("caCert")}
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
                  label={t("clientCert")}
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
                  label={t("clientKey")}
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
                      tls: {
                        ...config.tls,
                        allowInvalidCerts: e.target.checked,
                      },
                    })
                  }
                >
                  {t("allowInvalidCerts")}
                </Checkbox>
              </fieldset>
            )}

            <Checkbox
              checked={config.connectOnStartup}
              onChange={(e) => patch({ connectOnStartup: e.target.checked })}
            >
              {t("connectOnStartup")}
            </Checkbox>
          </div>
        </DialogBody>
        <DialogFooter
          actions={
            <>
              <Button onClick={onCancel}>{t("cancel")}</Button>
              <Button type="submit" intent="primary">
                {t("save")}
              </Button>
            </>
          }
        />
      </form>
    </Dialog>
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
  const t = useT();
  return (
    <div className="form-row form-file">
      <span className="form-file-label">{label}</span>
      <span className="form-file-value" title={value ?? undefined}>
        {value ? value.split(/[\\/]/).pop() : t("none")}
      </span>
      <Button size="small" onClick={onPick}>
        {t("browse")}
      </Button>
      {value && (
        <Button
          size="small"
          icon="cross"
          aria-label="Clear file"
          title={t("clearFile")}
          onClick={onClear}
        />
      )}
    </div>
  );
}
