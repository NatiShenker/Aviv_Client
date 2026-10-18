import type { LookupItem } from "@/schemas/common.schema";
import type { DeviceDto } from "@/schemas/organization.schema";
import DecisionBlock from "@/shared/components/form/DecisionBlock";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import { RESTRICTION_FIELD_IDS } from "../restrictionFormLogic";
import type { RestrictionForm as RestrictionFormState } from "../useRestrictionForm";
import RestrictionDetailsBlock from "./RestrictionDetailsBlock";
import RestrictionPermitsBlock from "./RestrictionPermitsBlock";

/** כפתור השמירה נמצא בפוטר של הטופס, מחוץ ל-<form>, ומשויך אליו לפי המזהה */
export const RESTRICTION_FORM_ID = "trainee-restriction-form";

const DECISION_FIELD_IDS = {
  reason: RESTRICTION_FIELD_IDS.reason,
  approver: RESTRICTION_FIELD_IDS.approver,
  file: RESTRICTION_FIELD_IDS.file,
};

interface RestrictionFormProps {
  form: RestrictionFormState;
  devices: AsyncResource<DeviceDto[]>;
  reasons: AsyncResource<LookupItem<number>[]>;
}

/** שלושת הבלוקים של טופס ההגבלה, מופרדים בקו (ספק 03 form §3) */
export default function RestrictionForm({ form, devices, reasons }: RestrictionFormProps) {
  const { values, errors } = form;

  return (
    <form id={RESTRICTION_FORM_ID} noValidate onSubmit={form.submit} className="divide-y divide-divider">
      <RestrictionDetailsBlock form={form} />
      <RestrictionPermitsBlock form={form} devices={devices} />
      <DecisionBlock
        values={{
          reasonId: values.reasonId,
          details: values.details,
          approver: values.approver,
          approvedFile: values.approvedFile,
        }}
        errors={{ reason: errors.reason, approver: errors.approver, file: errors.file }}
        reasons={reasons}
        fieldIds={DECISION_FIELD_IDS}
        onChange={form.changeDecision}
        onFileUploadingChange={form.setIsFileUploading}
      />
    </form>
  );
}
