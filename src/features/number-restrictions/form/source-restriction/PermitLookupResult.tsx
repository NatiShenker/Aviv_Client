import { IpsButton } from "ui-library";
import AppIcon from "@/shared/components/AppIcon";
import { NUMBER_RESTRICTIONS_TEXTS } from "../../numberRestrictionsTexts";
import type { NumberRecordFormController } from "../useNumberRecordForm";
import SourceRestrictionPicker, { type SourceRestrictionOptionsListComponent } from "./SourceRestrictionPicker";
import { buildLookupAnnouncement } from "./sourceRestrictionPickerLogic";

const TEXTS = NUMBER_RESTRICTIONS_TEXTS.form.noRestrictions;

interface PermitLookupResultProps {
  form: NumberRecordFormController;
  /** רשימת ההגבלות לבחירה, בתצוגה של הפריסה */
  SourceRestrictionOptionsList: SourceRestrictionOptionsListComponent;
}

/** תוצאת החיפוש של היתר חדש: אין הגבלות על המספר, או בוחר ההגבלה (ספק 04 form §3.2) */
export default function PermitLookupResult({ form, SourceRestrictionOptionsList }: PermitLookupResultProps) {
  const { lookup } = form.state;
  const isDone = lookup.status === "done";

  return (
    <>
      {/* קורא מסך משמיע שהחיפוש הסתיים ומה נמצא (ספק 04 form §4.3) */}
      <p className="sr-only" aria-live="polite">
        {buildLookupAnnouncement(lookup)}
      </p>
      {isDone && lookup.results.length === 0 && <NoRestrictionsCard onRestrictNumber={form.restrictNumber} />}
      {isDone && lookup.results.length > 0 && (
        <SourceRestrictionPicker form={form} SourceRestrictionOptionsList={SourceRestrictionOptionsList} />
      )}
    </>
  );
}

interface NoRestrictionsCardProps {
  onRestrictNumber: () => void;
}

// המספר פתוח לחניך, ולכן אין צורך בהיתר. אפשר לעבור ישר להגבלת המספר (ספק 04 form §4.6)
function NoRestrictionsCard({ onRestrictNumber }: NoRestrictionsCardProps) {
  return (
    <div className="mt-4 rounded-card border border-divider bg-paper p-4 motion-safe:animate-fade-in">
      <p className="text-sm text-text-primary">{TEXTS.text}</p>
      <div className="mt-2">
        <IpsButton variant="text" size="small" endIcon={<AppIcon name="chevronLeft" />} onClick={onRestrictNumber}>
          {TEXTS.restrictNumber}
        </IpsButton>
      </div>
    </div>
  );
}
