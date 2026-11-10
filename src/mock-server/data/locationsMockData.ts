import { VIRTUAL_WING_ID, type WingLocationDto } from "@/types/organization.schema";

interface LocationFlags {
  isVirtual?: boolean;
  hasDevice?: boolean;
}

// כמו UnifiedLocationDto של SP_AVIV_GET_LOCATIONS: parentId הוא האגף האמיתי, או האגף הווירטואלי למיקום וירטואלי
function buildLocation(
  locationId: number,
  locationName: string,
  parentId: number,
  institutionId: number,
  { isVirtual = false, hasDevice = false }: LocationFlags = {},
): WingLocationDto {
  return { locationId, locationName, institutionId, parentId, isVirtual, hasDevice };
}

export const LOCATIONS_MOCK_DATA: WingLocationDto[] = [
  // פנימיית הדר
  buildLocation(10111, "חדר 1", 1011, 101, { hasDevice: true }),
  buildLocation(10112, "חדר 2", 1011, 101),
  buildLocation(10113, "מועדון", 1011, 101, { hasDevice: true }),
  buildLocation(10121, "חדר 3", 1012, 101, { hasDevice: true }),
  buildLocation(10122, "חדר 4", 1012, 101),
  buildLocation(10131, "חדר 5", 1013, 101),
  buildLocation(10132, "פינת טלפון", 1013, 101, { hasDevice: true }),
  buildLocation(10133, "מיקום וירטואלי", VIRTUAL_WING_ID, 101, { isVirtual: true }),
  // פנימיית אורות
  buildLocation(10211, "קומה 1", 1021, 102, { hasDevice: true }),
  buildLocation(10212, "קומה 2", 1021, 102),
  buildLocation(10221, "קומה 1", 1022, 102, { hasDevice: true }),
  buildLocation(10222, "קומה 2", 1022, 102),
  // פנימיית נווה ים
  buildLocation(10311, "חדר משותף", 1031, 103, { hasDevice: true }),
  buildLocation(10312, "מיקום וירטואלי", VIRTUAL_WING_ID, 103, { isVirtual: true }),
];
