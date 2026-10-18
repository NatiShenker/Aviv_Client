import type { FileAttachmentRef } from "@/schemas/common.schema";
import type { RegisterApprovedFileRequest } from "@/services/approvedFilesService";
import { APPROVED_FILES_MOCK_DATA } from "../data/approvedFilesMockData";
import type { MockRequest } from "../mockRequest";

/** רושם קובץ שהועלה ל-SharePoint ומחזיר אותו עם מזהה חדש */
export function handleRegisterApprovedFile(request: MockRequest): FileAttachmentRef {
  const { fileName, path } = request.body as RegisterApprovedFileRequest;
  const registeredFile: FileAttachmentRef = { id: nextFileId(), fileName, externalUrl: path };
  APPROVED_FILES_MOCK_DATA.push(registeredFile);
  return registeredFile;
}

function nextFileId(): number {
  return Math.max(0, ...APPROVED_FILES_MOCK_DATA.map((file) => file.id)) + 1;
}
