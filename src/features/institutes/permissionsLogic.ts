import type { PermissionId } from "./permissionIds";

/** האם למשתמש יש את ההרשאה בפנימייה הנבחרת */
export function isPermitted(permissionIds: number[], permissionId: PermissionId): boolean {
  return permissionIds.includes(permissionId);
}
