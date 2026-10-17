import type { InstituteWithWingsDto, WingLocationDto } from "@/schemas/organization.schema";
import type { TraineeListItemDto } from "@/schemas/trainees.schema";
import {
  getCachedLocations,
  getLocationsAndVirtualLocations,
  type LocationsQuery,
} from "@/services/locationsService";
import { getCachedTrainees, getTrainees } from "@/services/traineesService";
import { useAsyncResource, type AsyncResource } from "@/shared/hooks/useAsyncResource";

interface TraineesListData {
  trainees: AsyncResource<TraineeListItemDto[]>;
  /** נטען ברקע, במקביל לחניכים. משמש את קבוצת "מיקום באגף" בסינון */
  locations: AsyncResource<WingLocationDto[]>;
}

const isEmptyList = (list: unknown[]) => list.length === 0;

/**
 * הנתונים של מסך החניכים לפנימייה הנבחרת. החלפת פנימייה טוענת מחדש;
 * חזרה למסך מציגה מיד את מה שכבר נטען (עד רענון הדף), ו"נסה שוב" טוען תמיד מהשרת.
 */
export function useTraineesListData(institute: InstituteWithWingsDto | null): TraineesListData {
  const instituteId = institute?.id ?? null;

  const locationsQueryFor = (selectedInstituteId: number): LocationsQuery => ({
    instituteIds: [selectedInstituteId],
    wingIds: institute?.wings.map((wing) => wing.id) ?? [],
  });

  const trainees = useAsyncResource({
    requestKey: instituteId,
    load: (selectedInstituteId) => getTrainees([selectedInstituteId]),
    readCache: (selectedInstituteId) => getCachedTrainees([selectedInstituteId]),
    isEmpty: isEmptyList,
  });

  const locations = useAsyncResource({
    requestKey: instituteId,
    load: (selectedInstituteId) => getLocationsAndVirtualLocations(locationsQueryFor(selectedInstituteId)),
    readCache: (selectedInstituteId) => getCachedLocations(locationsQueryFor(selectedInstituteId)),
  });

  return { trainees, locations };
}
