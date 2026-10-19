import { useInstitutes } from "@/features/institutes/InstitutesProvider";
import FormSheetFooter from "@/features/records/form/FormSheetFooter";
import { resolveFormStartingPoint } from "@/features/records/form/formStartingPoint";
import { useFormSheetSession } from "@/features/records/form/useFormSheetSession";
import { useInstituteDevices } from "@/features/records/form/useInstituteDevices";
import { useReasons } from "@/features/records/form/useReasons";
import type { WingDto } from "@/schemas/organization.schema";
import type { TraineeRestrictionRecordDto } from "@/schemas/trainee-restrictions.schema";
import FormSheet from "@/shells/mobile/FormSheet";
import { TRAINEE_RESTRICTIONS_TEXTS } from "../traineeRestrictionsTexts";
import RestrictionForm, { RESTRICTION_FORM_ID } from "./RestrictionForm";
import { useRestrictionForm } from "./useRestrictionForm";
import type { RestrictionFormTarget } from "./useRestrictionFormRoute";

const TEXTS = TRAINEE_RESTRICTIONS_TEXTS.form;
// הפניה קבועה, כדי שרשימה ריקה לא תיחשב "רשימה חדשה" בכל רינדור
const NO_WINGS: WingDto[] = [];

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

function RestrictionFormDialog({
  isOpen,
  target,
  traineeId,
  editRecord,
  basedOnRecord,
  onClose,
  onSaved,
}: RestrictionFormDialogProps) {
  const { selectedInstitute } = useInstitutes();
  const devices = useInstituteDevices(selectedInstitute?.id ?? null);
  const reasons = useReasons("traineeRestriction");

  const isEditMode = target?.mode === "edit";
  // הערכים נקבעים כשהטופס נפתח. אחרי שמירה ההיסטוריה נטענת מחדש, והטופס נשאר כפי שהיה עד שנסגר
  const startingPoint = resolveFormStartingPoint(target, editRecord, basedOnRecord);
  const form = useRestrictionForm({ traineeId, startingPoint, reasons, onSaved });

  return (
    <FormSheet
      open={isOpen}
      title={isEditMode ? TEXTS.editTitle : TEXTS.createTitle}
      onClose={onClose}
      actions={
        <FormSheetFooter
          formId={RESTRICTION_FORM_ID}
          saveLabel={TEXTS.save}
          saveError={form.saveError}
          isBusy={form.isSaving || form.isFileUploading}
          onCancel={onClose}
        />
      }
    >
      <RestrictionForm
        form={form}
        devices={devices}
        wings={selectedInstitute?.wings ?? NO_WINGS}
        reasons={reasons}
      />
    </FormSheet>
  );
}
