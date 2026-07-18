import {
  Checkbox,
  Classes,
  Dialog,
  DialogBody,
  FormGroup,
  HTMLSelect,
  Radio,
  RadioGroup,
} from "@blueprintjs/core";
import {
  FONT_SIZES,
  THEMES,
  useSettingsStore,
} from "../../stores/settingsStore";
import type { FontSizeName, ThemeName } from "../../ipc/commands";

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const theme = useSettingsStore((s) => s.theme);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const blink = useSettingsStore((s) => s.blink);
  const update = useSettingsStore((s) => s.update);

  return (
    <Dialog
      isOpen
      title="Settings"
      onClose={onClose}
      className={`${Classes.DARK} settings-dialog`}
    >
      <DialogBody>
        <div className="form-grid">
          <FormGroup label="Theme" labelFor="settings-theme">
            <HTMLSelect
              id="settings-theme"
              fill
              value={theme}
              onChange={(e) => update({ theme: e.target.value as ThemeName })}
              options={THEMES}
            />
          </FormGroup>

          <RadioGroup
            label="Font size"
            inline
            selectedValue={fontSize}
            onChange={(e) =>
              update({ fontSize: e.currentTarget.value as FontSizeName })
            }
          >
            {FONT_SIZES.map((size) => (
              <Radio key={size.value} label={size.label} value={size.value} />
            ))}
          </RadioGroup>

          <FormGroup label="Topic tree">
            <Checkbox
              checked={blink}
              onChange={(e) => update({ blink: e.target.checked })}
            >
              Blink topics on activity
            </Checkbox>
          </FormGroup>
        </div>
      </DialogBody>
    </Dialog>
  );
}
