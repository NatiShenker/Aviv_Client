import type { DeviceDto } from "@/schemas/organization.schema";

// התוויות לפי ספק 00 §6. wingId = null: מכשיר של הפנימייה כולה
export const DEVICES_MOCK_DATA: DeviceDto[] = [
  { id: 1, name: "טלפון ציבורי – אגף א", instituteId: 101, wingId: 1011 },
  { id: 2, name: "טלפון ציבורי – אגף ב", instituteId: 101, wingId: 1012 },
  { id: 3, name: "טלפון ציבורי – אגף ג", instituteId: 101, wingId: 1013 },
  { id: 4, name: "טלפון משרד הפנימייה", instituteId: 101, wingId: null },
  { id: 5, name: "טלפון ציבורי – אגף צפוני", instituteId: 102, wingId: 1021 },
  { id: 6, name: "טלפון ציבורי – אגף דרומי", instituteId: 102, wingId: 1022 },
  { id: 7, name: "טלפון משרד הפנימייה", instituteId: 102, wingId: null },
  { id: 8, name: "טלפון ציבורי – אגף מרכזי", instituteId: 103, wingId: 1031 },
];
