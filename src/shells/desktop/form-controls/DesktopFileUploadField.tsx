import { IpsFileUpload } from "ui-library";
import type { FileUploadFieldProps } from "@/shared/components/form/formControls";

/**
 * צירוף קובץ בדסקטופ: IpsFileUpload כמו שהיה, קובץ אחד. הפקד מעלה רק אחרי "שמור קבצים" שלו,
 * ולכן מעליו הסבר קצר (pending-decisions › Forms – two-step upload)
 */
export default function DesktopFileUploadField({
  sviva,
  system,
  camera,
  saveFilesHint,
  onBeforeSave,
  onSaveSuccess,
  onSaveError,
}: FileUploadFieldProps) {
  return (
    <>
      <p className="mb-2 text-xs text-text-muted">{saveFilesHint}</p>
      <IpsFileUpload
        sviva={sviva}
        system={system}
        multiple={false}
        camera={camera}
        onBeforeSave={onBeforeSave}
        onSaveSuccess={onSaveSuccess}
        onSaveError={onSaveError}
      />
    </>
  );
}
