import {
  IpsDatePickerMobile,
  IpsMultiSelectMobile,
  IpsRadioGroupMobile,
  IpsSelectMobile,
  IpsTextAreaMobile,
  IpsTextFieldMobile,
  IpsTimePickerMobile,
} from "ui-library";
import type { FormControls } from "@/shared/components/form/formControls";
import MobileFileUploadField from "./MobileFileUploadField";

/**
 * פקדי הטופס במובייל: הפקדים הנייטיביים של הספרייה (Ips*Mobile), כמו שהם.
 * החוזה של הטפסים הוא חלק מה-props שלהם, ולכן אין כאן המרות (מלבד צירוף הקובץ, שמשמיט את הסבר הדסקטופ)
 */
export const MOBILE_FORM_CONTROLS: FormControls = {
  DateField: IpsDatePickerMobile,
  TimeField: IpsTimePickerMobile,
  SelectField: IpsSelectMobile,
  MultiSelectField: IpsMultiSelectMobile,
  TextField: IpsTextFieldMobile,
  TextAreaField: IpsTextAreaMobile,
  RadioGroupField: IpsRadioGroupMobile,
  FileUploadField: MobileFileUploadField,
};
