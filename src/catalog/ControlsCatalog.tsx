import { CATALOG_TEXTS } from "./catalogTexts";
import ActionControls from "./sections/ActionControls";
import DateTimeControls from "./sections/DateTimeControls";
import MobileFormControls from "./sections/MobileFormControls";
import OverlayControls from "./sections/OverlayControls";
import SelectionControls from "./sections/SelectionControls";
import TextControls from "./sections/TextControls";
import TokenSwatches from "./sections/TokenSwatches";

export default function ControlsCatalog() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 bg-background px-4 py-6 text-text-primary">
      <header>
        <h1 className="text-xl font-medium">{CATALOG_TEXTS.pageTitle}</h1>
        <p className="mt-1 text-sm text-text-muted">{CATALOG_TEXTS.pageDescription}</p>
      </header>

      <ActionControls />
      <TextControls />
      <SelectionControls />
      <DateTimeControls />
      <MobileFormControls />
      <OverlayControls />
      <TokenSwatches />
    </main>
  );
}
