import { IpsSelect } from "ui-library";
import { INSTITUTES_TEXTS } from "./institutesTexts";
import { useInstituteOptions } from "./useInstituteOptions";

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
    />
  );
}
