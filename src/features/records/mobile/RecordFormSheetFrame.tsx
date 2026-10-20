import type { ReactNode } from "react";
import { useRouteTraineeDisplayName } from "@/features/trainee/mobile/useRouteTraineeDisplayName";
import FormSheet from "@/shells/mobile/FormSheet";
import FormFooter from "../form/FormFooter";
import type { RecordFormSession } from "../form/recordFormSession";

interface RecordFormSheetFrameProps {
  isOpen: boolean;
  /** הטופס שנפתח: הכותרת ומצב השמירה. גוף הטופס מגיע כ-children */
  session: RecordFormSession<unknown>;
  onClose: () => void;
  children: ReactNode;
}

/** המסגרת של טופס רשומה במובייל: מסך מלא מעל ההיסטוריה, עם החניך מתחת לכותרת ופוטר בגודל מגע */
export default function RecordFormSheetFrame({ isOpen, session, onClose, children }: RecordFormSheetFrameProps) {
  const traineeDisplayName = useRouteTraineeDisplayName();

  return (
    <FormSheet
      open={isOpen}
      title={session.title}
      subtitle={traineeDisplayName}
      onClose={onClose}
      actions={<FormFooter {...session.saveProps} onCancel={onClose} buttonSize="large" />}
    >
      {children}
    </FormSheet>
  );
}
