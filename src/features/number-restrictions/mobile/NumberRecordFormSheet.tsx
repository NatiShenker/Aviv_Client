import FormFooter from "@/features/records/form/FormFooter";
import FormSheet from "@/shells/mobile/FormSheet";
import { useFormSheetSession } from "@/shells/mobile/useFormSheetSession";
import type { TraineePhoneRecordDto } from "@/types/phone-exceptions.schema";
import NumberRecordForm from "../form/NumberRecordForm";
import { useNumberRecordFormSession, type NumberRecordFormTarget } from "../form/useNumberRecordFormSession";
import RestrictionOptionCards from "./RestrictionOptionCards";

interface NumberRecordFormSheetProps {
  /** הטופס שהכתובת מבקשת. null = הטופס סגור */
  target: NumberRecordFormTarget | null;
  traineeId: number;
  /** בעריכה: הרשומה מתוך ההיסטוריה שנטענה (הטופס נפתח לעריכה רק כשהיא קיימת ופעילה) */
  editRecord: TraineePhoneRecordDto | null;
  /** ביצירה על בסיס רשומה שהסתיימה: הרשומה שהערכים נלקחים ממנה */
  basedOnRecord: TraineePhoneRecordDto | null;
  onClose: () => void;
  onSaved: (savedRecordKey: string) => void;
}

/**
 * טופס ההגבלה / ההיתר במסך מלא מעל ההיסטוריה. נפתח ונסגר לפי הכתובת, ולכן גם "חזרה" בדפדפן סוגרת אותו.
 * כל פתיחה מתחילה טופס נקי; בסגירה התוכן נשאר עד סוף האנימציה.
 */
export default function NumberRecordFormSheet({ target, ...dialogProps }: NumberRecordFormSheetProps) {
  const session = useFormSheetSession(target);

  return <NumberRecordFormDialog key={session.key} isOpen={target !== null} target={session.target} {...dialogProps} />;
}

interface NumberRecordFormDialogProps extends Omit<NumberRecordFormSheetProps, "target"> {
  isOpen: boolean;
  target: NumberRecordFormTarget | null;
}

function NumberRecordFormDialog({ isOpen, onClose, ...sessionOptions }: NumberRecordFormDialogProps) {
  const formSession = useNumberRecordFormSession(sessionOptions);

  return (
    <FormSheet
      open={isOpen}
      title={formSession.title}
      onClose={onClose}
      actions={<FormFooter {...formSession.saveProps} onCancel={onClose} buttonSize="large" />}
    >
      {/* במובייל בוחרים הגבלה בכפתור "בחירה" בכל כרטיס (ספק 04 form §3.2.1) */}
      <NumberRecordForm {...formSession.formProps} RestrictionOptionsList={RestrictionOptionCards} />
    </FormSheet>
  );
}
