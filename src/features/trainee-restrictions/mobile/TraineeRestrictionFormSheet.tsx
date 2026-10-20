import RecordFormSheetFrame from "@/features/records/mobile/RecordFormSheetFrame";
import { useFormSheetSession } from "@/shells/mobile/useFormSheetSession";
import type { TraineeRestrictionRecordDto } from "@/types/trainee-restrictions.schema";
import TraineeRestrictionForm from "../form/TraineeRestrictionForm";
import { useTraineeRestrictionFormSession, type TraineeRestrictionFormTarget } from "../form/useTraineeRestrictionFormSession";

interface TraineeRestrictionFormSheetProps {
  /** הטופס שהכתובת מבקשת. null = הטופס סגור */
  target: TraineeRestrictionFormTarget | null;
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
export default function TraineeRestrictionFormSheet({ target, ...dialogProps }: TraineeRestrictionFormSheetProps) {
  const session = useFormSheetSession(target);

  return <TraineeRestrictionFormDialog key={session.key} isOpen={target !== null} target={session.target} {...dialogProps} />;
}

interface TraineeRestrictionFormDialogProps extends Omit<TraineeRestrictionFormSheetProps, "target"> {
  isOpen: boolean;
  target: TraineeRestrictionFormTarget | null;
}

function TraineeRestrictionFormDialog({ isOpen, onClose, ...sessionOptions }: TraineeRestrictionFormDialogProps) {
  const formSession = useTraineeRestrictionFormSession(sessionOptions);

  return (
    <RecordFormSheetFrame isOpen={isOpen} session={formSession} onClose={onClose}>
      <TraineeRestrictionForm {...formSession.formProps} />
    </RecordFormSheetFrame>
  );
}
