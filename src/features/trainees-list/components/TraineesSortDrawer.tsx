import { IpsDrawer, IpsRadioListMobile, type IpsRadioListMobileValue } from "ui-library";
import { TRAINEE_SORT_OPTIONS, type TraineeSortOption } from "../traineesListOptions";
import { TRAINEES_LIST_TEXTS } from "../traineesListTexts";

const TEXTS = TRAINEES_LIST_TEXTS.sortDrawer;
const DRAWER_HEIGHT = "auto";

const SORT_ROWS = TRAINEE_SORT_OPTIONS.map((option) => ({ value: option.key, label: option.label }));

interface TraineesSortDrawerProps {
  open: boolean;
  onClose: () => void;
  sort: TraineeSortOption;
  onSortChange: (sort: TraineeSortOption) => void;
}

/** מגירת המיון: שורה לכל צירוף של שדה וכיוון. הבחירה מוחלת מיד, והמגירה נשארת פתוחה */
export default function TraineesSortDrawer({ open, onClose, sort, onSortChange }: TraineesSortDrawerProps) {
  const handleChange = (selectedKey: IpsRadioListMobileValue) => {
    const selectedOption = TRAINEE_SORT_OPTIONS.find((option) => option.key === selectedKey);
    if (selectedOption) {
      onSortChange(selectedOption);
    }
  };

  return (
    <IpsDrawer
      open={open}
      anchor="bottom"
      size={DRAWER_HEIGHT}
      title={TEXTS.title}
      closeButtonLabel={TRAINEES_LIST_TEXTS.drawers.close}
      onClose={onClose}
      rtl
    >
      <IpsRadioListMobile aria-label={TEXTS.title} options={SORT_ROWS} value={sort.key} onChange={handleChange} />
    </IpsDrawer>
  );
}
