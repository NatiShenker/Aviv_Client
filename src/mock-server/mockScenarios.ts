/*
 * תרחישי בדיקה לשרת המוק, נקבעים מפרמטרים בכתובת בעליית האפליקציה ונשמרים לכל הביקור.
 * דוגמה: ?mockDelayMs=2000&mockError=trainees&mockNetworkError=locations&mockEmpty=trainees&mockSingleInstitute=true
 */

/** שם קבוצת הנתונים שאפשר לכוון אליה תרחיש */
export type MockScenarioKey =
  | "institutes"
  | "permissions"
  | "trainees"
  | "locations"
  | "traineeRestrictions"
  | "saveTraineeRestriction"
  | "phoneRecords"
  | "phoneRestrictionsLookup"
  | "savePhoneRecord"
  | "devices"
  | "reasons"
  | "approvers"
  | "approvedFiles"
  | "sharePointUpload";

export interface MockScenarios {
  delayMs: number;
  /** שגיאת שרת (500) */
  errorKeys: MockScenarioKey[];
  /** כשל רשת - אין תשובה מהשרת */
  networkErrorKeys: MockScenarioKey[];
  /** תשובה תקינה וריקה */
  emptyKeys: MockScenarioKey[];
  /** השרת מחזיר פנימייה אחת בלבד (לבדיקת הבחירה האוטומטית) */
  singleInstitute: boolean;
}

const QUERY_PARAMS = {
  delayMs: "mockDelayMs",
  error: "mockError",
  networkError: "mockNetworkError",
  empty: "mockEmpty",
  singleInstitute: "mockSingleInstitute",
} as const;

const DEFAULT_DELAY_MS = 700;
const KEYS_SEPARATOR = ",";
const TRUE_VALUE = "true";
const ALL_SCENARIO_KEYS: MockScenarioKey[] = [
  "institutes",
  "permissions",
  "trainees",
  "locations",
  "traineeRestrictions",
  "saveTraineeRestriction",
  "phoneRecords",
  "phoneRestrictionsLookup",
  "savePhoneRecord",
  "devices",
  "reasons",
  "approvers",
  "approvedFiles",
  "sharePointUpload",
];

export function readMockScenarios(search: string): MockScenarios {
  const params = new URLSearchParams(search);

  return {
    delayMs: readDelay(params.get(QUERY_PARAMS.delayMs)),
    errorKeys: readScenarioKeys(params.get(QUERY_PARAMS.error)),
    networkErrorKeys: readScenarioKeys(params.get(QUERY_PARAMS.networkError)),
    emptyKeys: readScenarioKeys(params.get(QUERY_PARAMS.empty)),
    singleInstitute: params.get(QUERY_PARAMS.singleInstitute) === TRUE_VALUE,
  };
}

function readDelay(rawValue: string | null): number {
  const delay = Number(rawValue);
  const isValidDelay = rawValue !== null && Number.isFinite(delay) && delay >= 0;
  return isValidDelay ? delay : DEFAULT_DELAY_MS;
}

function readScenarioKeys(rawValue: string | null): MockScenarioKey[] {
  if (!rawValue) {
    return [];
  }
  return rawValue
    .split(KEYS_SEPARATOR)
    .map((key) => key.trim())
    .filter(isScenarioKey);
}

function isScenarioKey(value: string): value is MockScenarioKey {
  return ALL_SCENARIO_KEYS.includes(value as MockScenarioKey);
}
