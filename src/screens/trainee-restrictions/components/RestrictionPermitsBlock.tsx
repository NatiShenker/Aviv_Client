import { IpsButton, IpsMultiSelectMobile, IpsTimePickerMobile, type IpsMultiSelectMobileValue } from "ui-library";
import type { DeviceDto } from "@/schemas/organization.schema";
import ConditionAccordion from "@/shared/components/form/ConditionAccordion";
import FormSection from "@/shared/components/form/FormSection";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import {
  RESTRICTION_FIELD_IDS,
  buildDevicesSummary,
  buildHoursSummary,
  formatDevicesSelection,
} from "../restrictionFormLogic";
import { TRAINEE_RESTRICTIONS_TEXTS } from "../traineeRestrictionsTexts";
import type { RestrictionForm } from "../useRestrictionForm";

const TEXTS = TRAINEE_RESTRICTIONS_TEXTS.form.permitsBlock;

// הפניה קבועה, כדי שרשימה ריקה לא תיחשב "רשימה חדשה" בכל רינדור
const NO_DEVICES: DeviceDto[] = [];

interface RestrictionPermitsBlockProps {
  form: RestrictionForm;
  devices: AsyncResource<DeviceDto[]>;
}

/** בלוק 2 - "היתרים להגבלה": שעות ומכשירים שבהם מותר לשוחח (ספק 03 form §3.3) */
export default function RestrictionPermitsBlock({ form, devices }: RestrictionPermitsBlockProps) {
  const { values, errors, openConditions } = form;
  const deviceList = devices.data ?? NO_DEVICES;
  const hoursSummary = buildHoursSummary(values);

  return (
    <FormSection title={TEXTS.title} hint={TEXTS.hint[values.limitKind]}>
      <ConditionAccordion
        title={TEXTS.hoursTitle}
        summary={hoursSummary.isTimeRange ? <span dir="ltr">{hoursSummary.text}</span> : hoursSummary.text}
        isOpen={openConditions.hours}
        onToggle={() => form.toggleCondition("hours")}
        error={errors.hours}
      >
        <p className="text-xs text-text-muted">{TEXTS.hoursHint}</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <IpsTimePickerMobile
            id={RESTRICTION_FIELD_IDS.hours}
            label={TEXTS.startTime}
            aria-label={TEXTS.startTime}
            placeholder={TEXTS.timePlaceholder}
            clearButtonLabel={TEXTS.clearStartTime}
            value={values.startTime}
            error={Boolean(errors.hours)}
            onChange={form.changeStartTime}
          />
          <IpsTimePickerMobile
            label={TEXTS.endTime}
            aria-label={TEXTS.endTime}
            placeholder={TEXTS.timePlaceholder}
            clearButtonLabel={TEXTS.clearEndTime}
            value={values.endTime}
            error={Boolean(errors.hours)}
            onChange={form.changeEndTime}
          />
        </div>
      </ConditionAccordion>

      <ConditionAccordion
        title={TEXTS.devicesTitle}
        summary={buildDevicesSummary(values, deviceList)}
        isOpen={openConditions.devices}
        onToggle={() => form.toggleCondition("devices")}
        error={errors.devices}
      >
        <p className="text-xs text-text-muted">{TEXTS.devicesHint}</p>
        <div className="mt-2">
          <DevicesSelect
            devices={devices}
            selectedDeviceIds={values.deviceIds}
            onChange={form.changeDeviceIds}
            hasError={Boolean(errors.devices)}
          />
        </div>
      </ConditionAccordion>
    </FormSection>
  );
}

interface DevicesSelectProps {
  devices: AsyncResource<DeviceDto[]>;
  selectedDeviceIds: number[];
  onChange: (deviceIds: number[]) => void;
  hasError: boolean;
}

// כשרשימת המכשירים לא נטענה - השדה ריק, עם הודעה ו"נסה שוב" (ספק 03 form §7)
function DevicesSelect({ devices, selectedDeviceIds, onChange, hasError }: DevicesSelectProps) {
  const hasFailed = devices.status === "error";
  const options = (devices.data ?? NO_DEVICES).map((device) => ({ value: device.id, label: device.name }));

  return (
    <div>
      <IpsMultiSelectMobile
        id={RESTRICTION_FIELD_IDS.devices}
        label={TEXTS.pickDevice}
        options={options}
        value={selectedDeviceIds}
        onChange={(deviceIds: IpsMultiSelectMobileValue[]) => onChange(deviceIds.map(Number))}
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
