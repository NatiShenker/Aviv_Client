import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AddIcon from "@mui/icons-material/Add";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import CheckIcon from "@mui/icons-material/Check";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import KeyboardVoiceOutlinedIcon from "@mui/icons-material/KeyboardVoiceOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PersonIcon from "@mui/icons-material/Person";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
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
  | "copy"
  | "file"
  | "phone"
  | "check"
  | "more"
  | "allActions";

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
  // "צור … חדשה על בסיס זו" ברשומה שהסתיימה
  copy: ContentCopyOutlinedIcon,
  file: InsertDriveFileOutlinedIcon,
  phone: PhoneOutlinedIcon,
  check: CheckIcon,
  // תפריט ⋮ על כרטיס החניך בדסקטופ
  more: MoreVertIcon,
  // "כל הפעולות" בתפריט ⋮: ריבועים ברשת, כמו בסקיצה
  allActions: GridViewOutlinedIcon,
};
