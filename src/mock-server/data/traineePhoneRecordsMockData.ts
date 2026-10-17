import type {
  TraineePhonePermitRecordDto,
  TraineePhoneRecordDto,
  TraineePhoneRestrictionRecordDto,
} from "@/schemas/phone-exceptions.schema";
import { daysFromToday } from "../mockDates";
import { buildAuditMetadata, buildDecisionApproval } from "./recordMetadataBuilders";
import { PHONE_EXCEPTION_REASONS_MOCK_DATA } from "./reasonsMockData";
import { SOURCE_PHONE_RESTRICTIONS_MOCK_DATA } from "./sourcePhoneRestrictionsMockData";
import { TRAINEES_MOCK_DATA, type TraineeMockRecord } from "./traineesMockData";

// פיזור קבוע בין החניכים: מי עם הגבלה פעילה למספר ומי עם היתר פעיל למספר
const PHONE_RECORD_PATTERN = {
  restriction: { every: 7, offset: 3 },
  permit: { every: 7, offset: 6 },
} as const;

const RESTRICTION_DAYS = { start: -3, end: 30 } as const;
const PERMIT_DAYS = { start: -1, end: 14 } as const;
const PERMIT_DURATION_MINUTES = 10;

// מספר טלפון ייחודי לכל רשומה: קידומת קבועה + מספר הרשומה
const PHONE_NUMBER_PREFIX = "0501000";
const PHONE_SUFFIX_DIGITS = 3;
const PHONE_NUMBER_ID_BASE = 7000;
const RESTRICTION_NUMBER_ID_BASE = 6000;

function reasonFor(recordId: number): string {
  return PHONE_EXCEPTION_REASONS_MOCK_DATA[recordId % PHONE_EXCEPTION_REASONS_MOCK_DATA.length].name;
}

function buildRestrictionRecord(trainee: TraineeMockRecord, id: number): TraineePhoneRestrictionRecordDto {
  const startDate = daysFromToday(RESTRICTION_DAYS.start);
  const endDate = daysFromToday(RESTRICTION_DAYS.end);
  const decision = buildDecisionApproval(id, reasonFor(id));

  return {
    type: "restriction",
    id,
    restrictionNumberId: RESTRICTION_NUMBER_ID_BASE + id,
    inlinePermitId: null,
    traineeId: trainee.id,
    phoneNumberId: PHONE_NUMBER_ID_BASE + id,
    phoneNumber: `${PHONE_NUMBER_PREFIX}${String(id).padStart(PHONE_SUFFIX_DIGITS, "0")}`,
    startDate,
    endDate,
    durationMinutes: null,
    startTime: null,
    endTime: null,
    devices: [],
    ...decision,
    ...buildAuditMetadata(startDate, endDate, RESTRICTION_DAYS.start, decision.approver.id),
  };
}

function buildPermitRecord(trainee: TraineeMockRecord, id: number): TraineePhonePermitRecordDto {
  const sourceRestriction = SOURCE_PHONE_RESTRICTIONS_MOCK_DATA[id % SOURCE_PHONE_RESTRICTIONS_MOCK_DATA.length];
  const startDate = daysFromToday(PERMIT_DAYS.start);
  const endDate = daysFromToday(PERMIT_DAYS.end);
  const decision = buildDecisionApproval(id, reasonFor(id));

  return {
    type: "permit",
    id,
    traineeId: trainee.id,
    phoneNumberId: sourceRestriction.phoneNumberId,
    phoneNumber: sourceRestriction.phoneNumber,
    startDate,
    endDate,
    sourceRestriction,
    durationMinutes: PERMIT_DURATION_MINUTES,
    startTime: null,
    endTime: null,
    devices: [],
    ...decision,
    ...buildAuditMetadata(startDate, endDate, PERMIT_DAYS.start, decision.approver.id),
  };
}

type PhoneRecordKind = TraineePhoneRecordDto["type"];

function recordKindsForTrainee(index: number): PhoneRecordKind[] {
  const kinds: PhoneRecordKind[] = [];
  if (index % PHONE_RECORD_PATTERN.restriction.every === PHONE_RECORD_PATTERN.restriction.offset) {
    kinds.push("restriction");
  }
  if (index % PHONE_RECORD_PATTERN.permit.every === PHONE_RECORD_PATTERN.permit.offset) {
    kinds.push("permit");
  }
  return kinds;
}

const RECORD_SEEDS = TRAINEES_MOCK_DATA.flatMap((trainee, index) =>
  recordKindsForTrainee(index).map((kind) => ({ trainee, kind })),
);

export const TRAINEE_PHONE_RECORDS_MOCK_DATA: TraineePhoneRecordDto[] = RECORD_SEEDS.map(({ trainee, kind }, index) => {
  const id = index + 1;
  return kind === "restriction" ? buildRestrictionRecord(trainee, id) : buildPermitRecord(trainee, id);
});
