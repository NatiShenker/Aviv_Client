import { IpsDrawer, IpsRadioListMobile, type IpsRadioListMobileValue } from "ui-library";
import { HISTORY_TEXTS } from "./historyTexts";

const DRAWER_HEIGHT = "auto";

export interface HistorySortRow {
  value: string;
  label: string;
}

interface HistorySortDrawerProps {
  open: boolean;
  onClose: () => void;
  rows: HistorySortRow[];
  selectedValue: string;
  onChange: (value: string) => void;
}

/** מגירת המיון של מסך היסטוריה: שורה לכל צירוף של שדה וכיוון. הבחירה מוחלת מיד (ספק 00 §3.25) */
export default function HistorySortDrawer({ open, onClose, rows, selectedValue, onChange }: HistorySortDrawerProps) {
  const title = HISTORY_TEXTS.toolbar.sort;

  return (
    <IpsDrawer
      open={open}
      anchor="bottom"
      size={DRAWER_HEIGHT}
      title={title}
      closeButtonLabel={HISTORY_TEXTS.drawers.close}
      onClose={onClose}
      rtl
    >
      <IpsRadioListMobile
        aria-label={title}
        options={rows}
        value={selectedValue}
        onChange={(value: IpsRadioListMobileValue) => onChange(String(value))}
      />
    </IpsDrawer>
  );
}
