import { useMemo, useState } from "react";
import { getTraineePhotoUrl } from "@/services/traineePhotosService";
import AppIcon from "@/shared/icons/AppIcon";

// medium - בכרטיס ברשימה (60px); small - בכותרת מגירת החניך בדסקטופ (48px)
const PHOTO_SIZE_CLASS = {
  medium: "size-15",
  small: "size-12",
} as const;

export type TraineePhotoSize = keyof typeof PHOTO_SIZE_CLASS;

interface TraineePhotoProps {
  traineeId: number;
  size?: TraineePhotoSize;
}

/**
 * תמונת החניך, מהפעולה שמחזירה את קובץ התמונה עצמו.
 * הדפדפן טוען רק תמונות של כרטיסים שמוצגים. כשהתמונה לא נטענת מוצג רקע עם אייקון אדם.
 */
export default function TraineePhoto({ traineeId, size = "medium" }: TraineePhotoProps) {
  const photoUrl = useMemo(() => getTraineePhotoUrl(traineeId), [traineeId]);
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);
  const canShowPhoto = photoUrl !== failedPhotoUrl;

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-input bg-linear-to-b from-grey-200 to-grey-400 ${PHOTO_SIZE_CLASS[size]}`}
    >
      {canShowPhoto ? (
        <img
          src={photoUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
          onError={() => setFailedPhotoUrl(photoUrl)}
        />
      ) : (
        <AppIcon name="person" size="large" className="text-white" />
      )}
    </div>
  );
}
