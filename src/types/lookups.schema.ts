/**
 * @file lookups.schema.ts
 * @description טבלאות הקוד של AVIV_DECODE (POST Lookups/GetDecode) - היום שלוש רשימות הסיבות של הטפסים (ספק 00 §6).
 * החוזה של LookupsController (service-layer/Models/Lookups): פעולה גנרית אחת לפי מזהי טבלאות (K-3).
 */

import type { LookupItem } from "./common.schema.ts";

export interface GetDecodeRequest {
  /** מזהי הטבלאות (CODE_TABLE), מתוך config/decodeTables. מזהה לא מוכר לשרת → 400 codeTableList */
  codeTableList: number[];
}

/** טבלת קוד אחת: מספרה, שמה (לדיבוג) ושורותיה הפעילות בסדר התצוגה */
export interface DecodeTableDto {
  codeTable: number;
  /** השם מרישום הטבלאות בשרת (Utils/DecodeTables.cs), כדי שבדיבוג רואים מה המספר אומר */
  codeTableName: string;
  /** ריק כשה-DBA עוד לא מילא את הסט (K-5) */
  items: LookupItem<number>[];
}

/** הרשימה עצמה (K-10): טבלה לכל מזהה שנשלח, בסדר הבקשה - גם כשאין לה שורות */
export type GetDecodeResponse = DecodeTableDto[];
