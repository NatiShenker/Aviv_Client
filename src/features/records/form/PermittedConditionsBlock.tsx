import { useMemo } from "react";
import { IpsButton } from "ui-library";
import { buildDeviceOptions } from "@/features/institutes/organizationLogic";
import type { DeviceDto, WingDto } from "@/schemas/organization.schema";
import FormSection from "@/shared/components/form/FormSection";
import { useFormControls } from "@/shared/form-controls/FormControlsProvider";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import {
  buildDevicesSummary,
  buildHoursSummary,
  formatDevicesSelection,
  type CallConditionsValues,
  type CallRuleKind,
  type OpenConditions,
  type PermittedCondition,
} from "./callConditionsLogic";
import ConditionAccordion from "./ConditionAccordion";
import { FORM_TEXTS } from "./formTexts";

const TEXTS = FORM_TEXTS.conditions;

// הפניה קבועה, כדי שרשימה ריקה לא תיחשב "רשימה חדשה" בכל רינדור
const NO_DEVICES: DeviceDto[] = [];

interface PermittedConditionsBlockProps {
  title: string;
  hint: string;
  /** קובע את התקציר של שדה שלא הוגדר ("כל היום" / "לא הוגדרו") */
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
  hint,
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
    <FormSection title={title} hint={hint}>
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
        <p className="text-xs text-text-muted">{TEXTS.devicesHint}</p>
        <div className="mt-2">
          <DevicesSelect
            id={fieldIds.devices}
            devices={devices}
            wings={wings}
            selectedDeviceIds={values.deviceIds}
            onChange={onDeviceIdsChange}
            hasError={Boolean(errors.devices)}
          />
        </div>
      </ConditionAccordion>
    </FormSection>
  );
}

interface DevicesSelectProps {
  id: string;
  devices: AsyncResource<DeviceDto[]>;
  wings: WingDto[];
  selectedDeviceIds: number[];
  onChange: (deviceIds: number[]) => void;
  hasError: boolean;
}

/**
 * המכשירים מקובצים לפי אגף, כי בפנימייה יכולים להיות הרבה מכשירים. אין אפשרות "הכל" - בלי בחירה כל המכשירים מותרים.
 * כשרשימת המכשירים לא נטענה - השדה ריק, עם הודעה ו"נסה שוב" (ספק 03 form §7)
 */
function DevicesSelect({ id, devices, wings, selectedDeviceIds, onChange, hasError }: DevicesSelectProps) {
  const { MultiSelectField } = useFormControls();
  const hasFailed = devices.status === "error";
  const options = useMemo(() => buildDeviceOptions(devices.data ?? NO_DEVICES, wings), [devices.data, wings]);

  return (
    <div>
      <MultiSelectField
        id={id}
        label={TEXTS.pickDevice}
        options={options}
        value={selectedDeviceIds}
        onChange={(deviceIds) => onChange(deviceIds.map(Number))}
        formatSelection={formatDevicesSelection}
        error={hasError || hasFailed}
        helperText={hasFailed ? TEXTS.devicesLoadFailed : undefined}
      />
      {hasFailed && (
        <IpsButton variant="text" size="small" onClick={devices.reload}>
          {TEXTS.retry}
        </IpsButton>
      )}
    </div>
  );
}
