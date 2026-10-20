import { useMemo } from "react";
import type { IpsSelectOption } from "ui-library";
import type { WingDto, WingLocationDto } from "@/types/organization.schema";
import { buildLocationFilterOptions, buildWingFilterOptions } from "./traineesFilterFieldsLogic";

interface TraineeFilterOptions {
  wingOptions: IpsSelectOption[];
  locationOptions: IpsSelectOption[];
}

/** האפשרויות של שדות האגף והמיקום. המיקומים מצטמצמים לאגפים שנבחרו */
export function useTraineeFilterOptions(
  wings: WingDto[],
  locations: WingLocationDto[] | null,
  selectedWingIds: number[],
): TraineeFilterOptions {
  const wingOptions = useMemo(() => buildWingFilterOptions(wings), [wings]);

  const locationOptions = useMemo(
    () => buildLocationFilterOptions(locations ?? [], selectedWingIds, wings),
    [locations, selectedWingIds, wings],
  );

  return { wingOptions, locationOptions };
}
