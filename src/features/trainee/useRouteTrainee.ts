import { useParams } from "react-router-dom";
import { parseRouteId, type TraineeRouteParams } from "@/routes";
import { useInstitutes } from "@/features/institutes/InstitutesProvider";
import type { TraineeListItemDto } from "@/schemas/trainees.schema";
import { findTrainee, getCachedTrainee, type TraineeLookup } from "@/services/traineesService";
import { useAsyncResource, type AsyncResource } from "@/shared/hooks/useAsyncResource";

interface RouteTrainee {
  /** המזהה מהנתיב, או null כשהוא לא מספר תקין */
  traineeId: number | null;
  /** empty = אין חניך כזה בפנימייה הנבחרת */
  trainee: AsyncResource<TraineeListItemDto | null>;
}

const isMissingTrainee = (trainee: TraineeListItemDto | null) => trainee === null;

function lookupKey({ instituteId, traineeId }: TraineeLookup): string {
  return `${instituteId}:${traineeId}`;
}

/** החניך שהמזהה שלו בנתיב (‎/trainee/:traineeId), מתוך הפנימייה הנבחרת */
export function useRouteTrainee(): RouteTrainee {
  const params = useParams<Pick<TraineeRouteParams, "traineeId">>();
  const traineeId = parseRouteId(params.traineeId);
  const { selectedInstitute } = useInstitutes();

  const lookup: TraineeLookup | null =
    traineeId !== null && selectedInstitute ? { instituteId: selectedInstitute.id, traineeId } : null;

  const trainee = useAsyncResource({
    requestKey: lookup ? lookupKey(lookup) : null,
    // נקראות רק כשיש מפתח, כלומר כש-lookup קיים
    load: () => (lookup ? findTrainee(lookup) : Promise.resolve(null)),
    readCache: () => (lookup ? getCachedTrainee(lookup) : null),
    isEmpty: isMissingTrainee,
  });

  return { traineeId, trainee };
}
