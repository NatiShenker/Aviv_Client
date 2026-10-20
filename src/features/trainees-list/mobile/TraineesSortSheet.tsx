import SortSheet from "@/shells/mobile/SortSheet";
import { TRAINEE_SORT_OPTIONS, TRAINEE_SORT_ROWS, type TraineeSortOption } from "../traineesListOptions";

interface TraineesSortSheetProps {
  open: boolean;
  onClose: () => void;
  sort: TraineeSortOption;
  onSortChange: (sort: TraineeSortOption) => void;
}

/** מיון רשימת החניכים: השורה שנבחרה מתורגמת לאפשרות המיון שלה */
export default function TraineesSortSheet({ open, onClose, sort, onSortChange }: TraineesSortSheetProps) {
  const handleChange = (selectedKey: string) => {
    const selectedOption = TRAINEE_SORT_OPTIONS.find((option) => option.key === selectedKey);
    if (selectedOption) {
      onSortChange(selectedOption);
    }
  };

  return (
    <SortSheet open={open} onClose={onClose} rows={TRAINEE_SORT_ROWS} selectedValue={sort.key} onChange={handleChange} />
  );
}
