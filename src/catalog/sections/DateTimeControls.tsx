import type { Moment } from "moment";
import { useState } from "react";
import { IpsDatePicker, IpsTimePicker } from "ui-library";
import CatalogSection from "../CatalogSection";
import { CATALOG_TEXTS } from "../catalogTexts";

const TEXTS = CATALOG_TEXTS.dateTime;

export default function DateTimeControls() {
  const [startDate, setStartDate] = useState<Date | null>(() => new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Moment | null>(null);
  const [endTime, setEndTime] = useState<Moment | null>(null);

  return (
    <CatalogSection title={CATALOG_TEXTS.sectionTitles.dateTime}>
      <div className="grid grid-cols-2 gap-2">
        <IpsDatePicker label={TEXTS.startDate} value={startDate} onChange={setStartDate} rtl />
        <IpsDatePicker
          label={TEXTS.endDate}
          value={endDate}
          onChange={setEndDate}
          minDate={startDate ?? undefined}
          rtl
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <IpsTimePicker label={TEXTS.startTime} value={startTime} onChange={setStartTime} ampm={false} />
        <IpsTimePicker label={TEXTS.endTime} value={endTime} onChange={setEndTime} ampm={false} />
      </div>
    </CatalogSection>
  );
}
