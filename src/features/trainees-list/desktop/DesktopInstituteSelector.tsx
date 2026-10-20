import { IpsSelect } from "ui-library";
import { INSTITUTES_TEXTS } from "@/features/institutes/institutesTexts";
import { useInstituteOptions } from "@/features/institutes/useInstituteOptions";
import { CONTEXT_SELECT_SX } from "@/shells/desktop/contextSelectSx";

/** בורר הפנימייה בשורת הכותרת בדסקטופ. כל בחירה נשמרת לזכרון המקומי דרך selectInstitute */
export default function DesktopInstituteSelector() {
  const { options, selectedInstituteId, selectInstituteByValue } = useInstituteOptions();

  return (
    <IpsSelect
      // aria-label חייב לעבור דרך inputProps: ברמה העליונה הוא נוחת על העוטף ולא על הפקד
      inputProps={{ "aria-label": INSTITUTES_TEXTS.selectLabel }}
      placeholder={INSTITUTES_TEXTS.selectPlaceholder}
      options={options}
      value={selectedInstituteId ?? undefined}
      onChange={selectInstituteByValue}
      sx={CONTEXT_SELECT_SX}
    />
  );
}
