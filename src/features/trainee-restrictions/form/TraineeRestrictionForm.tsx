import CallDetailsBlock from "@/features/records/form/call-conditions/CallDetailsBlock";
import PermittedConditionsBlock from "@/features/records/form/call-conditions/PermittedConditionsBlock";
import DecisionBlock from "@/features/records/form/decision/DecisionBlock";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import type { LookupItem } from "@/types/common.schema";
import type { DeviceDto, WingDto } from "@/types/organization.schema";
import { TRAINEE_RESTRICTIONS_TEXTS } from "../traineeRestrictionsTexts";
import { RESTRICTION_FIELD_IDS } from "./traineeRestrictionFormLogic";
import type { TraineeRestrictionFormController } from "./useTraineeRestrictionForm";

/** כפתור השמירה נמצא בפוטר של הטופס, מחוץ ל-<form>, ומשויך אליו לפי המזהה */
export const TRAINEE_RESTRICTION_FORM_ID = "trainee-restriction-form";

const TEXTS = TRAINEE_RESTRICTIONS_TEXTS.form;
// כל הרשומות בטופס הזה הן הגבלות
const RULE_KIND = "restriction";

const DETAILS_FIELD_IDS = { dates: RESTRICTION_FIELD_IDS.dates, duration: RESTRICTION_FIELD_IDS.duration };
const CONDITIONS_FIELD_IDS = { hours: RESTRICTION_FIELD_IDS.hours, devices: RESTRICTION_FIELD_IDS.devices };
const DECISION_FIELD_IDS = {
  reason: RESTRICTION_FIELD_IDS.reason,
  details: RESTRICTION_FIELD_IDS.details,
  approver: RESTRICTION_FIELD_IDS.approver,
  file: RESTRICTION_FIELD_IDS.file,
};

export interface TraineeRestrictionFormProps {
  form: TraineeRestrictionFormController;
  devices: AsyncResource<DeviceDto[]>;
  /** אגפי הפנימייה - המכשירים מקובצים לפיהם */
  wings: WingDto[];
  reasons: AsyncResource<LookupItem<number>[]>;
}

/** שלושת הבלוקים של טופס ההגבלה, מופרדים בקו (ספק 03 form §3) */
export default function TraineeRestrictionForm({ form, devices, wings, reasons }: TraineeRestrictionFormProps) {
  const { values, errors } = form;

  return (
    <form id={TRAINEE_RESTRICTION_FORM_ID} noValidate onSubmit={form.submit} className="divide-y divide-divider">
      <CallDetailsBlock
        title={TEXTS.detailsBlock.title}
        dateRangeDescription={TEXTS.detailsBlock.dateRangeDescription}
        ruleKind={RULE_KIND}
        values={values}
        touchedDates={form.touchedDates}
        errors={{ dates: errors.dates, duration: errors.duration }}
        fieldIds={DETAILS_FIELD_IDS}
        onStartDateChange={form.changeStartDate}
        onEndDateChange={form.changeEndDate}
        onLimitKindChange={form.changeLimitKind}
        onDurationTextChange={form.changeDurationText}
      />
      <PermittedConditionsBlock
        title={TEXTS.permitsBlock.title}
        hint={TEXTS.permitsBlock.hint[values.limitKind]}
        ruleKind={RULE_KIND}
        values={values}
        errors={{ hours: errors.hours, devices: errors.devices }}
        openConditions={form.openConditions}
        onToggleCondition={form.toggleCondition}
        devices={devices}
        wings={wings}
        fieldIds={CONDITIONS_FIELD_IDS}
        onStartTimeChange={form.changeStartTime}
        onEndTimeChange={form.changeEndTime}
        onDeviceIdsChange={form.changeDeviceIds}
      />
      <DecisionBlock
        values={{
          reasonId: values.reasonId,
          details: values.details,
          approver: values.approver,
          approvedFile: values.approvedFile,
        }}
        errors={{ reason: errors.reason, details: errors.details, approver: errors.approver, file: errors.file }}
        reasons={reasons}
        fieldIds={DECISION_FIELD_IDS}
        onChange={form.changeDecision}
        onFileUploadingChange={form.setIsFileUploading}
      />
    </form>
  );
}
