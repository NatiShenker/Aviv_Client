import { SELECTION_TTL_DAYS, STORAGE_KEYS } from "@/config/appConstants";
import { readWithExpiry, saveWithExpiry } from "@/infrastructure/expiringStorage";
import type { InstituteWithWingsDto } from "@/types/organization.schema";

/* סינון האגף נשמר בזכרון המקומי ל-30 יום, יחד עם הפנימייה שאליה הוא שייך */

interface StoredWingFilter {
  instituteId: number;
  wingIds: number[];
}

function isStoredWingFilter(value: unknown): value is StoredWingFilter {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Partial<StoredWingFilter>;
  return (
    typeof candidate.instituteId === "number" &&
    Array.isArray(candidate.wingIds) &&
    candidate.wingIds.every((wingId) => typeof wingId === "number")
  );
}

/** משוחזר רק אם נשמר לאותה פנימייה, ורק אגפים שעדיין קיימים בה */
export function readStoredWingIds(institute: InstituteWithWingsDto): number[] {
  const stored = readWithExpiry(STORAGE_KEYS.traineesWingFilter, isStoredWingFilter);
  if (!stored || stored.instituteId !== institute.id) {
    return [];
  }
  const existingWingIds = new Set(institute.wings.map((wing) => wing.wingId));
  return stored.wingIds.filter((wingId) => existingWingIds.has(wingId));
}

/** נשמר בכל בחירה של המשתמש, והתוקף מתחדש */
export function storeWingIds(instituteId: number, wingIds: number[]): void {
  const entry: StoredWingFilter = { instituteId, wingIds };
  saveWithExpiry(STORAGE_KEYS.traineesWingFilter, entry, SELECTION_TTL_DAYS);
}
