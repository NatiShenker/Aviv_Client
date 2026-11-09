import type {
  ApprovalInput,
  ApprovedFileInput,
  ApproverRef,
  DecisionApprovalDto,
  LookupItem,
} from "@/types/common.schema";
import { FORM_TEXTS } from "../formTexts";

/*
 * "סיבות ואישורים" (ספק 00 §4.3): זהה בכל הטפסים, חוץ מרשימת הסיבות.
 * כל ארבעת השדות חובה בכל הטפסים - סיבה, פירוט, גורם מאשר וקובץ (הוחלט 2026-10-19).
 */

/** ערכי בלוק "סיבות ואישורים" - זהים בכל הטפסים, חוץ מרשימת הסיבות */
export interface DecisionValues {
  reasonId: number | null;
  details: string;
  approver: ApproverRef | null;
  /** הקובץ שהועלה ל-SharePoint (או הקובץ של הרשומה בעריכה): הנתיב והשם לתצוגה */
  approvedFile: ApprovedFileInput | null;
}

export interface DecisionErrors {
  reason?: string;
  details?: string;
  approver?: string;
  file?: string;
}

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

/**
 * עריכה: הפירוט, הגורם המאשר והקובץ מהרשומה. הסיבה מתחילה ריקה - ב-03 וב-04 השרת לא מחזיר אותה (I-23),
 * וב-05 היא נמצאת לפי השם כשרשימת הסיבות מגיעה (findReasonIdByName)
 */
export function decisionValuesFromRecord(record: DecisionApprovalDto): DecisionValues {
  return {
    reasonId: null,
    details: record.textReason,
    approver: record.approver,
    approvedFile: { fileName: record.approvedFile.fileName, textFile: record.approvedFile.textFile },
  };
}

/**
 * רשומה חדשה על בסיס רשומה שהסתיימה: הפירוט עובר (והסיבה, כשהרשומה נושאת אותה - 05);
 * הגורם המאשר והקובץ ריקים, כי החלטה חדשה צריכה אישור חדש
 */
export function createBasedOnDecisionValues(record: DecisionApprovalDto): DecisionValues {
  return {
    reasonId: null,
    details: record.textReason,
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

/** "סיבות ואישורים" אחרי ולידציה: השדות החובה מלאים */
export interface ValidatedDecision {
  reasonId: number;
  /** שם הסיבה, לבקשות ששולחות גם אותו (05) */
  reasonName: string;
  idntUserApproval: number;
  approvedFile: ApprovedFileInput;
}

/** השדות של "סיבות ואישורים" לשליחה, או null אם שדה חובה עדיין ריק */
export function toValidatedDecision(values: DecisionValues, reasons: LookupItem<number>[]): ValidatedDecision | null {
  if (values.reasonId === null || values.approver === null || values.approvedFile === null) return null;

  const reasonName = reasons.find((reason) => reason.id === values.reasonId)?.name ?? "";
  return {
    reasonId: values.reasonId,
    reasonName,
    idntUserApproval: values.approver.id,
    approvedFile: values.approvedFile,
  };
}

/**
 * חלק האישור של כל בקשת שמירה: הגורם המאשר והקובץ (D-13: הנתיב ב-SharePoint, והשם לתצוגה בלבד).
 * הפירוט וקוד הסיבה נשלחים בשם של כל פעולה, ולכן כל טופס מוסיף אותם בעצמו
 */
export function toApprovalInput(decision: ValidatedDecision): ApprovalInput {
  return {
    idntUserApproval: decision.idntUserApproval,
    textFile: decision.approvedFile.textFile,
    textFileName: decision.approvedFile.fileName,
  };
}

/** רשומה ששמורה עם שם הסיבה (05): המזהה שלה ברשימה נמצא לפי השם (ראו pending-decisions) */
export function findReasonIdByName(reasons: LookupItem<number>[], reasonName: string): number | null {
  return reasons.find((reason) => reason.name === reasonName)?.id ?? null;
}
