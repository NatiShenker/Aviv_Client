import DrawerRecordFormFrame from "@/features/records/desktop/DrawerRecordFormFrame";
import { useDrawerFormSlot } from "@/features/records/desktop/useDrawerFormSlot";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import type { TraineeRestrictionRecordDto } from "@/types/trainee-restrictions.schema";
import TraineeRestrictionForm from "../form/TraineeRestrictionForm";
import { useTraineeRestrictionFormSession, type TraineeRestrictionFormTarget } from "../form/useTraineeRestrictionFormSession";
import { matchesTraineeRestrictionId } from "../history/traineeRestrictionsLogic";

interface TraineeRestrictionDrawerFormProps {
  target: TraineeRestrictionFormTarget;
  traineeId: number;
  /** ההיסטוריה שכבר נטענה: הרשומה לעריכה או ל"על בסיס" נלקחת ממנה */
  restrictions: AsyncResource<TraineeRestrictionRecordDto[]>;
  onClose: () => void;
  onSaved: (savedRecordId: number) => void;
}

/** טופס ההגבלה במגירה: שכבה מעל ההיסטוריה (ספק 03 form, פריסת דסקטופ) */
export default function TraineeRestrictionDrawerForm({
  target,
  traineeId,
  restrictions,
  onClose,
  onSaved,
}: TraineeRestrictionDrawerFormProps) {
  const slot = useDrawerFormSlot({ formTarget: target, records: restrictions, matchesRecordRef: matchesTraineeRestrictionId, onClose });

  // הטופס מאתחל את ערכיו פעם אחת כשהוא עולה, ולכן הוא עולה רק כשהרשומה שהוא מתחיל ממנה זמינה
  if (slot.openTarget === null) {
    return null;
  }

  return (
    <TraineeRestrictionDrawerFormContent
      target={slot.openTarget}
      traineeId={traineeId}
      editRecord={slot.editRecord}
      basedOnRecord={slot.basedOnRecord}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

interface TraineeRestrictionDrawerFormContentProps {
  target: TraineeRestrictionFormTarget;
  traineeId: number;
  editRecord: TraineeRestrictionRecordDto | null;
  basedOnRecord: TraineeRestrictionRecordDto | null;
  onClose: () => void;
  onSaved: (savedRecordId: number) => void;
}

function TraineeRestrictionDrawerFormContent({ onClose, ...sessionOptions }: TraineeRestrictionDrawerFormContentProps) {
  const formSession = useTraineeRestrictionFormSession(sessionOptions);

  return (
    <DrawerRecordFormFrame session={formSession} onClose={onClose}>
      <TraineeRestrictionForm {...formSession.formProps} />
    </DrawerRecordFormFrame>
  );
}
