# Client Infrastructure

Binding guidance for the shared infrastructure every screen uses. Read it with `CLAUDE.md`.

## Folder layout

- `src/` root — the app-level files: `bootstrap.tsx` (entry), `App.tsx` (providers and the layout switch), `MobileRoutes.tsx` / `DesktopRoutes.tsx` (the screens of each layout), `routes.ts`, `appConstants.ts`.
- `src/shells/mobile/` — the mobile page shell: page root, header, pinned top, sticky action bar, the full-screen form sheet, the mobile navigation (`navigation/`), the window hooks (`hooks/`), the screen spacing (`screenSpacing.ts`: top spacing and the side gutter) and the mobile form controls (`mobileFormControls.ts`).
- `src/shells/desktop/` — the desktop shell:
  - `DesktopPage`: the page root fills the viewport, and the screen decides which area inside it scrolls.
  - The side drawer and its parts: `SideDrawer`, `DrawerTopBar`, `DrawerFormHost`, `DrawerFormLayer`, `UnsavedChangesDialog` and `unsavedChanges`, with `drawerSpacing.ts` for the side gutter and the reserved scrollbar gutter.
  - The screen transitions inside the drawer: `DrawerScreenTransition` and `DrawerPane` (one sliding screen), with `drawerScreenMotion.ts` for the directions and animation classes. The form layer slides through `DrawerFormHost`; a leaving form is told through `drawerFormLeaving.ts`, so it returns focus and stops reporting unsaved changes.
  - The context selector look: `contextSelectSx.ts`.
  - The desktop form controls: `form-controls/`.
  - No page transitions between routes and no window hooks.
- `src/features/<feature>/` — one folder per feature: the `*Screen.tsx` composition, its components and hooks, and its `*Logic.ts`, `*Options.ts` and `*Texts.ts` files.
  - The record features (trainee restrictions, number restrictions, voice messages) split into `history/` and `form/`; a file used by both stays at the feature root. Other features keep their components in `components/`.
  - A feature with a desktop layout keeps its desktop composition and desktop-only components in `desktop/`, e.g.:
    - `features/trainees-list/desktop/`;
    - `features/trainee-actions/desktop/` – the trainee drawer;
    - `features/<record feature>/desktop/` – the drawer history and form;
    - `features/records/{history,form}/desktop/`.

    Everything both layouts use stays where it is.
  - `features/records/` — the building blocks the record features share (spec 00 §3–§4): `history/` and `form/`.
  - `features/institutes/` — the selected institute, wings and permissions. `features/trainee/` — the trainee of the current route and its display name.
- `src/shared/` — generic code with no domain knowledge: hooks, small components, form primitives, icons, formatting, dates, the platform module (`platform/`) and the form controls contract (`form-controls/`).
- `src/services/` — one file per controller, plus `serviceEndpoints.ts`. `src/infrastructure/` — http, api, errors, storage.
- `src/mock-server/` — the simulated service.
- **Dependency direction:** `shared` imports nothing from `features`, `shells` or the root files (except `appConstants.ts`); `shells` import nothing from `features`.
- **Platform split:** state, logic, cards, data hooks and form bodies know nothing about routes or the page. Examples:
  - `useRecordHistoryState`, `useHistoryFormTarget`, `RecordFormTarget`;
  - per record feature, `use<Feature>History(traineeId)` (data + history state) and `use<Feature>FormSession(…)` (reference data, the form hook, the title and the save state);
  - the menu model of 02;
  - `useTraineesListState`, `TraineesListStates`.

  Routes and page containers stay in the shells and in each feature's composition per layout:
  - mobile: `*Screen.tsx`, `*History.tsx`, `*FormSheet.tsx`, `use*FormRoute.ts`, `useRecordFormSlot`;
  - desktop: `desktop/*DrawerHistory.tsx`, `desktop/*DrawerForm.tsx`, `useDrawerFormSlot`.

  The desktop composition reuses the first group and replaces the second.
  - **Slots, not flags:** when the layouts differ inside a shared component, the layout passes the different part in. Today:
    - `TraineeActionsMenu`'s `renderItemRow` (a link on mobile, a button on desktop);
    - `HistoryCardsList`'s `renderCardFrame` (a frame on a white surface);
    - `NumberRecordForm`'s `RestrictionOptionsList` (cards with "בחירה" on mobile, radio cards on desktop);
    - `FormFooter`'s `buttonSize`.
  - **Gutters:** content components have no side gutter. The containers set it: `SCREEN_SIDE_GUTTER_CLASS` on mobile, `DRAWER_ROW_GUTTER_CLASS` / `DRAWER_SCROLL_AREA_CLASS` in the drawer.
