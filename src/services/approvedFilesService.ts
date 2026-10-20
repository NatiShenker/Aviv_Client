import { SERVICE_ENDPOINTS } from "@/config/serviceEndpoints";
import { serviceClient } from "@/infrastructure/serviceClient";
import type { FileAttachmentRef } from "@/types/common.schema";

/**
 * קובץ שהועלה ל-SharePoint (התשובה של IpsFileUpload).
 * החוזה זמני: איך מתקבל IDNT_APPROVED_FILE אחרי ההעלאה עדיין לא הוגדר (ראו pending-decisions).
 */
export interface RegisterApprovedFileRequest {
  fileName: string;
  /** הנתיב ב-SharePoint */
  path: string;
}

/** רושם בסרביס קובץ אסמכתא שהועלה, ומחזיר אותו עם המזהה שנשלח בשמירת הרשומה (approvedFileId) */
export async function registerApprovedFile(request: RegisterApprovedFileRequest): Promise<FileAttachmentRef> {
  return serviceClient.post<FileAttachmentRef>(SERVICE_ENDPOINTS.files.registerApprovedFile, request);
}
