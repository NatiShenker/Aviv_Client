import { AVIV_CLIENT_ID } from "@/constants/appConstants";
import type { WingLocationDto } from "@/schemas/organization.schema";

interface LocationFlags {
  isVirtual?: boolean;
  hasDevice?: boolean;
}

function buildLocation(
  id: number,
  name: string,
  wingId: number,
  instituteId: number,
  { isVirtual = false, hasDevice = false }: LocationFlags = {},
): WingLocationDto {
  return { id, name, wingId, instituteId, clientId: AVIV_CLIENT_ID, isVirtual, hasDevice };
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
  buildLocation(10133, "מיקום וירטואלי", 1013, 101, { isVirtual: true }),
  // פנימיית אורות
  buildLocation(10211, "קומה 1", 1021, 102, { hasDevice: true }),
  buildLocation(10212, "קומה 2", 1021, 102),
  buildLocation(10221, "קומה 1", 1022, 102, { hasDevice: true }),
  buildLocation(10222, "קומה 2", 1022, 102),
  // פנימיית נווה ים
  buildLocation(10311, "חדר משותף", 1031, 103, { hasDevice: true }),
  buildLocation(10312, "מיקום וירטואלי", 1031, 103, { isVirtual: true }),
];
