/*
 * שגיאות בטפסי ההגבלה וההיתר: בכל "מקום שגיאה" (slot) מוצגת הודעה אחת לכל היותר,
 * ומקומות השגיאה מסודרים לפי סדר ההופעה שלהם בטופס, מלמעלה למטה.
 */

export type FormErrors<TSlot extends string> = Partial<Record<TSlot, string>>;

/** מקומות השגיאה של תנאי השיחה ושל "סיבות והחלטה", המשותפים לכל טפסי ההגבלה וההיתר */
export type CallFormErrorSlot =
  | "dates"
  | "duration"
  | "hours"
  | "devices"
  | "reason"
  | "details"
  | "approver"
  | "file";

export function removeEmptyErrors<TSlot extends string>(
  errors: Partial<Record<TSlot, string | undefined>>,
): FormErrors<TSlot> {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => Boolean(message))) as FormErrors<TSlot>;
}

export function hasErrors<TSlot extends string>(errors: FormErrors<TSlot>): boolean {
  return Object.values(errors).some(Boolean);
}

/** השגיאה הראשונה בטופס, כדי להעביר אליה פוקוס */
export function findFirstErrorSlot<TSlot extends string>(
  errors: FormErrors<TSlot>,
  slotOrder: readonly TSlot[],
): TSlot | null {
  return slotOrder.find((slot) => Boolean(errors[slot])) ?? null;
}

/**
 * שגיאות השרת שיש להן מקום גלוי בטופס, והאם יש שגיאה במקום שלא מוצג כרגע.
 * שגיאה כזו לא נבלעת: הטופס מציג במקומה את שגיאת השמירה הכללית
 */
export function splitByHiddenSlots<TSlot extends string>(
  errors: FormErrors<TSlot>,
  hiddenSlots: readonly TSlot[],
): { visibleErrors: FormErrors<TSlot>; hasHiddenErrors: boolean } {
  const hasHiddenErrors = hiddenSlots.some((slot) => Boolean(errors[slot]));
  return { visibleErrors: withoutErrors(errors, [...hiddenSlots]), hasHiddenErrors };
}

/** השגיאות שנשארות אחרי שהמשתמש שינה שדות שקשורים למקומות האלה */
export function withoutErrors<TSlot extends string>(
  errors: FormErrors<TSlot>,
  clearedSlots: TSlot[],
): FormErrors<TSlot> {
  if (clearedSlots.length === 0) return errors;
  const remaining = { ...errors };
  clearedSlots.forEach((slot) => delete remaining[slot]);
  return remaining;
}

// ── שגיאות שרת (400) → מקומות בטופס (ספק 03 form §6.3, ספק 04 form §6.3) ──

/** שדות הבקשה של תנאי השיחה ו"סיבות והחלטה", ומקום השגיאה של כל אחד */
export const CALL_FORM_SERVER_FIELD_SLOTS: Record<string, CallFormErrorSlot> = {
  startDate: "dates",
  endDate: "dates",
  durationMinutes: "duration",
  startTime: "hours",
  endTime: "hours",
  deviceIds: "devices",
  reason: "reason",
  reasonCode: "reason",
  details: "details",
  approverId: "approver",
  approvedFileId: "file",
};

export function mapServerFieldErrors<TSlot extends string>(
  fieldErrors: Record<string, string>,
  fieldToSlot: Record<string, TSlot>,
): FormErrors<TSlot> {
  const errors: FormErrors<TSlot> = {};
  Object.entries(fieldErrors).forEach(([fieldName, message]) => {
    const slot = fieldToSlot[fieldName];
    // בכל מקום - השגיאה הראשונה
    if (slot && !errors[slot]) {
      errors[slot] = message;
    }
  });
  return errors;
}
