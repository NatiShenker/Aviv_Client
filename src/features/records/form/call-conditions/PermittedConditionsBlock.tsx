import { useMemo } from "react";
import { IpsButton } from "ui-library";
import { buildDeviceOptions } from "@/features/institutes/organizationLogic";
import { useFormControls } from "@/shared/components/form/FormControlsProvider";
import FormSection from "@/shared/components/form/FormSection";
import { EXPANDED_TOUCH_TARGET_SX } from "@/shared/components/touchTarget";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import type { DeviceDto, WingDto } from "@/types/organization.schema";
import { FORM_TEXTS } from "../formTexts";
import {
  buildDevicesSummary,
  buildHoursSummary,
  buildUnsetDevicesText,
  formatDevicesSelection,
  type CallConditionsValues,
  type CallRuleKind,
  type OpenConditions,
  type PermittedCondition,
} from "./callConditionsLogic";
import ConditionAccordion from "./ConditionAccordion";

const TEXTS = FORM_TEXTS.conditions;

// הפניה קבועה, כדי שרשימה ריקה לא תיחשב "רשימה חדשה" בכל רינדור
const NO_DEVICES: DeviceDto[] = [];

interface PermittedConditionsBlockProps {
  title: string;
  /** קובע את הטקסט של שדה שלא הוגדר ("כל היום" / "לא הוגדרו") */
  ruleKind: CallRuleKind;
  values: CallConditionsValues;
  errors: { hours?: string; devices?: string };
  openConditions: OpenConditions;
  onToggleCondition: (condition: PermittedCondition) => void;
  devices: AsyncResource<DeviceDto[]>;
  /** אגפי הפנימייה - המכשירים מקובצים לפיהם */
  wings: WingDto[];
  /** מזהי השדות, כדי שהטופס יוכל להעביר פוקוס לשדה עם שגיאה */
  fieldIds: { hours: string; devices: string };
  onStartTimeChange: (startTime: string) => void;
  onEndTimeChange: (endTime: string) => void;
  onDeviceIdsChange: (deviceIds: number[]) => void;
}

/** בלוק השעות והמכשירים שבהם מותר לשוחח (ספק 03 form §3.3, ספק 04 form §3.5) */
export default function PermittedConditionsBlock({
  title,
  ruleKind,
  values,
  errors,
  openConditions,
  onToggleCondition,
  devices,
  wings,
  fieldIds,
  onStartTimeChange,
  onEndTimeChange,
  onDeviceIdsChange,
}: PermittedConditionsBlockProps) {
  const { TimeField } = useFormControls();
  const deviceList = devices.data ?? NO_DEVICES;
  const hoursSummary = buildHoursSummary(values, ruleKind);

  return (
    <FormSection title={title}>
      <ConditionAccordion
        title={TEXTS.hoursTitle}
        summary={hoursSummary.isTimeRange ? <span dir="ltr">{hoursSummary.text}</span> : hoursSummary.text}
        isOpen={openConditions.hours}
        onToggle={() => onToggleCondition("hours")}
        error={errors.hours}
      >
        <p className="text-xs text-text-muted">{TEXTS.hoursHint}</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <TimeField
            id={fieldIds.hours}
            label={TEXTS.startTime}
            aria-label={TEXTS.startTime}
            placeholder={TEXTS.timePlaceholder}
            clearButtonLabel={TEXTS.clearStartTime}
            value={values.startTime}
            error={Boolean(errors.hours)}
            onChange={onStartTimeChange}
          />
          <TimeField
            label={TEXTS.endTime}
            aria-label={TEXTS.endTime}
            placeholder={TEXTS.timePlaceholder}
            clearButtonLabel={TEXTS.clearEndTime}
            value={values.endTime}
            error={Boolean(errors.hours)}
            onChange={onEndTimeChange}
          />
        </div>
      </ConditionAccordion>

      <ConditionAccordion
        title={TEXTS.devicesTitle}
        summary={buildDevicesSummary(values, deviceList, ruleKind)}
        isOpen={openConditions.devices}
        onToggle={() => onToggleCondition("devices")}
        error={errors.devices}
      >
        <DevicesSelect
          id={fieldIds.devices}
          devices={devices}
          wings={wings}
          selectedDeviceIds={values.deviceIds}
          unsetDevicesText={buildUnsetDevicesText(values, ruleKind)}
          onChange={onDeviceIdsChange}
          hasError={Boolean(errors.devices)}
        />
      </ConditionAccordion>
    </FormSection>
  );
}

interface DevicesSelectProps {
  id: string;
  devices: AsyncResource<DeviceDto[]>;
  wings: WingDto[];
  selectedDeviceIds: number[];
  /** הטקסט בשדה כשאין מכשיר נבחר - אותו טקסט כמו בתקציר */
  unsetDevicesText: string;
  onChange: (deviceIds: number[]) => void;
  hasError: boolean;
}

/**
 * המכשירים מקובצים לפי אגף, כי בפנימייה יכולים להיות הרבה מכשירים. אין אפשרות "הכל": בלי בחירה השדה מציג
 * את הכלל "פתוחה כברירת מחדל", כמו התקציר - "כל המכשירים", או "לא הוגדרו" כשהכל חסום.
 * כשרשימת המכשירים לא נטענה - הודעה ו"טעינה מחדש" (ספק 03 form §7)
 */
function DevicesSelect({
  id,
  devices,
  wings,
  selectedDeviceIds,
  unsetDevicesText,
  onChange,
  hasError,
}: DevicesSelectProps) {
  const { MultiSelectField } = useFormControls();
  const hasFailed = devices.status === "error";
  const options = useMemo(() => buildDeviceOptions(devices.data ?? NO_DEVICES, wings), [devices.data, wings]);
  // כשנבחרו מכשירים אבל הרשימה עוד לא נטענה (או נכשלה), אין שמות להציג - השדה נשאר ריק ולא מציג את הכלל בטעות
  const placeholder = selectedDeviceIds.length === 0 ? unsetDevicesText : undefined;

  return (
    <div>
      <MultiSelectField
        id={id}
        label={TEXTS.pickDevice}
        placeholder={placeholder}
        options={options}
        value={selectedDeviceIds}
        onChange={(deviceIds) => onChange(deviceIds.map(Number))}
        formatSelection={formatDevicesSelection}
        error={hasError || hasFailed}
        helperText={hasFailed ? TEXTS.devicesLoadFailed : undefined}
      />
      {hasFailed && (
        <IpsButton variant="text" size="small" sx={EXPANDED_TOUCH_TARGET_SX} onClick={devices.reload}>
          {TEXTS.retry}
        </IpsButton>
      )}
    </div>
  );
}
