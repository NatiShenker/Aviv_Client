import type { ReactNode } from "react";
import DrawerFormLayer from "@/shells/desktop/drawer/DrawerFormLayer";
import { useReportUnsavedChanges } from "@/shells/desktop/drawer/unsavedChanges";
import FormFooter from "../form/FormFooter";
import type { RecordFormSession } from "../form/recordFormSession";

interface DrawerRecordFormFrameProps {
  /** הטופס שנפתח: הכותרת, מצב השמירה והשינויים. גוף הטופס מגיע כ-children */
  session: RecordFormSession<unknown>;
  onClose: () => void;
  children: ReactNode;
}

/**
 * המסגרת של טופס רשומה במגירה: שכבה מעל ההיסטוריה עם פוטר בגודל הרגיל.
 * כאן הטופס מדווח על שינויים שלא נשמרו, כדי שסגירת המגירה תשאל קודם (ספק 02 §8.6) - כך אף טופס לא ישכח לדווח
 */
export default function DrawerRecordFormFrame({ session, onClose, children }: DrawerRecordFormFrameProps) {
  useReportUnsavedChanges(session.hasUserChanges);

  return (
    <DrawerFormLayer
      title={session.title}
      onClose={onClose}
      footer={<FormFooter {...session.saveProps} onCancel={onClose} buttonSize="medium" />}
    >
      {children}
    </DrawerFormLayer>
  );
}
