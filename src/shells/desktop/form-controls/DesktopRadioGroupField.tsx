import { IpsRadioGroup } from "ui-library";
import type { RadioGroupFieldProps } from "@/shared/components/form/formControls";

/** קבוצת רדיו בדסקטופ: IpsRadioGroup, עם אותו API כמו IpsRadioGroupMobile (מוערמת כשיש תיאורים) */
export default function DesktopRadioGroupField(props: RadioGroupFieldProps) {
  return <IpsRadioGroup {...props} />;
}
