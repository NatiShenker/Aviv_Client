import FormFooter from "@/features/records/form/FormFooter";
import { useDrawerFormSlot } from "@/features/records/history/desktop/useDrawerFormSlot";
import type { TraineeRestrictionRecordDto } from "@/schemas/trainee-restrictions.schema";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import DrawerFormLayer from "@/shells/desktop/DrawerFormLayer";
import { useReportUnsavedChanges } from "@/shells/desktop/unsavedChanges";
import RestrictionForm from "../form/RestrictionForm";
import { useRestrictionFormSession } from "../form/useRestrictionFormSession";
import type { RestrictionFormTarget } from "../form/useRestrictionFormRoute";

const matchesRestrictionId = (record: TraineeRestrictionRecordDto, recordId: number) => record.id === recordId;

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
