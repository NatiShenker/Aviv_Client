import CloseIcon from "@mui/icons-material/Close";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PersonIcon from "@mui/icons-material/Person";
import SearchIcon from "@mui/icons-material/Search";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import type { ComponentType } from "react";

/** מקור אייקון: כתובת של קובץ מהאחסון (מוצג ב-img), או רכיב זמני עד שיהיה קובץ */
export type AppIconSource = string | ComponentType<SvgIconProps>;

export type AppIconName =
  | "search"
  | "filter"
  | "sort"
  | "close"
  | "location"
  | "timer"
  | "warning"
  | "person";

/*
 * רישום האייקונים של האפליקציה - המקום היחיד שמגדיר מאיפה כל אייקון מגיע.
 * להחלפה לאייקון מהאחסון: להחליף את הרכיב בכתובת הקובץ, למשל search: "https://.../search.svg".
 * שימו לב: קובץ תמונה לא יורש את צבע הטקסט, ולכן מצב צבעוני (כמו סינון פעיל) צריך קובץ משלו.
 */
export const APP_ICONS: Record<AppIconName, AppIconSource> = {
  search: SearchIcon,
  filter: FilterAltOutlinedIcon,
  sort: SwapVertIcon,
  close: CloseIcon,
  location: LocationOnOutlinedIcon,
  timer: TimerOutlinedIcon,
  warning: ErrorOutlineIcon,
  person: PersonIcon,
};
