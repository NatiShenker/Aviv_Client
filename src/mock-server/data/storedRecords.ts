/*
 * רשומה כפי שהמוק שומר אותה: ה-DTO שהשרת מחזיר, ועוד הדגל LOGI_ACTIVE של ה-DB.
 * השרת מחזיר רק שורות פעילות (B-5) ולא מחזיר את הדגל (I-20), ולכן הוא יורד מהרשומה לפני שהיא נשלחת.
 */

export type StoredRecord<TRecord> = TRecord & { isActive: boolean };

/** הגרסאות הפעילות בלבד - מה שהפרוצדורות מחזירות */
export function activeRecords<TRecord>(records: StoredRecord<TRecord>[]): StoredRecord<TRecord>[] {
  return records.filter((record) => record.isActive);
}

/** הרשומה כפי שהשרת מחזיר אותה, בלי הדגל הפנימי של המוק */
export function toRecordDto<TRecord>(stored: StoredRecord<TRecord>): TRecord {
  // הדגל נקשר למשתנה רק כדי להישאר מחוץ לעותק
  const { isActive: _isActive, ...record } = stored;
  return record as TRecord;
}
