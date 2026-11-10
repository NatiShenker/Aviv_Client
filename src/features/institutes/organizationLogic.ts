import type { IpsSelectOption } from "ui-library";
import type { DeviceDto, WingDto } from "@/types/organization.schema";
import { INSTITUTES_TEXTS } from "./institutesTexts";

/**
 * שם האגף לתצוגה: "אגף X". אגף וירטואלי ("מיקומים שונים", שמכיל את מה שאינו תחת אגף אמיתי)
 * מוצג בשם שלו בלבד (ראו pending-decisions).
 */
export function buildWingLabel(wing: Pick<WingDto, "wingName" | "isVirtualContainer">): string {
  return wing.isVirtualContainer ? wing.wingName : INSTITUTES_TEXTS.organization.wing(wing.wingName);
}

/** מכשיר שהאגף שלו לא ברשימת האגפים - בראש הרשימה, בלי קבוצה */
const UNKNOWN_WING_ORDER = -1;

/**
 * אפשרויות בחירת המכשירים, מקובצות לפי האגף של כל מכשיר ובסדר האגפים של הפנימייה.
 * לכל מכשיר יש אגף (E-4): אגף אמיתי, או האגף הווירטואלי שהסרביס מחזיר לכל פנימייה.
 * התווית היא השם המלא מהשרת ("מכשיר 12, הדר, אגף א, חדר 3", E-3).
 */
export function buildDeviceOptions(devices: DeviceDto[], wings: WingDto[]): IpsSelectOption[] {
  const wingOrder = new Map(wings.map((wing, index) => [wing.wingId, index]));
  const wingLabels = new Map(wings.map((wing) => [wing.wingId, buildWingLabel(wing)]));
  const orderOf = (device: DeviceDto) => wingOrder.get(device.idntWing) ?? UNKNOWN_WING_ORDER;

  return [...devices]
    .sort((first, second) => orderOf(first) - orderOf(second))
    .map((device) => ({
      value: device.idntDevice,
      label: device.textDeviceName,
      group: wingLabels.get(device.idntWing),
    }));
}
