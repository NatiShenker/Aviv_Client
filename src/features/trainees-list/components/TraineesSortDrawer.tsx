import SortSheet from "@/shells/mobile/SortSheet";
import { TRAINEE_SORT_OPTIONS, type TraineeSortOption } from "../traineesListOptions";

const SORT_ROWS = TRAINEE_SORT_OPTIONS.map((option) => ({ value: option.key, label: option.label }));

interface TraineesSortDrawerProps {
  open: boolean;
  onClose: () => void;
  sort: TraineeSortOption;
  onSortChange: (sort: TraineeSortOption) => void;
}

/** מיון רשימת החניכים: השורה שנבחרה מתורגמת לאפשרות המיון שלה */
export default function TraineesSortDrawer({ open, onClose, sort, onSortChange }: TraineesSortDrawerProps) {
  const handleChange = (selectedKey: string) => {
    const selectedOption = TRAINEE_SORT_OPTIONS.find((option) => option.key === selectedKey);
    if (selectedOption) {
      onSortChange(selectedOption);
    }
  };

  return <SortSheet open={open} onClose={onClose} rows={SORT_ROWS} selectedValue={sort.key} onChange={handleChange} />;
}
