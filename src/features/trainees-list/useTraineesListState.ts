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
}

/** הנתונים של מסך החניכים יחד עם החיפוש, הסינון והמיון שלהם - משותף למובייל ולדסקטופ */
export function useTraineesListState(institute: InstituteWithWingsDto | null): TraineesListState {
  const { trainees, locations } = useTraineesListData(institute);
  const listFilters = useTraineesListFilters(trainees.data ?? NO_TRAINEES, institute, locations.data ?? NO_LOCATIONS);
  return { trainees, locations, listFilters };
}
