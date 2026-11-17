import { Link, type LinkProps } from "react-router-dom";
import { useAppPath } from "@/store/appMountContext";

interface AppLinkProps extends Omit<LinkProps, "to"> {
  /** כתובת של אביב (ROUTES), בלי הבסיס שאביב מורכבת בו */
  to: string;
}

/** קישור לכתובת של אביב, עם הבסיס שאביב מורכבת בו. הסיבה - ראו useAppNavigate */
export default function AppLink({ to, ...linkProps }: AppLinkProps) {
  const toAppPath = useAppPath();
  return <Link to={toAppPath(to)} {...linkProps} />;
}
