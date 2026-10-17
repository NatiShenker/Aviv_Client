import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { TOAST_TYPES, useToast } from "ui-library";
import type { InstituteWithWingsDto } from "@/schemas/organization.schema";
import { getInstitutesAndWings, getPermissionsForInstitute } from "@/services/institutesService";
import { useAsyncResource, type AsyncResource } from "@/shared/hooks/useAsyncResource";
import { readStoredInstituteId, resolveInitialInstituteId, storeInstituteId } from "./instituteSelection";
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

const isEmptyList = (list: unknown[]) => list.length === 0;

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
  const [selectedInstituteId, setSelectedInstituteId] = useState<number | null>(null);

  useEffect(() => {
    if (institutes.status === "success" && institutes.data) {
      setSelectedInstituteId(resolveInitialInstituteId(institutes.data, readStoredInstituteId()));
    }
  }, [institutes.status, institutes.data]);

  const selectedInstitute = useMemo(
    () => institutes.data?.find((institute) => institute.id === selectedInstituteId) ?? null,
    [institutes.data, selectedInstituteId],
  );

  const selectInstitute = useCallback((instituteId: number) => {
    setSelectedInstituteId(instituteId);
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
