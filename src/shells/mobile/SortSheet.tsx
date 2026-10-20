import { IpsDrawer, IpsRadioListMobile, type IpsRadioListMobileValue } from "ui-library";
import { MOBILE_SHELL_TEXTS } from "./mobileShellTexts";

const TEXTS = MOBILE_SHELL_TEXTS.sortSheet;

const SHEET_HEIGHT = "auto";

export interface SortSheetRow {
  value: string;
  label: string;
}

interface SortSheetProps {
  open: boolean;
  onClose: () => void;
  rows: SortSheetRow[];
  selectedValue: string;
  onChange: (value: string) => void;
}

/** מגירת המיון (ספק 00 §3.25): שורה לכל צירוף של שדה וכיוון. בחירה מחילה את המיון וסוגרת את המגירה */
export default function SortSheet({ open, onClose, rows, selectedValue, onChange }: SortSheetProps) {
  const handleChange = (value: IpsRadioListMobileValue) => {
    onChange(String(value));
    onClose();
  };

  return (
    <IpsDrawer
      open={open}
      anchor="bottom"
      size={SHEET_HEIGHT}
      title={TEXTS.title}
      closeButtonLabel={TEXTS.close}
      onClose={onClose}
      rtl
    >
      <IpsRadioListMobile
        aria-label={TEXTS.title}
        options={rows}
        value={selectedValue}
        onChange={handleChange}
      />
    </IpsDrawer>
  );
}
