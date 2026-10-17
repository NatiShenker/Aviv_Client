import { useMemo } from "react";
import { IpsSelectMobile, type IpsSelectMobileValue, type IpsSelectOption } from "ui-library";
import { useInstitutes } from "./InstitutesProvider";
import { INSTITUTES_TEXTS } from "./institutesTexts";

/**
 * בורר הפנימייה בשורת הכותרת - "פקד על" נקי: שם הפנימייה וחץ, בלי מסגרת.
 * הגופן והצבע נורשים מהעוטף. כל בחירה נשמרת לזכרון המקומי דרך selectInstitute.
 */
export default function InstituteSelector() {
  const { institutes, selectedInstitute, selectInstitute } = useInstitutes();

  const options = useMemo<IpsSelectOption[]>(
    () => (institutes.data ?? []).map((institute) => ({ value: institute.id, label: institute.name })),
    [institutes.data],
  );

  const handleChange = (value: IpsSelectMobileValue) => selectInstitute(Number(value));

  return (
    <IpsSelectMobile
      variant="plain"
      aria-label={INSTITUTES_TEXTS.selectLabel}
      placeholder={INSTITUTES_TEXTS.selectPlaceholder}
      options={options}
      value={selectedInstitute?.id ?? null}
      onChange={handleChange}
    />
  );
}
