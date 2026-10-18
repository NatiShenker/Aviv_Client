import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AddIcon from "@mui/icons-material/Add";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import KeyboardVoiceOutlinedIcon from "@mui/icons-material/KeyboardVoiceOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
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
  | "person"
  | "back"
  | "chevronLeft"
  | "chevronDown"
  | "traineeRestriction"
  | "numberRestriction"
  | "voiceMessage"
  | "clock"
  | "add"
  | "edit"
  | "file";

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
  // ב-RTL "חזרה" מצביע ימינה
  back: ArrowForwardIcon,
  chevronLeft: ChevronLeftIcon,
  chevronDown: ExpandMoreIcon,
  // עיגול עם קו אלכסוני (ספק 00 §2.5)
  traineeRestriction: BlockOutlinedIcon,
  numberRestriction: LockOpenOutlinedIcon,
  // תחליף זמני: בעיצוב מיקרופון עם פלוס
  voiceMessage: KeyboardVoiceOutlinedIcon,
  clock: AccessTimeIcon,
  add: AddIcon,
  edit: EditOutlinedIcon,
  file: InsertDriveFileOutlinedIcon,
};