- **Form controls per layout:** the shared form blocks never use a mobile or a desktop control directly. They take their controls from `useFormControls()`.
  - **Contract:** `shared/form-controls/formControls.ts` – date, time, select, multi-select, text, text area, radio group. It holds only the props the blocks use, with values as strings (`'YYYY-MM-DD'`, `'HH:mm'`).
  - **Providers:** `MobileRoutes` provides `MOBILE_FORM_CONTROLS` (the `Ips*Mobile` controls as they are); `DesktopRoutes` provides `DESKTOP_FORM_CONTROLS` (`shells/desktop/form-controls/`: the MUI `Ips*` controls).
  - **Desktop adapters:**
    - the value conversions (`pickerValues.ts`);
    - the typed draft of a picker (`usePickerDraft`): a partly typed date or time reaches the form as `''`;
    - the labels above the fields;
    - an `id` on the focusable element, so a form can focus its first error.
- **Trainee drawer state (desktop):**
  - The drawer lives in memory only (`useTraineeDrawer`, `traineeDrawerScreens.ts`); the URL does not change.
  - A form inside it reports unsaved changes through `useReportUnsavedChanges`, so the drawer can ask before it closes.
  - A save calls the drawer's `onRecordSaved`, and the list refreshes in the background.
- **Platform detection:** only `usePlatform()` (`shared/platform/PlatformProvider.tsx`) knows the platform. Today it returns `layout` (`mobile` / `desktop`), measured from the width of Aviv's own container (≥ `DESKTOP_LAYOUT_MIN_WIDTH_PX` = 1024 is desktop). Any further detection (iOS, touch, run mode) is added there only when it has a consumer.
  - The layout is chosen in one place: `App.tsx` renders `MobileRoutes` or `DesktopRoutes`. Components never check widths, `userAgent` or the layout, and there are no viewport-based Tailwind classes (`sm:`, `lg:`).
  - Controls follow the layout (see `ui_library.md`).
  - Crossing the breakpoint renders the other layout at the same URL. The desktop has no inner pages – the trainee's screens open in a drawer whose state lives in memory – so an inner URL is replaced by the list (`DesktopRoutes` fallback). An open drawer, or an open form on either layout, closes without saving. The trainees list keeps its search, filters and sort (`traineesListMemory`).
- A small component used by one parent stays a private component in the parent's file. A separate file is only for a component with its own responsibility or state.

## Server access

- Requests go to Aviv_Service unless stated otherwise. Endpoints are `Controller/Action` strings in `src/services/serviceEndpoints.ts`.
- The internal HTTP library is used as `initHttpClient()` once at startup (`src/bootstrap.tsx`), then `http().get(url, { params })` / `http().post(url, body)`. Responses and errors are axios-shaped.
- Until the library is available, `src/infrastructure/http` simulates it. Its `index.ts` is the only swap point for the real library.
- Services call the server only through `serviceClient` (`src/infrastructure/api`). It extracts `data` and turns every failure into an `AppError`. View components call services, never `http()` or `serviceClient`.
- A resource the browser loads directly (e.g. an image in `src`) gets its URL from `serviceClient.buildServiceUrl(url, params)`, which uses `http().getUri`.
- `clientIds` is always `[AVIV_CLIENT_ID]` (`src/appConstants.ts`).
- User and institute identity come from the internal `shared-types` library. Simulate it in the first screen that needs it.

## Errors

