import { useInstitutes } from "@/context/institutes/InstitutesProvider";
import type { WingDto } from "@/schemas/organization.schema";
import type { TraineePhoneRecordDto } from "@/schemas/phone-exceptions.schema";
import { getCachedInstituteDevices, getInstituteDevices } from "@/services/devicesService";
import { getCachedPhoneExceptionReasons, getPhoneExceptionReasons } from "@/services/reasonsService";
import FormSheet from "@/shared/components/FormSheet";
import FormSheetFooter from "@/shared/components/form/FormSheetFooter";
import { useAsyncResource } from "@/shared/hooks/useAsyncResource";
import { useFormSheetSession } from "@/shared/hooks/useFormSheetSession";
import { buildFormTitle } from "../numberRecordFormLogic";
import { NUMBER_RESTRICTIONS_TEXTS } from "../numberRestrictionsTexts";
import { useNumberRecordForm } from "../useNumberRecordForm";
import type { NumberRecordFormTarget } from "../useNumberRecordFormRoute";
import NumberRecordForm, { NUMBER_RECORD_FORM_ID } from "./NumberRecordForm";

const REASONS_REQUEST_KEY = "phoneExceptionReasons";
// הפניה קבועה, כדי שרשימה ריקה לא תיחשב "רשימה חדשה" בכל רינדור
const NO_WINGS: WingDto[] = [];

interface NumberRecordFormSheetProps {
  /** הטופס שהכתובת מבקשת. null = הטופס סגור */
  target: NumberRecordFormTarget | null;
  traineeId: number;
  /** בעריכה: הרשומה מתוך ההיסטוריה שנטענה (הטופס נפתח לעריכה רק כשהיא קיימת) */
  editRecord: TraineePhoneRecordDto | null;
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

  // הערכים נקבעים מהרשומה כשהטופס נפתח. אחרי שמירה ההיסטוריה נטענת מחדש, והטופס נשאר כפי שהיה עד שנסגר
  const record = target?.mode === "edit" ? editRecord : null;
  const form = useNumberRecordForm({ traineeId, instituteId, record, reasons, onSaved });

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
        editRecord={record}
        devices={devices}
        wings={selectedInstitute?.wings ?? NO_WINGS}
        reasons={reasons}
      />
    </FormSheet>
  );
}
