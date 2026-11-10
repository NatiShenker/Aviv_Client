import traineePhotoUrl from "@/assets/Rectangle_7705.png";
import { TRAINEES_MOCK_DATA } from "./traineesMockData";

// כתובת שהדפדפן לא יצליח לטעון, כמו 404 אמיתי: הכרטיס מציג את התמונה החלופית (תרחיש mockError=traineePhotos)
export const MISSING_PHOTO_URL = "/mock-images/missing-trainee-photo.jpg";

/** תמונת המוק של כל חניך, לפי מזהה החניך: אותה תמונה אמיתית לכולם, מתוך src/assets */
export const TRAINEE_PHOTOS_MOCK_DATA = new Map<number, string>(
  TRAINEES_MOCK_DATA.map((trainee) => [trainee.idntTrainee, traineePhotoUrl]),
);
