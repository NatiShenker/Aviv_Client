import { useInstitutes } from "@/features/institutes/InstitutesProvider";
import FormSheetFooter from "@/features/records/form/FormSheetFooter";
import { editedRecordOf, resolveFormStartingPoint } from "@/features/records/form/formStartingPoint";
import { useFormSheetSession } from "@/features/records/form/useFormSheetSession";
import type { WingDto } from "@/schemas/organization.schema";
import type { TraineePhoneRecordDto } from "@/schemas/phone-exceptions.schema";
import { getCachedInstituteDevices, getInstituteDevices } from "@/services/devicesService";
import { getCachedPhoneExceptionReasons, getPhoneExceptionReasons } from "@/services/reasonsService";
import { useAsyncResource } from "@/shared/hooks/useAsyncResource";
import FormSheet from "@/shells/mobile/FormSheet";
import { NUMBER_RESTRICTIONS_TEXTS } from "../numberRestrictionsTexts";
import NumberRecordForm, { NUMBER_RECORD_FORM_ID } from "./NumberRecordForm";
import { buildFormTitle } from "./numberRecordFormLogic";
import { useNumberRecordForm } from "./useNumberRecordForm";
import type { NumberRecordFormTarget } from "./useNumberRecordFormRoute";

const REASONS_REQUEST_KEY = "phoneExceptionReasons";
// הפניה קבועה, כדי שרשימה ריקה לא תיחשב "רשימה חדשה" בכל רינדור
const NO_WINGS: WingDto[] = [];

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

function NumberRecordFormDialog({
  isOpen,
  target,
  traineeId,
  editRecord,
  basedOnRecord,
  onClose,
  onSaved,
}: NumberRecordFormDialogProps) {
  const { selectedInstitute } = useInstitutes();
  const instituteId = selectedInstitute?.id ?? null;
  // המכשירים נטענו כבר ברקע אחרי רשימת החניכים; הסיבות נשמרות אחרי הטעינה הראשונה
  const devices = useAsyncResource({
    requestKey: instituteId,
    load: getInstituteDevices,
    readCache: getCachedInstituteDevices,
  });
  const reasons = useAsyncResource({
    requestKey: REASONS_REQUEST_KEY,
    load: getPhoneExceptionReasons,
    readCache: getCachedPhoneExceptionReasons,
  });

  // הערכים נקבעים כשהטופס נפתח. אחרי שמירה ההיסטוריה נטענת מחדש, והטופס נשאר כפי שהיה עד שנסגר
  const startingPoint = resolveFormStartingPoint(target, editRecord, basedOnRecord);
  const form = useNumberRecordForm({ traineeId, instituteId, startingPoint, reasons, onSaved });

  return (
    <FormSheet
      open={isOpen}
      title={buildFormTitle(form.state)}
      onClose={onClose}
      actions={
        <FormSheetFooter
          formId={NUMBER_RECORD_FORM_ID}
          saveLabel={NUMBER_RESTRICTIONS_TEXTS.form.save}
          saveError={form.saveError}
          isBusy={form.isSaving || form.isFileUploading}
          onCancel={onClose}
        />
      }
    >
      <NumberRecordForm
        form={form}
        editRecord={editedRecordOf(startingPoint)}
        devices={devices}
        wings={selectedInstitute?.wings ?? NO_WINGS}
        reasons={reasons}
      />
    </FormSheet>
  );
}
