import type { SourceRestrictionSummaryDto } from "@/schemas/phone-exceptions.schema";
import { daysFromToday } from "../mockDates";
import { INSTITUTES_MOCK_DATA } from "./institutesMockData";

const FIRST_INSTITUTE = INSTITUTES_MOCK_DATA[0];

// הגבלות מקור למספרי טלפון (ארצית ופנימייתית), שנוצרו ב"חוסאם". עליהן יושבים היתרי המספר של החניכים
export const SOURCE_PHONE_RESTRICTIONS_MOCK_DATA: SourceRestrictionSummaryDto[] = [
  {
    restrictionId: 9001,
    traineeRestrictionNumberId: null,
    phoneNumberId: 8001,
    phoneNumber: "0721234567",
    scope: "national",
    institutes: [],
    startDate: daysFromToday(-60),
    endDate: daysFromToday(300),
    reason: "אחר",
    existingTraineePermits: [],
  },
  {
    restrictionId: 9002,
    traineeRestrictionNumberId: null,
    phoneNumberId: 8002,
    phoneNumber: "0739876543",
    scope: "institute",
    institutes: [{ id: FIRST_INSTITUTE.id, name: FIRST_INSTITUTE.name }],
    startDate: daysFromToday(-30),
    endDate: daysFromToday(120),
    reason: "בקשת הורים",
    existingTraineePermits: [],
  },
];
