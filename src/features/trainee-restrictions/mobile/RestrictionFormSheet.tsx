import FormFooter from "@/features/records/form/FormFooter";
import FormSheet from "@/shells/mobile/FormSheet";
import { useFormSheetSession } from "@/shells/mobile/useFormSheetSession";
import type { TraineeRestrictionRecordDto } from "@/types/trainee-restrictions.schema";
import RestrictionForm from "../form/RestrictionForm";
import { useRestrictionFormSession, type RestrictionFormTarget } from "../form/useRestrictionFormSession";

interface RestrictionFormSheetProps {
  /** הטופס שהכתובת מבקשת. null = הטופס סגור */
  target: RestrictionFormTarget | null;
  traineeId: number;
  /** בעריכה: הרשומה מתוך ההיסטוריה שנטענה (הטופס נפתח לעריכה רק כשהיא קיימת ופעילה) */
  editRecord: TraineeRestrictionRecordDto | null;
  /** ביצירה על בסיס רשומה שהסתיימה: הרשומה שהערכים נלקחים ממנה */
  basedOnRecord: TraineeRestrictionRecordDto | null;
  onClose: () => void;
  onSaved: (savedRecordId: number) => void;
}

/**
 * טופס ההגבלה במסך מלא מעל ההיסטוריה. נפתח ונסגר לפי הכתובת, ולכן גם "חזרה" בדפדפן סוגרת אותו.
 * כל פתיחה מתחילה טופס נקי; בסגירה התוכן נשאר עד סוף האנימציה.
 */
export default function RestrictionFormSheet({ target, ...dialogProps }: RestrictionFormSheetProps) {
  const session = useFormSheetSession(target);

  return <RestrictionFormDialog key={session.key} isOpen={target !== null} target={session.target} {...dialogProps} />;
}

interface RestrictionFormDialogProps extends Omit<RestrictionFormSheetProps, "target"> {
  isOpen: boolean;
  target: RestrictionFormTarget | null;
}

function RestrictionFormDialog({ isOpen, onClose, ...sessionOptions }: RestrictionFormDialogProps) {
  const formSession = useRestrictionFormSession(sessionOptions);

  return (
    <FormSheet
      open={isOpen}
      title={formSession.title}
      onClose={onClose}
      actions={<FormFooter {...formSession.saveProps} onCancel={onClose} buttonSize="large" />}
    >
      <RestrictionForm {...formSession.formProps} />
    </FormSheet>
  );
}
