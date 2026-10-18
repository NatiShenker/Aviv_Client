import { IpsButton, IpsSelectMobile, IpsTextAreaMobile } from "ui-library";
import type { ApproverRef, FileAttachmentRef, LookupItem } from "@/schemas/common.schema";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import ApprovalFileField from "./ApprovalFileField";
import ApproverField from "./ApproverField";
import FormSection from "./FormSection";
import { FORM_TEXTS } from "./formTexts";

const TEXTS = FORM_TEXTS.decision;

/** ערכי בלוק "סיבות והחלטה" - זהים בכל הטפסים, חוץ מרשימת הסיבות */
export interface DecisionValues {
  reasonId: number | null;
  details: string;
  approver: ApproverRef | null;
  approvedFile: FileAttachmentRef | null;
}

export interface DecisionErrors {
  reason?: string;
  approver?: string;
  file?: string;
}

/** מזהי השדות, כדי שהטופס יוכל להעביר פוקוס לשדה הראשון עם שגיאה */
export interface DecisionFieldIds {
  reason: string;
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

/** הבלוק האחרון בכל טופס: סיבה, פירוט, גורם מאשר וצירוף קובץ (ספק 00 §4.3) */
export default function DecisionBlock({
  values,
  errors,
  reasons,
  fieldIds,
  onChange,
  onFileUploadingChange,
}: DecisionBlockProps) {
  const reasonOptions = (reasons.data ?? []).map((reason) => ({ value: reason.id, label: reason.name }));
  const hasReasonsFailed = reasons.status === "error";

  return (
    <FormSection title={TEXTS.title}>
      <div className="flex flex-col gap-2">
        <div>
          <IpsSelectMobile
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

        <IpsTextAreaMobile
          label={TEXTS.detailsLabel}
          placeholder={TEXTS.detailsPlaceholder}
          value={values.details}
          onChange={(details) => onChange({ details })}
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
