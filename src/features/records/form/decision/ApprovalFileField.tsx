import { useEffect, useId, useState } from "react";
import { IpsIconButton, type UploadResult } from "ui-library";
import { SHAREPOINT_UPLOAD_TARGET } from "@/config/appConstants";
import { registerApprovedFile } from "@/services/approvedFilesService";
import AppIcon from "@/shared/components/AppIcon";
import ErrorText from "@/shared/components/form/ErrorText";
import FieldLabelText from "@/shared/components/form/FieldLabelText";
import { useFormControls } from "@/shared/components/form/FormControlsProvider";
import { EXPANDED_TOUCH_TARGET_SX } from "@/shared/components/touchTarget";
import type { FileAttachmentRef } from "@/types/common.schema";
import { FORM_TEXTS } from "../formTexts";

const TEXTS = FORM_TEXTS.decision;

interface ApprovalFileFieldProps {
  /** מזהה האזור, כדי שאפשר יהיה להעביר אליו פוקוס כשיש בו שגיאה */
  id: string;
  value: FileAttachmentRef | null;
  onChange: (file: FileAttachmentRef | null) => void;
  error?: string;
  /** מדווח כשהעלאה מתחילה ומסתיימת, כדי שהשמירה תחכה לה */
  onUploadingChange: (isUploading: boolean) => void;
}

/**
 * "צירוף קובץ" (חובה): בלי קובץ - פקד ההעלאה של הפריסה (במובייל מעלה מיד, בדסקטופ אחרי "שמור קבצים"),
 * שמעלה ל-SharePoint. אחרי ההעלאה הקובץ נרשם בסרביס (כדי לקבל את המזהה שלו), ובמקום הפקד מוצגת שורת הקובץ עם X.
 */
export default function ApprovalFileField({ id, value, onChange, error, onUploadingChange }: ApprovalFileFieldProps) {
  const { FileUploadField } = useFormControls();
  const labelId = useId();
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

  const handleUploadSuccess = async (uploadedFiles: UploadResult[]) => {
    const [uploadedFile] = uploadedFiles;
    if (!uploadedFile) {
      setIsUploading(false);
      return;
    }
    try {
      onChange(await registerApprovedFile({ fileName: uploadedFile.name, path: uploadedFile.path }));
    } catch {
      setUploadError(FORM_TEXTS.validation.fileUploadFailed);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadError = () => {
    setUploadError(FORM_TEXTS.validation.fileUploadFailed);
    setIsUploading(false);
  };

  return (
    // tabIndex -1: הטופס מעביר לכאן פוקוס כשחסר קובץ
    <div id={id} tabIndex={-1} role="group" aria-labelledby={labelId} className="outline-none">
      <FieldLabelText id={labelId} text={TEXTS.fileLabel} isRequired />

      {value ? (
        <AttachedFile fileName={value.fileName} onRemove={() => onChange(null)} />
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
  onRemove: () => void;
}

function AttachedFile({ fileName, onRemove }: AttachedFileProps) {
  return (
    <div className="flex h-11 items-center gap-2 rounded-input border border-grey-300 bg-paper ps-3">
      <AppIcon name="file" className="shrink-0 text-text-muted" />
      <span className="min-w-0 flex-1 truncate text-base text-text-primary">{fileName}</span>
      <IpsIconButton
        icon={<AppIcon name="close" />}
        aria-label={TEXTS.removeFile}
        onClick={onRemove}
        sx={EXPANDED_TOUCH_TARGET_SX}
      />
    </div>
  );
}