- Every failure is an `AppError` with a `code` (server codes from spec 00 §7, plus `NETWORK_ERROR` / `CLIENT_ERROR`) and a `source` (`service` / `network` / `client`).
- `AppErrorBoundary` catches render errors. `registerGlobalErrorHandlers()` (`errorReporting.ts`) catches uncaught errors and unhandled rejections.
- All reporting goes through `reportError()` in `errorReporting.ts` (console for now).
- General Hebrew messages per code are in `errorTexts.ts`. Screens may show a context-specific text instead.

## Data loading

- Use `useAsyncResource({ requestKey, load, isEmpty, readCache })` for every query. It returns `idle | loading | success | empty | error`, the data, the error, `reload` and `refreshInBackground`. A changed `requestKey` reloads, and stale responses are ignored.
  - `reload` goes to the server with a loading state, e.g. "נסה שוב" or a history after a save.
  - `refreshInBackground` goes to the server **silently**: the current data stays until the new data arrives, and there is no loading state. A failure keeps the current data and is only reported (`reportError`). A response for an older `requestKey` is ignored.
  - Used for the desktop trainees list after a save in the drawer ([01 §8.2](specs/01_children_list.md)).
- **Cached queries:** a service may keep its last response in a `createQueryCache` (`src/infrastructure/api/queryCache.ts`) and expose a `getCached…` reader for `readCache`. Cached data shows at once, e.g. when returning to a screen, and `reload` always goes to the server. **A mutation must update or clear the caches of the queries it affects.**
- Background calls (loaded in parallel and not blocking the screen) surface failures where they matter: a toast or an inline retry.

## Mock server

- `src/mock-server` simulates the service: latency, axios-shaped responses and errors, and in-memory data that resets on reload.
- Mock data exists for every schema type, one file per type, in `mock-server/data`. Derived values (such as trainee flags) are computed in handlers from the records, as the server would.
- Add a route in `mockRoutes.ts` together with the screen that needs it. Resources loaded directly by the browser (images) use `MOCK_RESOURCE_ROUTES`, which return a data URI or a missing path (like a 404).
- Scenarios are set by URL parameters read once at startup: `mockDelayMs`, `mockError`, `mockNetworkError`, `mockEmpty` (comma-separated keys such as `trainees,locations`), and `mockSingleInstitute=true`.

## Local persistence

- User selections that should survive visits use `saveWithExpiry` / `readWithExpiry` (`src/infrastructure/storage`). Each save renews the expiry, and every read validates the stored shape.
- All keys are in `storageKeys.ts`. Storage may be blocked inside the iframe, and the app must keep working without it.

## Lists

- Every list renders incrementally on the client, `LIST_PAGE_SIZE` (30) items at a time: `useIncrementalList` + `LoadMoreSentinel`.
  - By default, a new items array starts again from the first page.
  - With `resetOn` (e.g. `[filters, sort]`), only a change in those values starts again. A refresh of the same list (`refreshInBackground`) then keeps the number of items shown.
  - Short lists that need every option at once render all of it, e.g. the radio cards of a permit's restrictions on desktop (04 form §8.1).
- **Returning to a list screen** restores it as the user left it, until a page reload:
  - A small in-memory module of the screen holds the search, filters and sort (e.g. `traineesListMemory.ts`), along with the number of items shown and the scroll position.
  - The position is restored with `useIncrementalList`'s `initialVisibleCount` and `useWindowScrollRestoration` (mobile).
- **Desktop lists:** the page fills the viewport and only the list area scrolls (a focusable `role="region"` with `overflow-y-auto`, so the keyboard can scroll it). `LoadMoreSentinel` works there without a root; it loads when the sentinel becomes visible (the 200px preload margin applies only to the viewport). The desktop does not restore the position, and clears the remembered position (`forgetTraineesListPosition`) so a later mobile layout does not restore a stale one.
  - The same holds for the histories in the drawer.
  - `focusField` / `useRevealSavedRecord` work inside a scroll area too, since `scrollIntoView` scrolls every scrolling ancestor.
  - A new screen in the drawer remounts, so it starts at its top; no window scroll is involved.

## Icons

- Use `AppIcon` and the registry in `src/shared/icons/appIcons.ts`. Production icons are image files from storage (`<img src>`). An entry is either that URL or a temporary `@mui/icons-material` component.
