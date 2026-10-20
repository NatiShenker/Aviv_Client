import type { FormControls } from "@/shared/components/form/formControls";
import DesktopDateField from "./DesktopDateField";
import DesktopMultiSelectField from "./DesktopMultiSelectField";
import DesktopRadioGroupField from "./DesktopRadioGroupField";
import DesktopSelectField from "./DesktopSelectField";
import DesktopTextAreaField from "./DesktopTextAreaField";
import DesktopTextField from "./DesktopTextField";
import DesktopTimeField from "./DesktopTimeField";

/** פקדי הטופס בדסקטופ: פקדי MUI של הספרייה (Ips*), עם התאמות של הערכים והתוויות לחוזה של הטפסים */
export const DESKTOP_FORM_CONTROLS: FormControls = {
  DateField: DesktopDateField,
  TimeField: DesktopTimeField,
  SelectField: DesktopSelectField,
  MultiSelectField: DesktopMultiSelectField,
  TextField: DesktopTextField,
  TextAreaField: DesktopTextAreaField,
  RadioGroupField: DesktopRadioGroupField,
};
