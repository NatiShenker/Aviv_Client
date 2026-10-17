import { SELECTION_TTL_DAYS } from "@/constants/appConstants";
import { readWithExpiry, saveWithExpiry } from "@/infrastructure/storage/expiringStorage";
import { STORAGE_KEYS } from "@/infrastructure/storage/storageKeys";
import type { InstituteWithWingsDto } from "@/schemas/organization.schema";

/**
 * הפנימייה שנבחרת כשהמסך עולה:
 * הבחירה השמורה, אם המשתמש עדיין מורשה אליה; אחרת הפנימייה היחידה, אם יש רק אחת; אחרת אף אחת.
 */
export function resolveInitialInstituteId(
  institutes: InstituteWithWingsDto[],
  storedInstituteId: number | null,
): number | null {
  const isStoredInstitutePermitted =
    storedInstituteId !== null && institutes.some((institute) => institute.id === storedInstituteId);

  if (isStoredInstitutePermitted) {
    return storedInstituteId;
  }
  if (institutes.length === 1) {
    return institutes[0].id;
  }
  return null;
}

function isInstituteId(value: unknown): value is number {
  return typeof value === "number";
}

export function readStoredInstituteId(): number | null {
  return readWithExpiry(STORAGE_KEYS.selectedInstitute, isInstituteId);
}

/** נשמר בכל בחירה של המשתמש, והתוקף מתחדש */
export function storeInstituteId(instituteId: number): void {
  saveWithExpiry(STORAGE_KEYS.selectedInstitute, instituteId, SELECTION_TTL_DAYS);
}
