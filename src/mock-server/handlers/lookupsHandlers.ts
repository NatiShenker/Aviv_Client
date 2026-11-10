import { DECODE_TABLES } from "@/config/decodeTables";
import type { LookupItem } from "@/types/common.schema";
import type { DecodeTableDto, GetDecodeRequest, GetDecodeResponse } from "@/types/lookups.schema";
import type { GetInstituteDevicesRequest, GetInstituteDevicesResponse } from "@/types/organization.schema";
import { DEVICES_MOCK_DATA } from "../data/devicesMockData";
import {
  PHONE_EXCEPTION_REASONS_MOCK_DATA,
  TRAINEE_RESTRICTION_REASONS_MOCK_DATA,
  VOICE_MESSAGE_REASONS_MOCK_DATA,
} from "../data/reasonsMockData";
import type { MockRequest } from "../mockRequest";

// רשימות תומכות לטפסים: מכשירי הפנימיות וטבלאות הקוד (הסיבות)

/** כמו SP_AVIV_GET_DEVICES (E-7): מכשיר נכלל כשהפנימייה שלו ברשימה או כשהאגף שלו ברשימה */
export function handleGetInstituteDevices(request: MockRequest): GetInstituteDevicesResponse {
  const { idntInstitutionList, idntWingList } = request.body as GetInstituteDevicesRequest;
  // התשובה היא הרשימה עצמה (E-12)
  return DEVICES_MOCK_DATA.filter(
    (device) => idntInstitutionList.includes(device.idntInstitution) || idntWingList.includes(device.idntWing),
  );
}

interface MockDecodeTable {
  codeTableName: string;
  items: LookupItem<number>[];
}

// טבלאות הקוד שהמוק מכיר, כמו הרישום Utils/DecodeTables.cs בסרביס (K-3): שם לדיבוג ושורות
const DECODE_TABLES_MOCK_DATA: Record<number, MockDecodeTable> = {
  [DECODE_TABLES.traineeRestrictionReasons]: {
    codeTableName: "TraineeRestrictionReasons",
    items: TRAINEE_RESTRICTION_REASONS_MOCK_DATA,
  },
  [DECODE_TABLES.phoneExceptionReasons]: { codeTableName: "PhoneExceptionReasons", items: PHONE_EXCEPTION_REASONS_MOCK_DATA },
  [DECODE_TABLES.voiceMessageReasons]: { codeTableName: "VoiceMessageReasons", items: VOICE_MESSAGE_REASONS_MOCK_DATA },
};

/**
 * כמו Lookups/GetDecode: טבלה לכל מזהה שנשלח, בסדר הבקשה, כרשימה חשופה (K-10). מזהה לא מוכר מוחזר ריק (השרת האמיתי מחזיר 400).
 * התרחיש mockEmpty=reasons מחזיר [], ואז reasonsService נופל לרשימות ה-mock (K-6) - התוצאה זהה
 */
export function handleGetDecode(request: MockRequest): GetDecodeResponse {
  const { codeTableList } = request.body as GetDecodeRequest;
  return codeTableList.map(toDecodeTable);
}

function toDecodeTable(codeTable: number): DecodeTableDto {
  const table = DECODE_TABLES_MOCK_DATA[codeTable];
  return { codeTable, codeTableName: table?.codeTableName ?? "", items: table?.items ?? [] };
}
