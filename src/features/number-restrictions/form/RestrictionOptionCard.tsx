import { IpsButton } from "ui-library";
import type { SourceRestrictionSummaryDto } from "@/schemas/phone-exceptions.schema";
import AppIcon from "@/shared/icons/AppIcon";
import { NUMBER_RESTRICTIONS_TEXTS } from "../numberRestrictionsTexts";
import { buildChooseRestrictionLabel, formatExistingPermitsSummary } from "./restrictionPickerLogic";
import RestrictionSummaryLines from "./RestrictionSummaryLines";

const TEXTS = NUMBER_RESTRICTIONS_TEXTS.form.picker;

interface RestrictionOptionCardProps {
  restriction: SourceRestrictionSummaryDto;
  isSelected: boolean;
  /** בזמן בחירה: שורת "בחירה" בתחתית הכרטיס (בכרטיס הנבחר - "נבחרה") */
  isChoosing: boolean;
  onChoose: () => void;
}

/**
 * הגבלה שהיתר יכול לחול עליה. גוף הכרטיס הוא מידע בלבד; הבחירה רק בכפתור "בחירה" בתחתית,
 * כדי שלא ייבחר כרטיס בטעות בזמן גלילה או קריאה.
 */
export default function RestrictionOptionCard({
  restriction,
  isSelected,
  isChoosing,
  onChoose,
}: RestrictionOptionCardProps) {
  const hasExistingPermits = restriction.existingTraineePermits.length > 0;
  const borderClass = isSelected ? "border-primary" : "border-divider";

  return (
    <article className={`rounded-card border bg-paper ${borderClass}`}>
      <div className="p-4">
        <RestrictionSummaryLines restriction={restriction} />
        {/* מידע בלבד - לא מונע היתר נוסף (OQ-12) */}
        {hasExistingPermits && (
          <p className="mt-1 text-sm text-text-primary">
            {TEXTS.existingPermits(formatExistingPermitsSummary(restriction.existingTraineePermits))}
          </p>
        )}
      </div>

      {isChoosing && (
        <div className="flex min-h-12 items-center justify-end border-t border-divider px-2">
          {isSelected ? (
            <SelectedTag />
          ) : (
            <IpsButton
              variant="text"
              size="large"
              endIcon={<AppIcon name="chevronLeft" />}
              aria-label={buildChooseRestrictionLabel(restriction)}
              onClick={onChoose}
            >
              {TEXTS.choose}
            </IpsButton>
          )}
        </div>
      )}
    </article>
  );
}

// הכרטיס שכבר נבחר, ברשימה שנפתחה מחדש עם "החלפה". "ביטול" בכותרת חוזר אליו
function SelectedTag() {
  return (
    <span className="flex items-center gap-1 px-2 text-sm font-medium text-primary">
      <AppIcon name="check" size="small" />
      {TEXTS.selectedTag}
    </span>
  );
}
