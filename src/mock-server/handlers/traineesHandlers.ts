import type { ISODateString } from "@/types/common.schema";
import type {
  GetTraineePhotoRequest,
  GetTraineesRequest,
  GetTraineesResponse,
  TraineeListItemDto,
} from "@/types/trainees.schema";
import { TRAINEE_PHONE_RECORDS_MOCK_DATA } from "../data/traineePhoneRecordsMockData";
import { MISSING_PHOTO_URL, TRAINEE_PHOTOS_MOCK_DATA } from "../data/traineePhotosMockData";
import { TRAINEE_RESTRICTIONS_MOCK_DATA } from "../data/traineeRestrictionsMockData";
import { TRAINEES_MOCK_DATA, type TraineeMockRecord } from "../data/traineesMockData";
import { TRAINEE_VOICE_MESSAGES_MOCK_DATA } from "../data/traineeVoiceMessagesMockData";
import { isTodayInRange } from "../mockDates";
import type { MockRequest } from "../mockRequest";

// רשומה כפי שהמוק שומר אותה: הדגל LOGI_ACTIVE והתאריכים
interface DatedRecord {
  isActive: boolean;
  dateStart: ISODateString;
  dateEnd: ISODateString;
}

/** כמו SP_AVIV_GET_TRAINEES (L-1): חניך נכלל כשהפנימייה שלו ברשימה או כשהאגף שלו ברשימה */
export function handleGetTrainees(request: MockRequest): GetTraineesResponse {
  const { idntInstitutionList, idntWingList } = request.body as GetTraineesRequest;

  // התשובה היא הרשימה עצמה (L-15)
  return TRAINEES_MOCK_DATA.filter(
    (trainee) => idntInstitutionList.includes(trainee.idntInstitution) || idntWingList.includes(trainee.wing.id),
  ).map(toTraineeListItem);
}

/** כתובת תמונת החניך. הפעולה האמיתית מחזירה את קובץ התמונה עצמו, ולכן הכתובת נכנסת ישירות ל-src */
export function resolveTraineePhotoUri(params: unknown): string {
  const { traineeId } = params as GetTraineePhotoRequest;
  return TRAINEE_PHOTOS_MOCK_DATA.get(Number(traineeId)) ?? MISSING_PHOTO_URL;
}

// הדגלים נגזרים מהרשומות עצמן, כמו שהפרוצדורה מחשבת אותם (I-19), כדי שיצירת רשומה תתעדכן גם ברשימה
function toTraineeListItem(record: TraineeMockRecord): TraineeListItemDto {
  const { staticFlags, ...traineeFields } = record;
  const activeRestrictions = TRAINEE_RESTRICTIONS_MOCK_DATA.filter(
    (restriction) => restriction.idntTrainee === record.idntTrainee && isActiveToday(restriction),
  );
  const activePhoneRecords = TRAINEE_PHONE_RECORDS_MOCK_DATA.filter(
    (phoneRecord) => phoneRecord.idntTrainee === record.idntTrainee && isActiveToday(phoneRecord),
  );
  const activeVoiceMessages = TRAINEE_VOICE_MESSAGES_MOCK_DATA.filter(
    (voiceMessage) => voiceMessage.traineeId === record.idntTrainee && isActiveToday(voiceMessage),
  );

  return {
    ...traineeFields,
    dateRestrictedUntil: latestEndDate(activeRestrictions),
    flags: {
      hasActiveFullRestriction: activeRestrictions.some((restriction) => restriction.numbDurationLimit === null),
      hasActiveMinutesRestriction: activeRestrictions.some((restriction) => restriction.numbDurationLimit !== null),
      hasActivePhoneRestriction: activePhoneRecords.some((phoneRecord) => !phoneRecord.isPermit),
      hasActivePhonePermit: activePhoneRecords.some((phoneRecord) => phoneRecord.isPermit),
      // "הודעה רגילה" מושמעת פעם אחת; "אינטראקטיבית" היא ההודעה החוזרת
      hasActiveMessage: activeVoiceMessages.some((voiceMessage) => !voiceMessage.repeatDuringCall),
      hasActiveInteractiveMessage: activeVoiceMessages.some((voiceMessage) => voiceMessage.repeatDuringCall),
      ...staticFlags,
    },
  };
}

function isActiveToday(record: DatedRecord): boolean {
  return record.isActive && isTodayInRange(record.dateStart, record.dateEnd);
}

// "מוגבל עד" = תאריך הסיום המאוחר מבין ההגבלות הפעילות (OQ-03, L-3)
function latestEndDate(records: DatedRecord[]): ISODateString | null {
  if (records.length === 0) {
    return null;
  }
  return records.reduce(
    (latest, record) => (record.dateEnd > latest ? record.dateEnd : latest),
    records[0].dateEnd,
  );
}
