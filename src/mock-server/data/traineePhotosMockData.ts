import { TRAINEES_MOCK_DATA, type TraineeMockRecord } from "./traineesMockData";

// כתובת שהדפדפן לא יצליח לטעון, כמו 404 אמיתי: הכרטיס מציג את התמונה החלופית
export const MISSING_PHOTO_URL = "/mock-images/missing-trainee-photo.jpg";

// לחלק מהחניכים אין תמונה, כדי לבדוק את התצוגה החלופית
const WITHOUT_PHOTO = { every: 4, offset: 0 };

// תמונות המוק הן ראשי תיבות על רקע צבעוני, כקובץ SVG בתוך הכתובת (עובד בלי רשת)
const AVATAR_SIZE_PX = 120;
const AVATAR_FONT_SIZE_PX = 44;
const AVATAR_TEXT_COLOR = "#ffffff";
const AVATAR_BACKGROUNDS = ["#7f77dd", "#1d9e75", "#d85a30", "#378add", "#ba7517"];

function buildAvatarDataUri(trainee: TraineeMockRecord, index: number): string {
  const initials = `${trainee.firstName.charAt(0)}${trainee.lastName.charAt(0)}`;
  const background = AVATAR_BACKGROUNDS[index % AVATAR_BACKGROUNDS.length];
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${AVATAR_SIZE_PX}" height="${AVATAR_SIZE_PX}">`,
    `<rect width="100%" height="100%" fill="${background}"/>`,
    `<text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="sans-serif"`,
    ` font-size="${AVATAR_FONT_SIZE_PX}" fill="${AVATAR_TEXT_COLOR}">${initials}</text>`,
    `</svg>`,
  ].join("");
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function photoUriFor(trainee: TraineeMockRecord, index: number): string {
  const hasNoPhoto = index % WITHOUT_PHOTO.every === WITHOUT_PHOTO.offset;
  return hasNoPhoto ? MISSING_PHOTO_URL : buildAvatarDataUri(trainee, index);
}

/** תמונת המוק של כל חניך, לפי מזהה החניך */
export const TRAINEE_PHOTOS_MOCK_DATA = new Map<number, string>(
  TRAINEES_MOCK_DATA.map((trainee, index) => [trainee.id, photoUriFor(trainee, index)]),
);
