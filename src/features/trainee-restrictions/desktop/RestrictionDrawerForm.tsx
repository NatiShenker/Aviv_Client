import { useDrawerFormSlot } from "@/features/records/desktop/useDrawerFormSlot";
import FormFooter from "@/features/records/form/FormFooter";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import DrawerFormLayer from "@/shells/desktop/drawer/DrawerFormLayer";
import { useReportUnsavedChanges } from "@/shells/desktop/drawer/unsavedChanges";
import type { TraineeRestrictionRecordDto } from "@/types/trainee-restrictions.schema";
import RestrictionForm from "../form/RestrictionForm";
import { useRestrictionFormSession, type RestrictionFormTarget } from "../form/useRestrictionFormSession";
import { matchesRestrictionId } from "../history/traineeRestrictionsLogic";

interface RestrictionDrawerFormProps {
  target: RestrictionFormTarget;
  traineeId: number;
  /** ההיסטוריה שכבר נטענה: הרשומה לעריכה או ל"על בסיס" נלקחת ממנה */
  restrictions: AsyncResource<TraineeRestrictionRecordDto[]>;
  onClose: () => void;
  onSaved: (savedRecordId: number) => void;
}

/** טופס ההגבלה במגירה: שכבה מעל ההיסטוריה (ספק 03 form, פריסת דסקטופ) */
export default function RestrictionDrawerForm({
  target,
  traineeId,
  restrictions,
  onClose,
  onSaved,
}: RestrictionDrawerFormProps) {
  const slot = useDrawerFormSlot({ formTarget: target, records: restrictions, matchesRecordRef: matchesRestrictionId, onClose });

  // הטופס מאתחל את ערכיו פעם אחת כשהוא עולה, ולכן הוא עולה רק כשהרשומה שהוא מתחיל ממנה זמינה
  if (slot.openTarget === null) {
    return null;
  }

  return (
    <RestrictionDrawerFormContent
      target={slot.openTarget}
      traineeId={traineeId}
      editRecord={slot.editRecord}
      basedOnRecord={slot.basedOnRecord}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

interface RestrictionDrawerFormContentProps {
  target: RestrictionFormTarget;
  traineeId: number;
  editRecord: TraineeRestrictionRecordDto | null;
  basedOnRecord: TraineeRestrictionRecordDto | null;
  onClose: () => void;
  onSaved: (savedRecordId: number) => void;
}

function RestrictionDrawerFormContent({ onClose, ...sessionOptions }: RestrictionDrawerFormContentProps) {
  const formSession = useRestrictionFormSession(sessionOptions);
  useReportUnsavedChanges(formSession.hasUserChanges);

  return (
    <DrawerFormLayer
      title={formSession.title}
      onClose={onClose}
      footer={<FormFooter {...formSession.saveProps} onCancel={onClose} buttonSize="medium" />}
    >
      <RestrictionForm {...formSession.formProps} />
    </DrawerFormLayer>
  );
}
