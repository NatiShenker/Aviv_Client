import { useEffect, useId, useState } from "react";
import { IpsIconButton, type UploadResult } from "ui-library";
import { SHAREPOINT_UPLOAD_TARGET } from "@/config/appConstants";
import AppIcon from "@/shared/components/AppIcon";
import ErrorText from "@/shared/components/form/ErrorText";
import FieldLabelText from "@/shared/components/form/FieldLabelText";
import { useFormControls } from "@/shared/components/form/FormControlsProvider";
import { EXPANDED_TOUCH_TARGET_SX } from "@/shared/components/touchTarget";
import type { ApprovedFileInput } from "@/types/common.schema";
import { focusInPlace } from "@/utils/dom";
import { FORM_TEXTS } from "../formTexts";

const TEXTS = FORM_TEXTS.decision;

interface ApprovalFileFieldProps {
  /** מזהה האזור, כדי שאפשר יהיה להעביר אליו פוקוס כשיש בו שגיאה */
  id: string;
  value: ApprovedFileInput | null;
  onChange: (file: ApprovedFileInput | null) => void;
  error?: string;
  /** מדווח כשהעלאה מתחילה ומסתיימת, כדי שהשמירה תחכה לה */
  onUploadingChange: (isUploading: boolean) => void;
}

/**
 * "צירוף קובץ" (חובה): בלי קובץ - פקד ההעלאה של הפריסה (במובייל מעלה מיד, בדסקטופ אחרי "שמור קבצים"),
 * שמעלה ל-SharePoint. הנתיב שחזר מההעלאה נשלח בשמירה, והשרת מכניס ממנו את שורת הקובץ (D-13) - אין רישום נפרד.
 * אחרי ההעלאה מוצגת במקום הפקד שורת הקובץ עם X.
 */
export default function ApprovalFileField({ id, value, onChange, error, onUploadingChange }: ApprovalFileFieldProps) {
  const { FileUploadField } = useFormControls();
  const labelId = useId();
  const removeButtonId = useId();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | undefined>(undefined);
  const shownError = uploadError ?? error;

  useEffect(() => {
    onUploadingChange(isUploading);
  }, [isUploading, onUploadingChange]);

  // נקרא רגע לפני שהפקד מתחיל להעלות
  const handleUploadStart = async () => {
    setIsUploading(true);
    setUploadError(undefined);
    return true;
  };

  const handleUploadSuccess = (uploadedFiles: UploadResult[]) => {
    const [uploadedFile] = uploadedFiles;
    if (uploadedFile) {
      onChange({ fileName: uploadedFile.name, textFile: uploadedFile.path });
      // פקד ההעלאה מתחלף בשורת הקובץ - הפוקוס עובר להסרה, ולא נופל לתחילת הטופס
      focusInPlace(removeButtonId);
    }
    setIsUploading(false);
  };

  const handleUploadError = () => {
    setUploadError(FORM_TEXTS.validation.fileUploadFailed);
    setIsUploading(false);
  };

  // שורת הקובץ מתחלפת בפקד ההעלאה - הפוקוס עובר לאזור השדה, שקורא מסך משמיע את שמו
  const removeFile = () => {
    onChange(null);
    focusInPlace(id);
  };

  return (
    // tabIndex -1: הטופס מעביר לכאן פוקוס כשחסר קובץ
    <div id={id} tabIndex={-1} role="group" aria-labelledby={labelId} className="outline-none">
      <FieldLabelText id={labelId} text={TEXTS.fileLabel} isRequired />

      {value ? (
        <AttachedFile fileName={value.fileName} removeButtonId={removeButtonId} onRemove={removeFile} />
      ) : (
        <FileUploadField
          sviva={SHAREPOINT_UPLOAD_TARGET.environment}
          system={SHAREPOINT_UPLOAD_TARGET.site}
          camera
          error={Boolean(shownError)}
          placeholder={TEXTS.filePlaceholder}
          uploadingText={TEXTS.fileUploading}
          cameraButtonLabel={TEXTS.fileCamera}
          saveFilesHint={TEXTS.fileHint}
          onBeforeSave={handleUploadStart}
          onSaveSuccess={handleUploadSuccess}
          onSaveError={handleUploadError}
        />
      )}

      <ErrorText message={shownError} />
    </div>
  );
}

interface AttachedFileProps {
  fileName: string;
  removeButtonId: string;
  onRemove: () => void;
}

function AttachedFile({ fileName, removeButtonId, onRemove }: AttachedFileProps) {
  return (
    <div className="flex h-11 items-center gap-2 rounded-input border border-grey-300 bg-paper ps-3">
      <AppIcon name="file" className="shrink-0 text-text-muted" />
      {/* שם ארוך נחתך - המלא בריחוף */}
      <span title={fileName} className="min-w-0 flex-1 truncate text-base text-text-primary">
        {fileName}
      </span>
      <IpsIconButton
        id={removeButtonId}
        icon={<AppIcon name="close" />}
        aria-label={TEXTS.removeFile}
        onClick={onRemove}
        sx={EXPANDED_TOUCH_TARGET_SX}
      />
    </div>
  );
}
