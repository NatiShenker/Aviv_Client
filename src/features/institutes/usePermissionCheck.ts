import type { AsyncResource } from "@/shared/hooks/useAsyncResource";
import { useInstitutes } from "./InstitutesProvider";
import type { PermissionId } from "./permissionIds";
import { isPermitted } from "./permissionsLogic";

export type PermissionCheckStatus = "loading" | "error" | "denied" | "granted";

export interface PermissionCheck {
  status: PermissionCheckStatus;
  /** טעינה חוזרת של ההרשאות, אחרי כשל */
  reload: () => void;
}

/**
 * האם מותר להציג מסך של פעולה. התפריט כבר מסתיר פעולות בלי הרשאה,
 * והבדיקה הזו מגינה גם על כניסה ישירה מקישור.
 */
export function usePermissionCheck(permissionId: PermissionId): PermissionCheck {
  const { permissions } = useInstitutes();
  return { status: resolvePermissionCheckStatus(permissions, permissionId), reload: permissions.reload };
}

function resolvePermissionCheckStatus(
  permissions: AsyncResource<number[]>,
  permissionId: PermissionId,
): PermissionCheckStatus {
  switch (permissions.status) {
    case "idle":
    case "loading":
      return "loading";
    case "error":
      return "error";
    case "empty":
    case "success":
      return isPermitted(permissions.data ?? [], permissionId) ? "granted" : "denied";
  }
}
