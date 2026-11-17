import { useCallback } from "react";
import { useNavigate, type NavigateOptions } from "react-router-dom";
import { useAppPath } from "@/store/appMountContext";

type AppNavigate = (avivPath: string, options?: NavigateOptions) => void;

/**
 * ניווט קדימה לכתובת של אביב (ROUTES). navigate של הראוטר פותר כתובת מוחלטת מול ה-basename של הראוטר,
 * שבמארח הוא של המארח, ולכן כל ניווט קדימה במובייל עובר כאן ומקבל את הבסיס שאביב מורכבת בו (appMountContext)
 */
export function useAppNavigate(): AppNavigate {
  const navigate = useNavigate();
  const toAppPath = useAppPath();
  return useCallback<AppNavigate>((avivPath, options) => navigate(toAppPath(avivPath), options), [navigate, toAppPath]);
}
