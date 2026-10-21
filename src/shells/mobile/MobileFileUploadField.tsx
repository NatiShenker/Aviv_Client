import { IpsFileUploadMobile } from "ui-library";
import type { FileUploadFieldProps } from "@/shared/components/form/formControls";

/**
 * צירוף קובץ במובייל: IpsFileUploadMobile - שדה שמעלה מיד את הקובץ שנבחר, באותו מנגנון כמו IpsFileUpload.
 * ההסבר על "שמור קבצים" שייך לתהליך הדו-שלבי של הדסקטופ, ולכן לא מוצג כאן
 */
export default function MobileFileUploadField({ saveFilesHint: _desktopOnlyHint, ...uploadProps }: FileUploadFieldProps) {
  return <IpsFileUploadMobile {...uploadProps} />;
}
