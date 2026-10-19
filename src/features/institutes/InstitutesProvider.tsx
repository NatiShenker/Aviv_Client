import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { TOAST_TYPES, useToast } from "ui-library";
import type { InstituteWithWingsDto } from "@/schemas/organization.schema";
import { getInstitutesAndWings, getPermissionsForInstitute } from "@/services/institutesService";
import { isEmptyList, useAsyncResource, type AsyncResource } from "@/shared/hooks/useAsyncResource";
import { resolveSelectedInstitute, storeInstituteId } from "./instituteSelection";
import { INSTITUTES_TEXTS } from "./institutesTexts";

interface InstitutesContextValue {
  institutes: AsyncResource<InstituteWithWingsDto[]>;
  selectedInstitute: InstituteWithWingsDto | null;
  selectInstitute: (instituteId: number) => void;
  /** מזהי ההרשאות של המשתמש בפנימייה הנבחרת (נטען ברקע) */
  permissions: AsyncResource<number[]>;
}

const InstitutesContext = createContext<InstitutesContextValue | null>(null);

// רשימת הפנימיות נטענת פעם אחת בעליית האפליקציה
const INSTITUTES_REQUEST_KEY = "institutes";

interface InstitutesProviderProps {
  children: ReactNode;
}

/** ההקשר של הפנימייה ברמת האפליקציה: רשימת הפנימיות, הפנימייה הנבחרת וההרשאות בה */
export function InstitutesProvider({ children }: InstitutesProviderProps) {
  const institutes = useAsyncResource({
    requestKey: INSTITUTES_REQUEST_KEY,
    load: getInstitutesAndWings,
    isEmpty: isEmptyList,
  });
  // בחירה של המשתמש בביקור הזה. עד שהוא בוחר - הבחירה ההתחלתית (השמורה, או הפנימייה היחידה)
  const [chosenInstituteId, setChosenInstituteId] = useState<number | null>(null);

  // נגזר בזמן הרינדור ולא ב-effect, כדי שמסך חניך שנפתח מקישור יקבל את הפנימייה כבר ברינדור הראשון
  const selectedInstitute = useMemo(
    () => resolveSelectedInstitute(institutes.data, chosenInstituteId),
    [institutes.data, chosenInstituteId],
  );

  const selectInstitute = useCallback((instituteId: number) => {
    setChosenInstituteId(instituteId);
    storeInstituteId(instituteId);
  }, []);

  const permissions = useAsyncResource({
    requestKey: selectedInstitute?.id ?? null,
    load: getPermissionsForInstitute,
  });
  useWarnWhenPermissionsFail(permissions.status);

  const contextValue = useMemo<InstitutesContextValue>(
    () => ({ institutes, selectedInstitute, selectInstitute, permissions }),
    [institutes, selectedInstitute, selectInstitute, permissions],
  );

  return <InstitutesContext.Provider value={contextValue}>{children}</InstitutesContext.Provider>;
}

// ההרשאות נטענות ברקע, ולכן כשל לא חוסם את המסך - רק מודיע למשתמש
function useWarnWhenPermissionsFail(status: AsyncResource<number[]>["status"]): void {
  const addToast = useToast();

  useEffect(() => {
    if (status === "error") {
      addToast(TOAST_TYPES.WARNING, INSTITUTES_TEXTS.permissionsLoadFailed);
    }
  }, [status, addToast]);
}

export function useInstitutes(): InstitutesContextValue {
  const context = useContext(InstitutesContext);
  if (!context) {
    throw new Error("useInstitutes must be used inside InstitutesProvider");
  }
  return context;
}
