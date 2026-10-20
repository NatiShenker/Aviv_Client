import type { IpsSelectOption } from "ui-library";
import type { DeviceDto, WingDto } from "@/types/organization.schema";
import { INSTITUTES_TEXTS } from "./institutesTexts";

/**
 * שם האגף לתצוגה: "אגף X". אגף וירטואלי (למשל "מיקומים שונים", שמכיל את מכשירי הפנימייה כולה)
 * מוצג בשם שלו בלבד (ראו pending-decisions).
 */
export function buildWingLabel(wing: Pick<WingDto, "name" | "isVirtualContainer">): string {
  return wing.isVirtualContainer ? wing.name : INSTITUTES_TEXTS.organization.wing(wing.name);
}

/** מכשיר שהאגף שלו לא ברשימת האגפים - בראש הרשימה, בלי קבוצה */
const UNKNOWN_WING_ORDER = -1;

/**
 * אפשרויות בחירת המכשירים, מקובצות לפי האגף של כל מכשיר ובסדר האגפים של הפנימייה.
 * לכל מכשיר יש אגף (מכשירי הפנימייה כולה - באגף וירטואלי).
 */
export function buildDeviceOptions(devices: DeviceDto[], wings: WingDto[]): IpsSelectOption[] {
  const wingOrder = new Map(wings.map((wing, index) => [wing.id, index]));
  const wingLabels = new Map(wings.map((wing) => [wing.id, buildWingLabel(wing)]));
  const orderOf = (device: DeviceDto) => wingOrder.get(device.wingId ?? UNKNOWN_WING_ORDER) ?? UNKNOWN_WING_ORDER;

  return [...devices]
    .sort((first, second) => orderOf(first) - orderOf(second))
    .map((device) => ({
      value: device.id,
      label: device.name,
      group: device.wingId == null ? undefined : wingLabels.get(device.wingId),
    }));
}
