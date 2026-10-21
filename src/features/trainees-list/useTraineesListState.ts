import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import type { InstituteWithWingsDto, WingLocationDto } from "@/types/organization.schema";
import type { TraineeListItemDto } from "@/types/trainees.schema";
import { useTraineesListData } from "./useTraineesListData";
import { useTraineesListFilters, type TraineesListFilters } from "./useTraineesListFilters";

// הפניות קבועות, כדי שרשימה ריקה לא תיחשב "רשימה חדשה" בכל רינדור
const NO_TRAINEES: TraineeListItemDto[] = [];
const NO_LOCATIONS: WingLocationDto[] = [];

interface TraineesListState {
  trainees: AsyncResource<TraineeListItemDto[]>;
  locations: AsyncResource<WingLocationDto[]>;
  listFilters: TraineesListFilters;
  /** הרשימה של הפנימייה הנבחרת עוד בדרך - בזמן הזה מוצגים שלדים */
  isListLoading: boolean;
}

/** הנתונים של מסך החניכים יחד עם החיפוש, הסינון והמיון שלהם - משותף למובייל ולדסקטופ */
export function useTraineesListState(institute: InstituteWithWingsDto | null): TraineesListState {
  const { trainees, locations } = useTraineesListData(institute);
  const listFilters = useTraineesListFilters(trainees.data ?? NO_TRAINEES, institute, locations.data ?? NO_LOCATIONS);
  // idle עם פנימייה נבחרת הוא הרגע שלפני שהטעינה התחילה (כמו ב-TraineesListStates)
  const isListLoading = institute !== null && (trainees.status === "idle" || trainees.status === "loading");
  return { trainees, locations, listFilters, isListLoading };
}
