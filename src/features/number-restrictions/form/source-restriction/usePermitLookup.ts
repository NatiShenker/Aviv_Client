import { useCallback, useEffect, useRef } from "react";
import { lookupPhoneRestrictionsForPermit } from "@/services/phoneExceptionsService";
import type { PhoneString } from "@/types/common.schema";
import type { SourceRestrictionSummaryDto } from "@/types/phone-exceptions.schema";

interface UsePermitLookupOptions {
  traineeId: number;
  /** הפנימייה של החניך - ההגבלות הפנימייתיות נבדקות מולה */
  instituteId: number | null;
  onResults: (phone: PhoneString, results: SourceRestrictionSummaryDto[]) => void;
  onFailure: (phone: PhoneString) => void;
}

interface PermitLookupActions {
  search: (phone: PhoneString) => void;
  /** תשובה שתגיע אחרי זה תידחה (המשתמש הקליד, החליף סוג או סגר את הטופס) */
  cancel: () => void;
}

/** חיפוש ההגבלות החלות על מספר עבור החניך, ליצירת היתר (ספק 04 form §4.3). רק התשובה לחיפוש האחרון נקלטת */
export function usePermitLookup({
  traineeId,
  instituteId,
  onResults,
  onFailure,
}: UsePermitLookupOptions): PermitLookupActions {
  const latestSearchRef = useRef(0);

  const cancel = useCallback(() => {
    latestSearchRef.current += 1;
  }, []);

  // טופס שנסגר באמצע חיפוש לא מקבל את התשובה
  useEffect(() => cancel, [cancel]);

  const search = (phone: PhoneString) => {
    latestSearchRef.current += 1;
    const searchNumber = latestSearchRef.current;
    const isLatestSearch = () => searchNumber === latestSearchRef.current;

    if (instituteId === null) {
      onFailure(phone);
      return;
    }

    lookupPhoneRestrictionsForPermit({ traineeId, instituteId, phoneNumber: phone })
      .then((results) => {
        if (isLatestSearch()) onResults(phone, results);
      })
      .catch(() => {
        if (isLatestSearch()) onFailure(phone);
      });
  };

  return { search, cancel };
}
