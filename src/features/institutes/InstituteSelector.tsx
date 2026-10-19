import { IpsSelectMobile } from "ui-library";
import { INSTITUTES_TEXTS } from "./institutesTexts";
import { useInstituteOptions } from "./useInstituteOptions";

/**
 * בורר הפנימייה בשורת הכותרת - "פקד על" נקי: שם הפנימייה וחץ, בלי מסגרת.
 * הגופן והצבע נורשים מהעוטף. כל בחירה נשמרת לזכרון המקומי דרך selectInstitute.
 */
export default function InstituteSelector() {
  const { options, selectedInstituteId, selectInstituteByValue } = useInstituteOptions();

  return (
    <IpsSelectMobile
      variant="plain"
      aria-label={INSTITUTES_TEXTS.selectLabel}
      placeholder={INSTITUTES_TEXTS.selectPlaceholder}
      options={options}
      value={selectedInstituteId}
      onChange={selectInstituteByValue}
    />
  );
}
