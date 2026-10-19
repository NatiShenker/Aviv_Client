import { useMemo } from "react";
import type { IpsSelectOption } from "ui-library";
import { useInstitutes } from "./InstitutesProvider";

interface InstituteOptions {
  options: IpsSelectOption[];
  selectedInstituteId: number | null;
  /** הפקד מחזיר ערך כללי; המזהה של פנימייה הוא מספר */
  selectInstituteByValue: (value: unknown) => void;
}

/** אפשרויות בורר הפנימייה והבחירה הנוכחית - משותף לבורר של כל פלטפורמה */
export function useInstituteOptions(): InstituteOptions {
  const { institutes, selectedInstitute, selectInstitute } = useInstitutes();

  const options = useMemo<IpsSelectOption[]>(
    () => (institutes.data ?? []).map((institute) => ({ value: institute.id, label: institute.name })),
    [institutes.data],
  );

  const selectInstituteByValue = (value: unknown) => selectInstitute(Number(value));

  return {
    options,
    selectedInstituteId: selectedInstitute?.id ?? null,
    selectInstituteByValue,
  };
}
