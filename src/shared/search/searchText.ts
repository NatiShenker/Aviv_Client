const NO_BREAK_SPACE_PATTERN = / /g;
const SPACE = " ";
const SEARCH_TEXT_SEPARATOR = " ";

/**
 * חיפוש בהיסטוריה (ספק 00 §4.1): התאמה של השאילתה (בלי רווחים בקצוות) כתת-מחרוזת
 * בטקסט שנבנה מהערכים הגלויים של הרשומה. רווח קשיח נחשב רווח, כדי ש"עד 10 דק'" יימצא.
 */
export function filterBySearchQuery<TRecord>(
  records: TRecord[],
  searchQuery: string,
  buildSearchParts: (record: TRecord) => string[],
): TRecord[] {
  const trimmedQuery = searchQuery.trim();
  if (trimmedQuery === "") return records;
  return records.filter((record) => buildSearchText(buildSearchParts(record)).includes(trimmedQuery));
}

function buildSearchText(parts: string[]): string {
  return parts.join(SEARCH_TEXT_SEPARATOR).replace(NO_BREAK_SPACE_PATTERN, SPACE);
}
