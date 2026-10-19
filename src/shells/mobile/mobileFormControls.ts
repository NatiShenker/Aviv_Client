import {
  IpsDatePickerMobile,
  IpsMultiSelectMobile,
  IpsRadioGroupMobile,
  IpsSelectMobile,
  IpsTextAreaMobile,
  IpsTextFieldMobile,
  IpsTimePickerMobile,
} from "ui-library";
import type { FormControls } from "@/shared/form-controls/formControls";

/**
 * פקדי הטופס במובייל: הפקדים הנייטיביים של הספרייה (Ips*Mobile), כמו שהם.
 * החוזה של הטפסים הוא חלק מה-props שלהם, ולכן אין כאן המרות
 */
export const MOBILE_FORM_CONTROLS: FormControls = {
  DateField: IpsDatePickerMobile,
  TimeField: IpsTimePickerMobile,
  SelectField: IpsSelectMobile,
  MultiSelectField: IpsMultiSelectMobile,
  TextField: IpsTextFieldMobile,
  TextAreaField: IpsTextAreaMobile,
  RadioGroupField: IpsRadioGroupMobile,
};
