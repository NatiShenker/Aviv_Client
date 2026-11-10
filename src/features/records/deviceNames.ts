import { useMemo } from "react";
import { useInstitutes } from "@/store/institutesContext";
import type { DeviceDto } from "@/types/organization.schema";
import { CALL_CONDITIONS_TEXTS } from "./form/call-conditions/callConditionsTexts";
import { useInstituteDevices } from "./form/formReferenceData";

const TEXTS = CALL_CONDITIONS_TEXTS.values;

/** שם המכשיר לפי המזהה שלו - לרשומות שמחזיקות מזהי מכשירים בלבד (E-8) */
export type DeviceNameResolver = (deviceId: number) => string;

/**
 * E-8: ההיסטוריות מחזירות מזהי מכשירים בלבד, והשם נלקח מרשימת מכשירי הפנימייה שכבר בידינו (השם נבנה רק בשרת, ברשימה).
 * עד שהרשימה נטענת - "מכשיר {מזהה}"; כשהרשימה נטענה והמכשיר אינו בה (הוסר, LOGI_ACTIVE = 0) - "מכשיר {מזהה} - לא פעיל".
 */
export function createDeviceNameResolver(devices: DeviceDto[] | null): DeviceNameResolver {
  if (devices === null) {
    return (deviceId) => TEXTS.deviceById(deviceId);
  }
  const namesById = new Map(devices.map((device) => [device.idntDevice, device.textDeviceName]));
  return (deviceId) => namesById.get(deviceId) ?? TEXTS.inactiveDevice(deviceId);
}

/**
 * שמות המכשירים של הפנימייה הנבחרת. הרשימה בדרך כלל כבר ב-cache (נטענת אחרי רשימת החניכים);
 * בכניסה ישירה למסך היסטוריה היא נטענת כאן, והכרטיסים מתעדכנים כשהיא מגיעה
 */
export function useDeviceNameResolver(): DeviceNameResolver {
  const { selectedInstitute } = useInstitutes();
  const devices = useInstituteDevices(selectedInstitute?.id ?? null);
  return useMemo(() => createDeviceNameResolver(devices.data), [devices.data]);
}
