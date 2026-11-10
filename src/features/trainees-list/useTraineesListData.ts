import { useEffect } from "react";
import { prefetchInstituteDevices } from "@/services/devicesService";
import {
  getCachedLocations,
  getLocationsAndVirtualLocations,
  type LocationsQuery,
} from "@/services/locationsService";
import { prefetchReasons } from "@/services/reasonsService";
import { getCachedTrainees, getTrainees } from "@/services/traineesService";
import { isEmptyList, useAsyncResource, type AsyncResource } from "@/shared/hooks/useAsyncResource";
import type { InstituteWithWingsDto, WingLocationDto } from "@/types/organization.schema";
import type { TraineeListItemDto } from "@/types/trainees.schema";

interface TraineesListData {
  trainees: AsyncResource<TraineeListItemDto[]>;
  /** נטען ברקע, במקביל לחניכים. משמש את קבוצת "מיקום באגף" בסינון */
  locations: AsyncResource<WingLocationDto[]>;
}

/**
 * הנתונים של מסך החניכים לפנימייה הנבחרת. החלפת פנימייה טוענת מחדש;
 * חזרה למסך מציגה מיד את מה שכבר נטען (עד רענון הדף), ו"טעינה מחדש" טוען תמיד מהשרת.
 */
export function useTraineesListData(institute: InstituteWithWingsDto | null): TraineesListData {
  const instituteId = institute?.id ?? null;

  const locationsQueryFor = (selectedInstituteId: number): LocationsQuery => ({
    instituteIds: [selectedInstituteId],
    wingIds: institute?.wings.map((wing) => wing.wingId) ?? [],
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

  // המכשירים ורשימות הסיבות נטענים ברקע מיד אחרי החניכים, כדי שהטפסים ייפתחו איתם (ספק 00 §6; KC-1)
  useEffect(() => {
    if (trainees.status === "success" && instituteId !== null) {
      prefetchInstituteDevices(instituteId);
      prefetchReasons();
    }
  }, [trainees.status, instituteId]);

  return { trainees, locations };
}
