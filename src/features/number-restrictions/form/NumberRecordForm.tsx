import CallDetailsBlock from "@/features/records/form/CallDetailsBlock";
import DecisionBlock from "@/features/records/form/DecisionBlock";
import PermittedConditionsBlock from "@/features/records/form/PermittedConditionsBlock";
import type { LookupItem } from "@/schemas/common.schema";
import type { DeviceDto, WingDto } from "@/schemas/organization.schema";
import type { TraineePhoneRecordDto } from "@/schemas/phone-exceptions.schema";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import { NUMBER_RESTRICTIONS_TEXTS } from "../numberRestrictionsTexts";
import ActionTypeBlock from "./ActionTypeBlock";
import LockedNumberCard from "./LockedNumberCard";
import { NUMBER_RECORD_FIELD_IDS, permitDateBounds, shouldShowDetailBlocks } from "./numberRecordFormLogic";
import type { NumberRecordFormController } from "./useNumberRecordForm";

/** כפתור השמירה נמצא בפוטר של הטופס, מחוץ ל-<form>, ומשויך אליו לפי המזהה */
export const NUMBER_RECORD_FORM_ID = "number-record-form";

const TEXTS = NUMBER_RESTRICTIONS_TEXTS.form;

const DETAILS_FIELD_IDS = { dates: NUMBER_RECORD_FIELD_IDS.dates, duration: NUMBER_RECORD_FIELD_IDS.duration };
const CONDITIONS_FIELD_IDS = { hours: NUMBER_RECORD_FIELD_IDS.hours, devices: NUMBER_RECORD_FIELD_IDS.devices };
const DECISION_FIELD_IDS = {
  reason: NUMBER_RECORD_FIELD_IDS.reason,
  details: NUMBER_RECORD_FIELD_IDS.details,
  approver: NUMBER_RECORD_FIELD_IDS.approver,
  file: NUMBER_RECORD_FIELD_IDS.file,
};

interface NumberRecordFormProps {
  form: NumberRecordFormController;
  /** בעריכה - הרשומה, לכרטיס המספר הנעול */
  editRecord: TraineePhoneRecordDto | null;
  devices: AsyncResource<DeviceDto[]>;
  /** אגפי הפנימייה - המכשירים מקובצים לפיהם */
  wings: WingDto[];
  reasons: AsyncResource<LookupItem<number>[]>;
}

/**
 * טופס ההגבלה / ההיתר (ספק 04 form §3): "סוג הפעולה" ביצירה או כרטיס המספר בעריכה, ואחריהם שלושה בלוקים.
 * הבלוקים מוסתרים (ולא מוסרים) כל עוד היתר מחכה לבחירת הגבלה, כדי שמה שכבר הוזן בהם - כולל קובץ
 * שמועלה - יישמר.
 */
export default function NumberRecordForm({ form, editRecord, devices, wings, reasons }: NumberRecordFormProps) {
  const { state } = form;
  const { values, errors, recordType } = state;
  const isPermit = recordType === "permit";
  const conditionsHint = isPermit
    ? TEXTS.conditionsBlock.permitHint
    : TEXTS.conditionsBlock.restrictionHint[values.limitKind];

  return (
    <form id={NUMBER_RECORD_FORM_ID} noValidate onSubmit={form.submit}>
      {editRecord ? <LockedNumberCard record={editRecord} /> : <ActionTypeBlock form={form} />}

      <div
        hidden={!shouldShowDetailBlocks(state)}
        className="divide-y divide-divider border-t border-divider motion-safe:animate-fade-in"
      >
        <CallDetailsBlock
          title={TEXTS.detailsBlock.title[recordType]}
          dateRangeDescription={TEXTS.detailsBlock.dateRangeDescription[recordType]}
          ruleKind={recordType}
          values={values}
          touchedDates={state.touchedDates}
          errors={{ dates: errors.dates, duration: errors.duration }}
          dateBounds={permitDateBounds(state)}
          fieldIds={DETAILS_FIELD_IDS}
          onStartDateChange={form.changeStartDate}
          onEndDateChange={form.changeEndDate}
          onLimitKindChange={form.changeLimitKind}
          onDurationTextChange={form.changeDurationText}
        />
        <PermittedConditionsBlock
          title={TEXTS.conditionsBlock.title[recordType]}
          hint={conditionsHint}
          ruleKind={recordType}
          values={values}
          errors={{ hours: errors.hours, devices: errors.devices }}
          openConditions={state.openConditions}
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
      </div>
    </form>
  );
}
