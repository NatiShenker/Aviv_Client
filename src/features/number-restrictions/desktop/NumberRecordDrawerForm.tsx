import { useDrawerFormSlot } from "@/features/records/desktop/useDrawerFormSlot";
import FormFooter from "@/features/records/form/FormFooter";
import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import DrawerFormLayer from "@/shells/desktop/drawer/DrawerFormLayer";
import { useReportUnsavedChanges } from "@/shells/desktop/drawer/unsavedChanges";
import type { TraineePhoneRecordDto } from "@/types/phone-exceptions.schema";
import NumberRecordForm from "../form/NumberRecordForm";
import { useNumberRecordFormSession, type NumberRecordFormTarget } from "../form/useNumberRecordFormSession";
import { matchesNumberRecordRef } from "../numberRestrictionsLogic";
import RestrictionRadioCards from "./RestrictionRadioCards";

interface NumberRecordDrawerFormProps {
  target: NumberRecordFormTarget;
  traineeId: number;
  /** ההיסטוריה שכבר נטענה: הרשומה לעריכה או ל"על בסיס" נלקחת ממנה */
  phoneRecords: AsyncResource<TraineePhoneRecordDto[]>;
  onClose: () => void;
  onSaved: (savedRecordKey: string) => void;
}

/** טופס ההגבלה / ההיתר למספר במגירה: שכבה מעל ההיסטוריה (ספק 04 form, פריסת דסקטופ) */
export default function NumberRecordDrawerForm({
  target,
  traineeId,
  phoneRecords,
  onClose,
  onSaved,
}: NumberRecordDrawerFormProps) {
  const slot = useDrawerFormSlot({ formTarget: target, records: phoneRecords, matchesRecordRef: matchesNumberRecordRef, onClose });

  // הטופס מאתחל את ערכיו פעם אחת כשהוא עולה, ולכן הוא עולה רק כשהרשומה שהוא מתחיל ממנה זמינה
  if (slot.openTarget === null) {
    return null;
  }

  return (
    <NumberRecordDrawerFormContent
      target={slot.openTarget}
      traineeId={traineeId}
      editRecord={slot.editRecord}
      basedOnRecord={slot.basedOnRecord}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

interface NumberRecordDrawerFormContentProps {
  target: NumberRecordFormTarget;
  traineeId: number;
  editRecord: TraineePhoneRecordDto | null;
  basedOnRecord: TraineePhoneRecordDto | null;
  onClose: () => void;
  onSaved: (savedRecordKey: string) => void;
}

function NumberRecordDrawerFormContent({ onClose, ...sessionOptions }: NumberRecordDrawerFormContentProps) {
  const formSession = useNumberRecordFormSession(sessionOptions);
  useReportUnsavedChanges(formSession.hasUserChanges);

  return (
    <DrawerFormLayer
      title={formSession.title}
      onClose={onClose}
      footer={<FormFooter {...formSession.saveProps} onCancel={onClose} buttonSize="medium" />}
    >
      {/* בדסקטופ בוחרים הגבלה בכרטיסי רדיו - כל הכרטיס לחיץ (החלטת שלב 2) */}
      <NumberRecordForm {...formSession.formProps} RestrictionOptionsList={RestrictionRadioCards} />
    </DrawerFormLayer>
  );
}
