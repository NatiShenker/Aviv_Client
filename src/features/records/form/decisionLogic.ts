import type { DecisionApprovalDto, DecisionApprovalInput, LookupItem } from "@/schemas/common.schema";
import type { DecisionErrors, DecisionValues } from "./DecisionBlock";
import { FORM_TEXTS } from "./formTexts";

/*
 * "סיבות והחלטה" (ספק 00 §4.3): זהה בכל הטפסים, חוץ מרשימת הסיבות.
 * כל ארבעת השדות חובה בכל הטפסים - סיבה, פירוט, גורם מאשר וקובץ (הוחלט 2026-10-19).
 */

/** רשומה חדשה: אין עדיין סיבה, פירוט, גורם מאשר או קובץ */
export function createEmptyDecisionValues(): DecisionValues {
  return {
    // הסיבה נבחרת מרשימה שנטענת מהסרביס
    reasonId: null,
    details: "",
    approver: null,
    approvedFile: null,
  };
}

/** עריכה: הסיבה נמצאת לפי השם כשרשימת הסיבות מגיעה (ראו findReasonIdByName) */
export function decisionValuesFromRecord(record: DecisionApprovalDto): DecisionValues {
  return {
    reasonId: null,
    details: record.details,
    approver: record.approver,
    approvedFile: record.approvedFile,
  };
}

/**
 * רשומה חדשה על בסיס רשומה שהסתיימה: הסיבה (לפי השם, כשהרשימה מגיעה) והפירוט עוברים;
 * הגורם המאשר והקובץ ריקים, כי החלטה חדשה צריכה אישור חדש
 */
export function createBasedOnDecisionValues(record: DecisionApprovalDto): DecisionValues {
  return {
    reasonId: null,
    details: record.details,
    approver: null,
    approvedFile: null,
  };
}

export function validateDecision(values: DecisionValues): DecisionErrors {
  const validationTexts = FORM_TEXTS.validation;
  return {
    reason: values.reasonId === null ? validationTexts.reasonRequired : undefined,
    // פירוט של רווחים בלבד נחשב ריק
    details: values.details.trim() === "" ? validationTexts.detailsRequired : undefined,
    approver: values.approver === null ? validationTexts.approverRequired : undefined,
    file: values.approvedFile === null ? validationTexts.fileRequired : undefined,
  };
}

export type DecisionErrorSlot = keyof DecisionErrors;

// השגיאה של כל שדה בבלוק נמחקת כשהשדה משתנה
const DECISION_FIELD_ERROR_SLOT: Record<keyof DecisionValues, DecisionErrorSlot> = {
  reasonId: "reason",
  details: "details",
  approver: "approver",
  approvedFile: "file",
};

/** מקומות השגיאה שנמחקים כשהשדות האלה משתנים */
export function decisionErrorSlotsFor(update: Partial<DecisionValues>): DecisionErrorSlot[] {
  return (Object.keys(update) as (keyof DecisionValues)[]).map((fieldName) => DECISION_FIELD_ERROR_SLOT[fieldName]);
}

/** "סיבות והחלטה" אחרי ולידציה: השדות החובה מלאים */
export interface ValidatedDecision {
  reasonId: number;
  reasonName: string;
  approverId: number;
  approvedFileId: number;
}

/** השדות של "סיבות והחלטה" לשליחה, או null אם שדה חובה עדיין ריק */
export function toValidatedDecision(values: DecisionValues, reasons: LookupItem<number>[]): ValidatedDecision | null {
  if (values.reasonId === null || values.approver === null || values.approvedFile === null) return null;

  const reasonName = reasons.find((reason) => reason.id === values.reasonId)?.name ?? "";
  return {
    reasonId: values.reasonId,
    reasonName,
    approverId: values.approver.id,
    approvedFileId: values.approvedFile.id,
  };
}

export function toDecisionInput(details: string, decision: ValidatedDecision): DecisionApprovalInput {
  return {
    reason: decision.reasonName,
    reasonCode: decision.reasonId,
    details,
    approverId: decision.approverId,
    approvedFileId: decision.approvedFileId,
  };
}

/** הרשומה שמורה עם שם הסיבה; המזהה שלה ברשימה נמצא לפי השם (ראו pending-decisions) */
export function findReasonIdByName(reasons: LookupItem<number>[], reasonName: string): number | null {
  return reasons.find((reason) => reason.name === reasonName)?.id ?? null;
}
