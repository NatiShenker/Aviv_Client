import { useMemo, useState } from "react";
import { getTraineePhotoUrl } from "@/services/traineePhotosService";
import AppIcon from "@/shared/icons/AppIcon";

interface TraineePhotoProps {
  traineeId: number;
}

/**
 * תמונת החניך (60px), מהפעולה שמחזירה את קובץ התמונה עצמו - בכרטיס ברשימה ובכותרת מגירת החניך בדסקטופ.
 * הדפדפן טוען רק תמונות של כרטיסים שמוצגים. כשהתמונה לא נטענת מוצג רקע עם אייקון אדם.
 */
export default function TraineePhoto({ traineeId }: TraineePhotoProps) {
  const photoUrl = useMemo(() => getTraineePhotoUrl(traineeId), [traineeId]);
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);
  const canShowPhoto = photoUrl !== failedPhotoUrl;

  return (
    <div className="flex size-15 shrink-0 items-center justify-center overflow-hidden rounded-input bg-linear-to-b from-grey-200 to-grey-400">
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
