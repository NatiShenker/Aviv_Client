import { useEffect, useId, useState } from "react";
import { IpsFileUpload, IpsIconButton, type UploadResult } from "ui-library";
import { SHAREPOINT_UPLOAD_TARGET } from "@/constants/appConstants";
import type { FileAttachmentRef } from "@/schemas/common.schema";
import { registerApprovedFile } from "@/services/approvedFilesService";
import AppIcon from "@/shared/icons/AppIcon";
import ErrorText from "./ErrorText";
import FieldLabelText from "./FieldLabelText";
import { FORM_TEXTS } from "./formTexts";

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
 * "צירוף קובץ" (חובה): בלי קובץ - IpsFileUpload, שמעלה ל-SharePoint אחרי לחיצה על "שמור קבצים".
 * אחרי ההעלאה הקובץ נרשם בסרביס (כדי לקבל את המזהה שלו), ובמקום הרכיב מוצגת שורת הקובץ עם X להסרה.
 */
export default function ApprovalFileField({ id, value, onChange, error, onUploadingChange }: ApprovalFileFieldProps) {
  const labelId = useId();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | undefined>(undefined);

  useEffect(() => {
    onUploadingChange(isUploading);
  }, [isUploading, onUploadingChange]);

  // נקרא רגע לפני שהרכיב מתחיל להעלות
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
        <>
          <p className="mb-2 text-xs text-text-muted">{TEXTS.fileHint}</p>
          <IpsFileUpload
            sviva={SHAREPOINT_UPLOAD_TARGET.environment}
            system={SHAREPOINT_UPLOAD_TARGET.site}
            multiple={false}
            camera
            onBeforeSave={handleUploadStart}
            onSaveSuccess={handleUploadSuccess}
            onSaveError={handleUploadError}
          />
        </>
      )}

      <ErrorText message={uploadError ?? error} />
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
      <IpsIconButton icon={<AppIcon name="close" />} aria-label={TEXTS.removeFile} onClick={onRemove} />
    </div>
  );
}
