import { APP_ICONS, type AppIconName } from "./appIcons";

const ICON_SIZE_PX = {
  small: 16,
  medium: 20,
  large: 36,
} as const;

export type AppIconSize = keyof typeof ICON_SIZE_PX;

interface AppIconProps {
  name: AppIconName;
  size?: AppIconSize;
  className?: string;
}

/** אייקון דקורטיבי (מוסתר מקורא מסך). הטקסט הנגיש שייך לכפתור או לתווית שלידו */
export default function AppIcon({ name, size = "medium", className }: AppIconProps) {
  const source = APP_ICONS[name];
  const sizePx = ICON_SIZE_PX[size];

  if (typeof source === "string") {
    return (
      <img src={source} alt="" aria-hidden="true" width={sizePx} height={sizePx} className={className} />
    );
  }

  const IconComponent = source;
  // גודל דרך style, כי עיצובי MUI גוברים על מחלקות Tailwind
  return <IconComponent aria-hidden="true" className={className} style={{ fontSize: sizePx }} />;
}
