import { useInstitutes } from "@/context/institutes/InstitutesProvider";
import type { WingDto } from "@/schemas/organization.schema";
import type { TraineeRestrictionRecordDto } from "@/schemas/trainee-restrictions.schema";
import { getCachedInstituteDevices, getInstituteDevices } from "@/services/devicesService";
import { getCachedTraineeRestrictionReasons, getTraineeRestrictionReasons } from "@/services/reasonsService";
import FormSheet from "@/shared/components/FormSheet";
import FormSheetFooter from "@/shared/components/form/FormSheetFooter";
import { useAsyncResource } from "@/shared/hooks/useAsyncResource";
import { useFormSheetSession } from "@/shared/hooks/useFormSheetSession";
import { TRAINEE_RESTRICTIONS_TEXTS } from "../traineeRestrictionsTexts";
import type { RestrictionFormTarget } from "../useRestrictionFormRoute";
import { useRestrictionForm } from "../useRestrictionForm";
import RestrictionForm, { RESTRICTION_FORM_ID } from "./RestrictionForm";

const TEXTS = TRAINEE_RESTRICTIONS_TEXTS.form;
const REASONS_REQUEST_KEY = "traineeRestrictionReasons";
// הפניה קבועה, כדי שרשימה ריקה לא תיחשב "רשימה חדשה" בכל רינדור
const NO_WINGS: WingDto[] = [];

interface RestrictionFormSheetProps {
  /** הטופס שהכתובת מבקשת. null = הטופס סגור */
  target: RestrictionFormTarget | null;
  traineeId: number;
  /** בעריכה: הרשומה מתוך ההיסטוריה שנטענה (הטופס נפתח לעריכה רק כשהיא קיימת) */
  editRecord: TraineeRestrictionRecordDto | null;
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

function RestrictionFormDialog({ isOpen, target, traineeId, editRecord, onClose, onSaved }: RestrictionFormDialogProps) {
  const { selectedInstitute } = useInstitutes();
  // המכשירים נטענו כבר ברקע אחרי רשימת החניכים; הסיבות נשמרות אחרי הטעינה הראשונה
  const devices = useAsyncResource({
    requestKey: selectedInstitute?.id ?? null,
    load: getInstituteDevices,
    readCache: getCachedInstituteDevices,
  });
  const reasons = useAsyncResource({
    requestKey: REASONS_REQUEST_KEY,
    load: getTraineeRestrictionReasons,
    readCache: getCachedTraineeRestrictionReasons,
  });

  const isEditMode = target?.mode === "edit";
  // הערכים נקבעים מהרשומה כשהטופס נפתח. אחרי שמירה ההיסטוריה נטענת מחדש, והטופס נשאר כפי שהיה עד שנסגר
  const form = useRestrictionForm({ traineeId, record: isEditMode ? editRecord : null, reasons, onSaved });

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
