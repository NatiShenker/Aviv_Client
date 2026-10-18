import { getActiveMockScenarios } from "./mockServer";

/*
 * סימולציה של ההעלאה ל-SharePoint: IpsFileUpload מעלה ישירות מהדפדפן ב-fetch, ולא דרך http(),
 * ולכן רק בקשות לכתובת ההעלאה של SharePoint מיורטות כאן. כל שאר בקשות ה-fetch עוברות כרגיל.
 * נמחק יחד עם תיקיית mock-server במעבר לשרת האמיתי.
 */

// הכתובת שהספרייה בונה: https://{sviva}.../sharepoint/{system}/upload[/{method}]
const SHAREPOINT_UPLOAD_URL_PATTERN = /\/sharepoint\/[^/]+\/upload(\/|$)/;
const UPLOADED_FILE_FIELD = "file";
const MOCK_SHAREPOINT_FOLDER = "/sites/aviv/approvals";
const DEFAULT_FILE_NAME = "file";
const SERVER_ERROR_STATUS = 500;
const SERVER_ERROR_TEXT = "Simulated SharePoint error (mockError)";
const NETWORK_ERROR_MESSAGE = "Failed to fetch";

let isInstalled = false;

export function installSharePointUploadMock(): void {
  if (isInstalled) return;
  isInstalled = true;

  const realFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (!SHAREPOINT_UPLOAD_URL_PATTERN.test(requestUrl(input))) {
      return realFetch(input, init);
    }
    return simulateUpload(init?.body);
  };
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

async function simulateUpload(body: BodyInit | null | undefined): Promise<Response> {
  const scenarios = getActiveMockScenarios();
  await waitFor(scenarios.delayMs);

  if (scenarios.networkErrorKeys.includes("sharePointUpload")) {
    throw new TypeError(NETWORK_ERROR_MESSAGE);
  }
  if (scenarios.errorKeys.includes("sharePointUpload")) {
    return new Response(null, { status: SERVER_ERROR_STATUS, statusText: SERVER_ERROR_TEXT });
  }

  // תשובת SharePoint: הנתיב של הקובץ שנשמר
  const path = `${MOCK_SHAREPOINT_FOLDER}/${Date.now()}-${uploadedFileName(body)}`;
  return new Response(JSON.stringify({ path }), { headers: { "Content-Type": "application/json" } });
}

function uploadedFileName(body: BodyInit | null | undefined): string {
  const uploadedFile = body instanceof FormData ? body.get(UPLOADED_FILE_FIELD) : null;
  return uploadedFile instanceof File ? uploadedFile.name : DEFAULT_FILE_NAME;
}

function waitFor(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
