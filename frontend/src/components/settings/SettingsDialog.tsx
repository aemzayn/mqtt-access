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
import { useSettingsStore } from "../../stores/settingsStore";
import { LANGUAGES, useT } from "../../i18n";
import type {
  FontSizeName,
  LanguageName,
  ThemeName,
} from "../../ipc/commands";

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const theme = useSettingsStore((s) => s.theme);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const blink = useSettingsStore((s) => s.blink);
  const language = useSettingsStore((s) => s.language);
  const update = useSettingsStore((s) => s.update);
  const t = useT();

  const themeOptions: { value: ThemeName; label: string }[] = [
    { value: "dark", label: t("themeDark") },
    { value: "light", label: t("themeLight") },
    { value: "dracula", label: t("themeDracula") },
    { value: "dark-contrast", label: t("themeDarkContrast") },
    { value: "light-contrast", label: t("themeLightContrast") },
  ];

  const fontOptions: { value: FontSizeName; label: string }[] = [
    { value: "small", label: t("fontSmall") },
    { value: "normal", label: t("fontNormal") },
    { value: "big", label: t("fontBig") },
  ];

  return (
    <Dialog
      isOpen
      title={t("settings")}
      onClose={onClose}
      className={`${Classes.DARK} settings-dialog`}
    >
      <DialogBody>
        <div className="form-grid">
          <FormGroup label={t("theme")} labelFor="settings-theme">
            <HTMLSelect
              id="settings-theme"
              fill
              value={theme}
              onChange={(e) => update({ theme: e.target.value as ThemeName })}
              options={themeOptions}
            />
          </FormGroup>

          <FormGroup label={t("language")} labelFor="settings-language">
            <HTMLSelect
              id="settings-language"
              fill
              value={language}
              onChange={(e) =>
                update({ language: e.target.value as LanguageName })
              }
              options={LANGUAGES}
            />
          </FormGroup>

          <RadioGroup
            label={t("fontSize")}
            inline
            selectedValue={fontSize}
            onChange={(e) =>
              update({ fontSize: e.currentTarget.value as FontSizeName })
            }
          >
            {fontOptions.map((size) => (
              <Radio key={size.value} label={size.label} value={size.value} />
            ))}
          </RadioGroup>

          <FormGroup label={t("topicTree")}>
            <Checkbox
              checked={blink}
              onChange={(e) => update({ blink: e.target.checked })}
            >
              {t("blinkOption")}
            </Checkbox>
          </FormGroup>
        </div>
      </DialogBody>
    </Dialog>
  );
}
