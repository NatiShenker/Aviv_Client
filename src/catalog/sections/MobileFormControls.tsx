import { useState } from "react";
import {
  IpsDatePickerMobile,
  IpsRadioGroupMobile,
  IpsSwitch,
  IpsTextAreaMobile,
  IpsTextFieldMobile,
  IpsTimePickerMobile,
  type IpsRadioGroupMobileValue,
} from "ui-library";
import { formatShortDate } from "@/shared/formatting/dateFormat";
import AppIcon from "@/shared/icons/AppIcon";
import CatalogSection from "../CatalogSection";
import { CATALOG_TEXTS } from "../catalogTexts";

const TEXTS = CATALOG_TEXTS.mobileForm;
const DIGITS_ONLY = /\D/g;
const DURATION_MAX_LENGTH = 3;
const INITIAL_START_DATE = "2026-10-18";
const INITIAL_END_DATE = "2026-10-19";

const LIMIT_OPTIONS = [
  { value: "full", label: TEXTS.fullLimit },
  { value: "limited", label: TEXTS.durationLimit },
];

/** פקדי הטופס הנייטיביים למובייל מהספרייה, בכל המצבים שלהם */
export default function MobileFormControls() {
  const [showErrors, setShowErrors] = useState(false);
  const [showDisabled, setShowDisabled] = useState(false);
  const [startDate, setStartDate] = useState(INITIAL_START_DATE);
  const [endDate, setEndDate] = useState(INITIAL_END_DATE);
  const [areDatesTouched, setAreDatesTouched] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [limitType, setLimitType] = useState<IpsRadioGroupMobileValue>("full");
  const [minutes, setMinutes] = useState("");
  const [details, setDetails] = useState("");

  const errorText = showErrors ? TEXTS.errorText : undefined;

  const changeDate = (setDate: (value: string) => void) => (value: string) => {
    setDate(value);
    setAreDatesTouched(true);
  };

  return (
    <CatalogSection title={CATALOG_TEXTS.sectionTitles.mobileForm}>
      <IpsSwitch checked={showErrors} onChange={(event) => setShowErrors(event.target.checked)} label={TEXTS.showErrors} />
      <IpsSwitch
        checked={showDisabled}
        onChange={(event) => setShowDisabled(event.target.checked)}
        label={TEXTS.showDisabled}
      />

      <div className="grid grid-cols-2 gap-2">
        <IpsDatePickerMobile
          label={TEXTS.pickDate}
          aria-label={TEXTS.startDate}
          placeholder={TEXTS.datePlaceholder}
          value={startDate}
          formatValue={formatShortDate}
          muted={!areDatesTouched}
          onChange={changeDate(setStartDate)}
          error={showErrors}
          disabled={showDisabled}
        />
        <IpsDatePickerMobile
          aria-label={TEXTS.endDate}
          placeholder={TEXTS.datePlaceholder}
          value={endDate}
          min={startDate}
          formatValue={formatShortDate}
          muted={!areDatesTouched}
          onChange={changeDate(setEndDate)}
          error={showErrors}
          helperText={errorText}
          disabled={showDisabled}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <IpsTimePickerMobile
          label={TEXTS.pickTime}
          aria-label={TEXTS.startTime}
          placeholder={TEXTS.timePlaceholder}
          clearButtonLabel={TEXTS.clearStartTime}
          value={startTime}
          onChange={setStartTime}
          error={showErrors}
          disabled={showDisabled}
        />
        <IpsTimePickerMobile
          aria-label={TEXTS.endTime}
          placeholder={TEXTS.timePlaceholder}
          clearButtonLabel={TEXTS.clearEndTime}
          value={endTime}
          onChange={setEndTime}
          error={showErrors}
          helperText={errorText}
          disabled={showDisabled}
        />
      </div>

      <IpsRadioGroupMobile
        aria-label={TEXTS.limitType}
        options={LIMIT_OPTIONS}
        value={limitType}
        onChange={setLimitType}
        disabled={showDisabled}
      />

      <div className="grid grid-cols-2 gap-2">
        <IpsTextFieldMobile
          label={TEXTS.durationLabel}
          required
          inputMode="numeric"
          maxLength={DURATION_MAX_LENGTH}
          placeholder={TEXTS.durationPlaceholder}
          suffix={TEXTS.minutesUnit}
          endIcon={<AppIcon name="timer" />}
          clearButtonLabel={TEXTS.clearDuration}
          value={minutes}
          onChange={(value) => setMinutes(value.replace(DIGITS_ONLY, ""))}
          error={showErrors}
          helperText={errorText}
          disabled={showDisabled}
        />
      </div>

      <IpsTextAreaMobile
        label={TEXTS.detailsLabel}
        placeholder={TEXTS.detailsPlaceholder}
        value={details}
        onChange={setDetails}
        error={showErrors}
        helperText={errorText}
        disabled={showDisabled}
      />
    </CatalogSection>
  );
}
