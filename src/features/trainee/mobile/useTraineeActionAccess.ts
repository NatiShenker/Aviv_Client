import type { PermissionId } from "@/features/institutes/permissions";
import { usePermissionCheck, type PermissionCheck } from "@/features/institutes/usePermissionCheck";
import type { TraineeListItemDto } from "@/types/trainees.schema";
import { useRouteTrainee } from "./useRouteTrainee";

/** מה אפשר להציג במסך של פעולה על חניך: את התוכן, או את המצב שבא במקומו */
export type TraineeActionAccess =
  | { status: "notFound" }
  | { status: "loading" }
  | { status: "blocked"; permission: PermissionCheck }
  | { status: "ready"; traineeId: number; trainee: TraineeListItemDto | null };

/**
 * החניך שבנתיב וההרשאה לפעולה (ספק 02 §7): חניך שלא נמצא בפנימייה, טעינת ההרשאות, חסימה – או מוכן.
 * בלי תצוגה, כדי שכל מעטפת תציג את המצבים בדרך שלה
 */
export function useTraineeActionAccess(permissionId: PermissionId): TraineeActionAccess {
  const { traineeId, trainee } = useRouteTrainee();
  const permission = usePermissionCheck(permissionId);

  if (traineeId === null || trainee.status === "empty") return { status: "notFound" };
  if (permission.status === "loading") return { status: "loading" };
  if (permission.status !== "granted") return { status: "blocked", permission };
  return { status: "ready", traineeId, trainee: trainee.data };
}
