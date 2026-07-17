import { useState } from "react";
import {
  Modal,
  Button,
  Input,
  Select,
  Checkbox,
  Label,
  TextField,
  ListBox,
} from "@heroui/react";
import { openFilePicker } from "../../ipc/commands";
import type { ConnectionConfig, Protocol, Subscription } from "../../ipc/types";

const DEFAULT_PORTS: Record<Protocol, number> = {
  mqtt: 1883,
  mqtts: 8883,
  ws: 8083,
  wss: 8084,
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
  const [config, setConfig] = useState<ConnectionConfig>({ ...initial });
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

  const inputCls = "bg-[#3c3c3c] text-[#cccccc]";

  return (
    <Modal
      isOpen
      onOpenChange={(isOpen) => !isOpen && onCancel()}
      defaultOpen
      // classNames={{
      //   base: "bg-[#252526] border border-[#3c3c3c] text-[#cccccc]",
      //   header:
      //     "border-b border-[#3c3c3c] text-[#cccccc] text-base font-semibold pb-3",
      //   body: "py-3 gap-3",
      //   footer: "border-t border-[#3c3c3c] pt-3 gap-2",
      //   closeButton: "text-[#969696] hover:text-[#cccccc] hover:bg-[#3c3c3c]",
      // }}
    >
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              {isNew ? "Add connection" : "Edit connection"}
            </Modal.Header>
            <Modal.Body>
              <form onSubmit={submit}>
                <TextField className="flex flex-col gap-1" isRequired>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={config.name}
                    onChange={(e) => patch({ name: e.target.value })}
                    placeholder="My broker"
                    autoFocus
                    // size="sm"
                    variant="primary"
                    // classNames={{ inputWrapper: inputCls }}
                  />
                </TextField>

                <div className="flex gap-2 items-end">
                  <Select
                    // label="Protocol"
                    // selectedKeys={[config.protocol]}
                    // onChange={(e) => setProtocol(e.target.value as Protocol)}
                    className="w-[130px] shrink-0"
                    // classNames={{
                    //   trigger: inputCls,
                    //   value: "text-[#cccccc]",
                    // }}
                  >
                    <Label>Protocol</Label>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        <ListBox.Item key="mqtt">mqtt://</ListBox.Item>
                        <ListBox.Item key="mqtts">mqtts://</ListBox.Item>
                        <ListBox.Item key="ws">ws://</ListBox.Item>
                        <ListBox.Item key="wss">wss://</ListBox.Item>
                      </ListBox>
                    </Select.Popover>
                  </Select>

                  <TextField className="flex flex-col gap-1" isRequired>
                    <Label htmlFor="host">Host</Label>
                    <Input
                      id="host"
                      value={config.host}
                      onChange={(e) => patch({ host: e.target.value })}
                      placeholder="broker.example.com"
                      className="flex-1"
                      // classNames={{ inputWrapper: inputCls }}
                    />
                  </TextField>

                  <TextField>
                    <Label htmlFor="port">Port</Label>
                    <Input
                      id="port"
                      type="number"
                      min={1}
                      max={65535}
                      value={String(config.port)}
                      onChange={(e) => patch({ port: Number(e.target.value) })}
                      className="w-[90px] shrink-0"
                      // classNames={{ inputWrapper: inputCls }}
                    />
                  </TextField>
                </div>

                {isWs && (
                  <TextField>
                    <Label htmlFor="port">WebSocket path</Label>
                    <Input
                      value={config.wsPath ?? ""}
                      onChange={(e) =>
                        patch({ wsPath: e.target.value || null })
                      }
                      placeholder="/mqtt"
                      // classNames={{ inputWrapper: inputCls }}
                    />
                  </TextField>
                )}

                <div className="flex gap-2">
                  <TextField>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      value={config.username ?? ""}
                      onChange={(e) =>
                        patch({ username: e.target.value || null })
                      }
                      autoComplete="off"
                      className="flex-1"
                      // classNames={{ inputWrapper: inputCls }}
                    />
                  </TextField>
                  <TextField type="password">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      type="password"
                      value={config.password ?? ""}
                      onChange={(e) =>
                        patch({ password: e.target.value || null })
                      }
                      autoComplete="new-password"
                      className="flex-1"
                      // classNames={{ inputWrapper: inputCls }}
                    />
                  </TextField>
                </div>

                <div className="flex gap-2">
                  <TextField>
                    <Label htmlFor="clientId">Client ID</Label>
                    <Input
                      placeholder="blank = random"
                      value={config.clientId ?? ""}
                      onChange={(e) =>
                        patch({ clientId: e.target.value || null })
                      }
                      className="flex-1"
                      // classNames={{
                      //   inputWrapper: inputCls,
                      //   description: "text-[#6e7681]",
                      // }}
                    />
                  </TextField>
                  <TextField type="number">
                    <Label htmlFor="keepalive">Keepalive (s)</Label>
                    <Input
                      type="number"
                      min={5}
                      value={String(config.keepAliveSecs)}
                      onChange={(e) =>
                        patch({ keepAliveSecs: e.target.valueAsNumber })
                      }
                      className="w-[110px] shrink-0"
                      // classNames={{ inputWrapper: inputCls }}
                    />
                  </TextField>

                  <TextField type="number">
                    <Label htmlFor="historyLimit">History/topic</Label>
                    <Input
                      type="number"
                      min={1}
                      max={100000}
                      value={String(config.historyLimit)}
                      onChange={(e) =>
                        patch({ historyLimit: e.target.valueAsNumber })
                      }
                      // variant="outline"
                      className="w-[110px] shrink-0"
                      // classNames={{ inputWrapper: inputCls }}
                    />
                  </TextField>
                </div>

                {/* Subscriptions */}
                <div className="border border-[#3c3c3c] rounded-lg p-3 flex flex-col gap-2">
                  <span className="text-[11px] text-[#969696]">
                    Subscriptions
                  </span>
                  {config.subscriptions.map((sub, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <TextField>
                        <Input
                          value={sub.topic}
                          onChange={(e) =>
                            setSubscription(i, { topic: e.target.value })
                          }
                          placeholder="topic/filter/#"
                          // variant="outline"
                          className="flex-1"
                          // classNames={{ inputWrapper: inputCls }}
                        />
                      </TextField>

                      <Select
                        // selectedKeys={[String(sub.qos)]}
                        onChange={(value) =>
                          setSubscription(i, { qos: Number(value) })
                        }
                        // size="sm"
                        // variant="outline"
                        className="w-[90px] shrink-0"
                        // classNames={{
                        //   trigger: inputCls,
                        //   value: "text-[#cccccc]",
                        // }}
                        aria-label="QoS"
                      >
                        <Label>QoS</Label>
                        <Select.Trigger>
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            <ListBox.Item key="0">QoS 0</ListBox.Item>
                            <ListBox.Item key="1">QoS 1</ListBox.Item>
                            <ListBox.Item key="2">QoS 2</ListBox.Item>
                          </ListBox>
                        </Select.Popover>
                      </Select>

                      <Button
                        size="sm"
                        // variant="outline"
                        isIconOnly
                        onPress={() =>
                          patch({
                            subscriptions: config.subscriptions.filter(
                              (_, j) => j !== i,
                            ),
                          })
                        }
                        className="bg-[#2d2d2d] text-[#cccccc] h-8 w-8 min-w-0"
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    // variant="outline"
                    onPress={() =>
                      patch({
                        subscriptions: [
                          ...config.subscriptions,
                          { topic: "", qos: 0 },
                        ],
                      })
                    }
                    className="self-start bg-[#2d2d2d] text-[#cccccc]"
                  >
                    + Add subscription
                  </Button>
                </div>

                {/* TLS */}
                {isTls && (
                  <div className="border border-[#3c3c3c] rounded-lg p-3 flex flex-col gap-2">
                    <span className="text-[11px] text-[#969696]">TLS</span>
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
                      isSelected={config.tls?.allowInvalidCerts ?? false}
                      onChange={(v) =>
                        patch({
                          tls: { ...config.tls, allowInvalidCerts: v },
                        })
                      }
                      // size="sm"
                      // classNames={{ label: "text-[13px] text-[#cccccc]" }}
                    >
                      Allow invalid / self-signed certificates
                    </Checkbox>
                  </div>
                )}

                <Checkbox
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
                </Checkbox>
              </form>
            </Modal.Body>
            <Modal.Footer>
              <Button
                // variant="outline"
                onPress={onCancel}
                className="bg-[#2d2d2d] text-[#cccccc]"
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
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
    <div className="flex items-center gap-2">
      <span className="w-[130px] text-[12px] text-[#969696] shrink-0">
        {label}
      </span>
      <span
        className="flex-1 text-[12px] overflow-hidden text-ellipsis whitespace-nowrap text-[#cccccc]"
        title={value ?? undefined}
      >
        {value ? value.split(/[\\/]/).pop() : "(none)"}
      </span>
      <Button
        size="sm"
        // variant="outline"
        onPress={onPick}
        className="bg-[#2d2d2d] text-[#cccccc] shrink-0"
      >
        Browse…
      </Button>
      {value && (
        <Button
          size="sm"
          // variant="outline"
          isIconOnly
          onPress={onClear}
          className="bg-[#2d2d2d] text-[#cccccc] shrink-0"
        >
          ✕
        </Button>
      )}
    </div>
  );
}
