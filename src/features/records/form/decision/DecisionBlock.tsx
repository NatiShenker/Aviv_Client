import { IpsButton } from "ui-library";
import { useFormControls } from "@/shared/components/form/FormControlsProvider";
import FormSection from "@/shared/components/form/FormSection";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import type { LookupItem } from "@/types/common.schema";
import { FORM_TEXTS } from "../formTexts";
import ApprovalFileField from "./ApprovalFileField";
import ApproverField from "./ApproverField";
import type { DecisionErrors, DecisionValues } from "./decisionLogic";

const TEXTS = FORM_TEXTS.decision;

/** מזהי השדות, כדי שהטופס יוכל להעביר פוקוס לשדה הראשון עם שגיאה */
export interface DecisionFieldIds {
  reason: string;
  details: string;
  approver: string;
  file: string;
}

interface DecisionBlockProps {
  values: DecisionValues;
  errors: DecisionErrors;
  reasons: AsyncResource<LookupItem<number>[]>;
  fieldIds: DecisionFieldIds;
  onChange: (update: Partial<DecisionValues>) => void;
  onFileUploadingChange: (isUploading: boolean) => void;
}

/** הבלוק האחרון בכל טופס: סיבה, פירוט, גורם מאשר וצירוף קובץ - כולם חובה (ספק 00 §4.3) */
export default function DecisionBlock({
  values,
  errors,
  reasons,
  fieldIds,
  onChange,
  onFileUploadingChange,
}: DecisionBlockProps) {
  const { SelectField, TextAreaField } = useFormControls();
  const reasonOptions = (reasons.data ?? []).map((reason) => ({ value: reason.id, label: reason.name }));
  const hasReasonsFailed = reasons.status === "error";

  return (
    <FormSection title={TEXTS.title}>
      <div className="flex flex-col gap-2">
        <div>
          <SelectField
            id={fieldIds.reason}
            label={TEXTS.reasonLabel}
            placeholder={TEXTS.reasonPlaceholder}
            required
            options={reasonOptions}
            value={values.reasonId}
            onChange={(reasonId) => onChange({ reasonId: Number(reasonId) })}
            error={Boolean(errors.reason) || hasReasonsFailed}
            helperText={hasReasonsFailed ? TEXTS.reasonsLoadFailed : errors.reason}
          />
          {hasReasonsFailed && (
            <IpsButton variant="text" size="small" onClick={reasons.reload}>
              {TEXTS.retry}
            </IpsButton>
          )}
        </div>

        {/* הפירוט חובה בכל הטפסים (ספק 00 §4.3) */}
        <TextAreaField
          id={fieldIds.details}
          label={TEXTS.detailsLabel}
          placeholder={TEXTS.detailsPlaceholder}
          required
          value={values.details}
          onChange={(details) => onChange({ details })}
          error={Boolean(errors.details)}
          helperText={errors.details}
        />

        <ApproverField
          id={fieldIds.approver}
          value={values.approver}
          onChange={(approver) => onChange({ approver })}
          error={errors.approver}
        />
      </div>

      <div className="mt-4">
        <ApprovalFileField
          id={fieldIds.file}
          value={values.approvedFile}
          onChange={(approvedFile) => onChange({ approvedFile })}
          error={errors.file}
          onUploadingChange={onFileUploadingChange}
        />
      </div>
    </FormSection>
  );
}
