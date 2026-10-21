import { IpsFileUpload } from "ui-library";
import type { FileUploadFieldProps } from "@/shared/components/form/formControls";
import { DESKTOP_FORM_CONTROLS_TEXTS } from "./desktopFormControlsTexts";

// רווח בין הכפתורים בכל זוג - כמו ברכיב עצמו
const BUTTONS_GAP_PX = 8;

// זוג כפתורים ברוחב שווה, לפי הארוך שבהם: עמודות שוות ברשת שרוחבה לפי התוכן
const EQUAL_WIDTH_BUTTONS = {
  gridAutoFlow: "column",
  gridAutoColumns: "1fr",
  gap: `${BUTTONS_GAP_PX}px`,
} as const;

/*
 * המראה של IpsFileUpload בדסקטופ (הוחלט 2026-10-21). הרכיב קיים בספרייה לפני אביב, ולכן ההתאמה כאן, דרך ה-class
 * היציבים שלו, והרכיב לא משתנה לצרכנים אחרים:
 * - הכפתורים שבתוך אזור הגרירה ("עיין בקבצים" / "מצלמה") ברוחב שווה, ממורכזים;
 * - הזוג שמתחת לאזור ("נקה הכל" / "שמור קבצים") ברוחב שווה, מיושר לקצה (שמאל) כמו כל זוג פעולות בטופס.
 *   הסדר - משני מימין, ראשי משמאל - בא מ-actionsOrder;
 * - משקל 400, כמו כל שאר הכפתורים באפליקציה (IpsButton)
 */
const FILE_UPLOAD_SX = {
  "& .ips-drop-zone-buttons": { display: "inline-grid", ...EQUAL_WIDTH_BUTTONS },
  // flex-end בעמודה מימין לשמאל = הקצה השמאלי
  "& .ips-file-upload-actions": { display: "grid", alignSelf: "flex-end", ...EQUAL_WIDTH_BUTTONS },
  "& .MuiButton-root": { fontWeight: 400 },
} as const;

/**
 * צירוף קובץ בדסקטופ: IpsFileUpload, קובץ אחד. הפקד מעלה רק אחרי "שמור קבצים" שלו,
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
        separatorLabel={DESKTOP_FORM_CONTROLS_TEXTS.fileUpload.separator}
        actionsOrder="clear-first"
        sx={FILE_UPLOAD_SX}
        onBeforeSave={onBeforeSave}
        onSaveSuccess={onSaveSuccess}
        onSaveError={onSaveError}
      />
    </>
  );
}
