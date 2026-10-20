import { formatDevicesSelection } from "@/features/records/form/call-conditions/callConditionsLogic";
import { CALL_CONDITIONS_TEXTS } from "@/features/records/form/call-conditions/callConditionsTexts";
import type { ExistingPermitBriefDto, SourceRestrictionSummaryDto } from "@/types/phone-exceptions.schema";
import { formatDateRange, formatTimeRange } from "@/utils/dates";
import { isolateLtr } from "@/utils/text";
import { buildScopeLabel } from "../../numberRestrictionsLogic";
import { NUMBER_RESTRICTIONS_TEXTS } from "../../numberRestrictionsTexts";
import type { PermitLookup } from "../numberRecordFormLogic";

const TEXTS = NUMBER_RESTRICTIONS_TEXTS.form.picker;
const PARTS_SEPARATOR = NUMBER_RESTRICTIONS_TEXTS.values.partsSeparator;

/** מה שבוחר ההגבלה מציג במצב הנוכחי */
export interface RestrictionPickerView {
  title: string;
  hint: string | null;
  visibleRestrictions: SourceRestrictionSummaryDto[];
  /** הכפתור בשורת הכותרת: "החלפה" כשהרשימה סגורה על בחירה, "ביטול" כשהיא נפתחה מחדש */
  headerAction: "change" | "cancelChange" | null;
  /** בזמן בחירה בכל כרטיס יש שורת "בחירה" (ובכרטיס הנבחר - "נבחרה") */
  isChoosing: boolean;
}

/**
 * מצבי הבוחר (ספק 04 form §4.4, עם ההחלטה על כפתור בחירה ייעודי):
 * תוצאה אחת - נבחרה אוטומטית; כמה ואין בחירה - כל הכרטיסים לבחירה;
 * נבחרה - רק הכרטיס הנבחר ו"החלפה"; אחרי "החלפה" - כל הכרטיסים ו"ביטול".
 */
export function buildRestrictionPickerView(
  results: SourceRestrictionSummaryDto[],
  selectedRestriction: SourceRestrictionSummaryDto | null,
  isPickerOpen: boolean,
): RestrictionPickerView {
  if (results.length === 1) {
    return {
      title: TEXTS.selectedTitle,
      hint: TEXTS.singleResultHint,
      visibleRestrictions: results,
      headerAction: null,
      isChoosing: false,
    };
  }

  if (isPickerOpen || selectedRestriction === null) {
    return {
      title: TEXTS.chooseTitle,
      hint: TEXTS.resultsCountHint(results.length),
      visibleRestrictions: results,
      headerAction: selectedRestriction === null ? null : "cancelChange",
      isChoosing: true,
    };
  }

  return {
    title: TEXTS.selectedTitle,
    hint: null,
    visibleRestrictions: [selectedRestriction],
    headerAction: "change",
    isChoosing: false,
  };
}

/** ההודעה שקורא מסך משמיע כשהחיפוש מסתיים (ספק 04 form §4.3). ריק = אין מה להשמיע */
export function buildLookupAnnouncement(lookup: PermitLookup): string {
  if (lookup.status !== "done") return "";
  if (lookup.results.length === 0) return NUMBER_RESTRICTIONS_TEXTS.form.noRestrictions.text;
  if (lookup.results.length === 1) return TEXTS.singleResultHint;
  return TEXTS.resultsCountHint(lookup.results.length);
}

/** שם הכפתור "בחירה" לקורא מסך: איזו הגבלה בוחרים */
export function buildChooseRestrictionLabel(restriction: SourceRestrictionSummaryDto): string {
  const range = formatDateRange(restriction.startDate, restriction.endDate);
  return TEXTS.chooseLabel(buildScopeLabel(restriction), isolateLtr(range));
}

// ── ההיתרים הקיימים לחניך על ההגבלה (ספק 04 overview §3) ──

/**
 * לכל היתר: שעות או "כל היום"; אחר כך מכשירים (אחד - השם, כמה - "{n} מכשירים") אם יש;
 * אחר כך "עד X דק'" אם יש. כמה היתרים מופרדים ב-"; ".
 */
export function formatExistingPermitsSummary(permits: ExistingPermitBriefDto[]): string {
  return permits.map(formatExistingPermit).join(TEXTS.existingPermitsSeparator);
}

function formatExistingPermit(permit: ExistingPermitBriefDto): string {
  const hours =
    permit.startTime && permit.endTime
      ? isolateLtr(formatTimeRange(permit.startTime, permit.endTime))
      : CALL_CONDITIONS_TEXTS.values.allDay;
  const parts = [hours];

  if (permit.devices.length > 0) {
    parts.push(formatDevicesSelection(permit.devices.map((device) => device.name)));
  }
  if (permit.durationMinutes !== null) {
    parts.push(CALL_CONDITIONS_TEXTS.values.durationUpTo(permit.durationMinutes));
  }
  return parts.join(PARTS_SEPARATOR);
}
