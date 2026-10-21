# Client Infrastructure

Binding guidance for the shared infrastructure every screen uses. Read it with `CLAUDE.md`.

## Folder layout

- `src/` root — the app-level files: `bootstrap.tsx` (entry), `appEntry.ts` (prepares the URL of a direct entry; runs in both layouts), `App.tsx` (providers, the layout switch and the permissions-failure toast), `MobileRoutes.tsx` / `DesktopRoutes.tsx` (the screens of each layout).
- **Required folders** (an organizational standard). Each holds only what belongs to it; nothing is moved there just to fill it.
  - `src/config/` — values that configure the app: `appConstants.ts` (client ID, list page size, selection TTL, `STORAGE_KEYS`, Hebrew locale, the desktop breakpoint `DESKTOP_LAYOUT_MIN_WIDTH_PX`, the SharePoint target), `routes.ts` (route patterns, builders and params), `serviceEndpoints.ts` (the `Controller/Action` names).
  - `src/store/` — the contexts the whole app reads; state only, no UI:
    - `institutesContext.tsx` (`InstitutesProvider` / `useInstitutes`: the institutes, the selected institute and its permissions) with `instituteSelection.ts` (the remembered selection);
    - `platformContext.tsx` (`PlatformProvider` / `usePlatform`: the layout).

    A feature's own memory (e.g. `traineesListMemory.ts`) stays in the feature, and the query caches stay with the services.
  - `src/types/` — the server contract (`*.schema.ts`, one file per area) and general client types (`SortDirection` in `common.schema.ts`). A feature's own types stay in the feature.
  - `src/utils/` — generic helpers with no domain knowledge and no React: `dates.ts`, `dom.ts`, `text.ts`, `phone.ts`.
- `src/shells/mobile/` — the mobile page shell: page root, header, pinned top, sticky action bar, the full-screen form sheet and its opening (`FormSheet`, `useFormSheetSession`), the sort sheet, the navigation and the window hooks (`navigation/`), the screen spacing (`screenSpacing.ts`: top spacing and the side gutter), the mobile form controls (`mobileFormControls.ts`) and the shell texts (`mobileShellTexts.ts`).
- `src/shells/desktop/` — the desktop shell:
  - `DesktopPage`: the page root fills the viewport, and the screen decides which area inside it scrolls.
  - `drawer/` — the side drawer and its parts:
    - `SideDrawer`, `DrawerTopBar`, `DrawerFormHost`, `DrawerFormLayer`, `UnsavedChangesDialog` and `unsavedChanges`, with `drawerSpacing.ts` for the side gutter and the reserved scrollbar gutter;
    - the screen transitions inside the drawer: `DrawerScreenTransition` and `DrawerPane` (one sliding screen), with `drawerScreenMotion.ts` for the directions and animation classes. The form layer slides through `DrawerFormHost`; a leaving form is told through `drawerFormLeaving.ts`, so it returns focus and stops reporting unsaved changes.
  - The context selector look: `contextSelectSx.ts`.
  - The desktop form controls: `form-controls/`.
  - No page transitions between routes and no window hooks.
- `src/features/<feature>/` — one folder per feature, all on the same template:
  - **Shared** (both layouts): `form/`, `history/`, `components/` — logic, data hooks, cards and form bodies — and at the feature root `<feature>Texts.ts`, `<feature>Logic.ts` and the feature's other shared files.
  - **`mobile/`** — what only the mobile layout shows: the screen, the history composition (with its form route hook) and the form sheet.
  - **`desktop/`** — what only the desktop layout shows: the drawer history and the drawer form.
  - The features:
    - `institutes` — organization logic, permissions (`permissions.ts`), the institutes state gate and the permission-blocked message.
    - `trainee` — the trainee's display name, photo and status badge; `mobile/`: the trainee of the current route and the action gate.
    - `trainees-list`.
    - `trainee-actions` — the menu model of 02; `desktop/` is the trainee drawer (spec 02 §8 defines it as the desktop version of the actions screen).
    - `records` — the building blocks the record features share (spec 00 §3–§4): `form/` (with `decision/`, `call-conditions/`, `phone/`), `history/` (with `card/`), `mobile/` and `desktop/` (including the two form frames).
    - The record features: `trainee-restrictions`, `number-restrictions` (with `form/source-restriction/`), `voice-messages`.
- `src/shared/` — generic React building blocks with no domain knowledge: `components/` (including `AppIcon` and its registry), `components/form/` (form primitives, the form controls contract and `FormControlsProvider`), `hooks/`.
- `src/services/` — one file per controller. `src/infrastructure/` — `serviceClient.ts`, `queryCache.ts`, `expiringStorage.ts`, `http/` (the swap point) and `errors/`.
- `src/integrations/` — external MFEs (the approver picker). `src/mock-server/` — the simulated service. `src/styles/` — `index.css` and `tokens.css`.
- The `config/` folder at the repository root (outside `src`) is the build's Module Federation configuration and is read-only; `src/config/` is the app's own configuration.

### Where a new file goes (R8)

If it imports a shell, a route, the router or a layout control — or it exists only to fill one layout's slot or to hold its navigation — it goes to `<feature>/mobile` or `<feature>/desktop`. Everything else goes to the shared folders.

### Folders and small files (R9)

- A folder holds at least 3 files. Exception: `mobile/` and `desktop/` inside a feature, since every feature has the same shape and the dependency checks rely on them.
- A group of 3 or more files on one named sub-topic, inside a folder of 10 or more files, gets a sub-folder named after the sub-topic (e.g. `shells/desktop/drawer/`, `records/form/decision/`, `records/history/card/`) — only when the whole sub-topic fits in it. A folder that is already about one topic is not split.
- A very small file (up to about 15 lines of code) joins another file only when it has one natural home: its only consumer, or a file on exactly the same topic. A small file with its own concept and several consumers stays (e.g. `traineeDisplay.ts`, `recordStatus.ts`, `historyCardFrame.ts`).
- Texts files merge only within one domain. Mock data, schemas and services keep one file per type, area and controller.

### Naming

- The folder says which layout; the name says the role.
  - `Desktop*` — a desktop file in the same role as a mobile one (`DesktopTraineesListScreen`, `DesktopHistoryToolbar`).
  - `Drawer*` — roles of the drawer itself (`DrawerHistoryLayout`, `DrawerScreens`, `useDrawerFormSlot`).
  - `<Feature>Drawer<Role>` — the desktop counterpart of a mobile component (`…DrawerHistory`, `…DrawerForm`).
  - Mobile files have no prefix.
  - **"Drawer" means only the desktop side drawer.** A mobile bottom sheet is `…Sheet` (spec 01, `SortSheet`, `FormSheet`).
- Record names follow the domain: `TraineeRestriction*` for spec 03. In the number feature, the restriction a permit sits on is `SourceRestriction*`, as on the server (`SourceRestrictionSummaryDto`).
- No two files in `src` share a name, ignoring case (R7).

### Dependency rules

Each rule is checked by path, and the check must come back empty.

| # | Rule |
|---|---|
| R1 | Files in `features` **outside** `mobile/` and `desktop/` don't import `@/shells`, `@/config/routes`, `react-router-dom`, `Ips*Mobile` or desktop controls (`IpsSelect`, `IpsTextField`, `IpsMenu`, `IpsDrawer`, `IpsDialog`, …). Neutral controls are allowed: `IpsButton`, `IpsIconButton`, `IpsSwitch`, `IpsFileUpload`. Form controls come only from `useFormControls()`. |
| R2 | A file in `mobile/` doesn't import from any `desktop/`, and the reverse. |
| R3 | Shared code (outside `mobile/` and `desktop/`) doesn't import from any `mobile/` or `desktop/`. |
| R4 | `shells` don't import `features`, and the two shells don't import each other. |
| R5 | `shared` doesn't import `features`, `shells`, `store` or the root files. |
| R6 | Between features:<br>- `institutes` and `trainee` — for every feature;<br>- `records` — only for the three record features;<br>- the record features don't import each other;<br>- the only exceptions are the routers: `MobileRoutes` (the mobile screens), the drawer in `trainee-actions/desktop` (the record features' desktop histories, their texts and the `records` blocks), and `trainees-list/desktop`, which opens the drawer. |
| R7 | No two files in `src` share a name. |
| R10 | The required folders: `types` imports nothing; `config` imports only `types`; `utils` only `types` and `config`; `store` only `services`, `infrastructure`, `types`, `config`, `utils` and `shared/hooks`. |

### Platform split

- **Shared code knows nothing about routes or the page:** state, logic, cards, data hooks and form bodies live in a feature's shared folders. Examples:
  - `useRecordHistoryState`, `useHistoryFormTarget`, `RecordFormTarget`, `RecordFormSession`;
  - per record feature, `use<Feature>History(traineeId)` (data + history state) and `use<Feature>FormSession(…)` (reference data, the form hook, the title and the save state), with the feature's `<Feature>FormTarget`;
  - the menu model of 02;
  - `useTraineesListState`, `TraineesListStates`.
- **Each layout's composition** lives in the feature's `mobile/` or `desktop/`:
  - mobile: `<feature>/mobile/` — `*Screen`, `*History` (with its form route hook) and `*FormSheet`; in `records/mobile/`: `RecordHistoryPage`, `RecordHistoryLayout`, `HistoryToolbar`, `useRecordFormRoute`, `useRecordFormSlot`, `RecordFormSheetFrame`;
  - desktop: `<feature>/desktop/` — `*DrawerHistory` and `*DrawerForm`; in `records/desktop/`: `DrawerHistoryLayout`, `DesktopHistoryToolbar`, `useDrawerFormSlot`, `DrawerRecordFormFrame`.
- **Form frames:** each layout has one frame for every record form:
  - `RecordFormSheetFrame` (mobile): `FormSheet` with a touch-sized `FormFooter`;
  - `DrawerRecordFormFrame` (desktop): `DrawerFormLayer` with a regular-size `FormFooter`, and `useReportUnsavedChanges`, so no form can forget to report unsaved changes.

  The outer wrappers stay in each feature: the opening key on mobile, and waiting for the record on desktop.
- **Slots, not flags:** when the layouts differ inside a shared component, the layout passes the different part in. Today:
  - `TraineeActionsMenu`'s `renderItemRow` (a link on mobile, a button in the drawer);
  - `HistoryCardsList`'s and `HistorySkeleton`'s `renderCardFrame` (a bordered frame on the drawer's white surface);
  - `TraineesListStates`' `loadingContent` and `renderCards` (the mobile list, the desktop grid);
  - `TraineeCard`'s `menu` (the ⋮ menu on desktop; none on mobile);
  - `NumberRecordForm`'s `SourceRestrictionOptionsList` (cards with "בחירה" on mobile, radio cards on desktop);
  - `FormFooter`'s `buttonSize`.
- **Gutters:** content components have no side gutter. The containers set it: `SCREEN_SIDE_GUTTER_CLASS` on mobile, `DRAWER_ROW_GUTTER_CLASS` / `DRAWER_SCROLL_AREA_CLASS` in the drawer.
- **Form controls per layout:** the shared form blocks never use a mobile or a desktop control directly. They take their controls from `useFormControls()`.
  - **Contract:** `shared/components/form/formControls.ts` – date, time, select, multi-select, text, text area, radio group, file upload. It holds only the props the blocks use, with values as strings (`'YYYY-MM-DD'`, `'HH:mm'`).
  - **Providers:** `MobileRoutes` provides `MOBILE_FORM_CONTROLS` (the `Ips*Mobile` controls as they are; the file upload through `shells/mobile/MobileFileUploadField`, which drops the desktop-only hint); `DesktopRoutes` provides `DESKTOP_FORM_CONTROLS` (`shells/desktop/form-controls/`: the MUI `Ips*` controls, and `IpsFileUpload` with its "שמור קבצים" hint).
  - **Desktop adapters:**
    - the value conversions (`pickerValues.ts`);
    - the typed draft of a picker (`usePickerDraft`): a partly typed date or time reaches the form as `''`;
    - the labels above the fields;
    - an `id` on the focusable element, so a form can focus its first error.

### Trainee drawer state (desktop)

- The drawer lives in memory only (`useTraineeDrawer`; the screens and their keys in `traineeDrawerScreens.ts`; the transitions between them in `DrawerScreens`). The URL does not change.
- A form inside it reports unsaved changes through `useReportUnsavedChanges`, called by `DrawerRecordFormFrame`, so the drawer can ask before it closes.
- A save calls the drawer's `onRecordSaved`, and the list refreshes in the background.

### Platform detection

- Only `usePlatform()` (`store/platformContext.tsx`) knows the platform. Today it returns `layout` (`mobile` / `desktop`), measured from the width of Aviv's own container (≥ `DESKTOP_LAYOUT_MIN_WIDTH_PX` = 1024 is desktop). Any further detection (iOS, touch, run mode) is added there only when it has a consumer.
- The layout is chosen in one place: `App.tsx` renders `MobileRoutes` or `DesktopRoutes`. Components never check widths, `userAgent` or the layout, and there are no viewport-based Tailwind classes (`sm:`, `lg:`).
- Controls follow the layout (see `ui_library.md`).
- Crossing the breakpoint renders the other layout at the same URL. The desktop has no inner pages – the trainee's screens open in a drawer whose state lives in memory – so an inner URL is replaced by the list (`DesktopRoutes` fallback). An open drawer, or an open form on either layout, closes without saving. The trainees list keeps its search, filters and sort (`traineesListMemory`).

### Small components

A small component used by one parent stays a private component in the parent's file. A separate file is only for a component with its own responsibility or state.

## Server access

- Requests go to Aviv_Service unless stated otherwise. Endpoints are `Controller/Action` strings in `src/config/serviceEndpoints.ts`.
- The internal HTTP library is used as `initHttpClient()` once at startup (`src/bootstrap.tsx`), then `http().get(url, { params })`, `http().post(url, body)` and `http().put(url, body)`. Responses and errors are axios-shaped.
- Until the library is available, `src/infrastructure/http` simulates it. Its `index.ts` is the only swap point for the real library.
- Services call the server only through `serviceClient` (`src/infrastructure/serviceClient.ts`: `get`, `post`, `put`). It extracts `data` and turns every failure into an `AppError`. View components call services, never `http()` or `serviceClient`.
- A resource the browser loads directly (e.g. an image in `src`) gets its URL from `serviceClient.buildServiceUrl(url, params)`, which uses `http().getUri`.
- `clientIds` is always `[AVIV_CLIENT_ID]` (`src/config/appConstants.ts`).
- User and institute identity come from the internal `shared-types` library. Simulate it in the first screen that needs it.

## Errors

- Every failure is an `AppError` with a `code` (server codes from spec 00 §7, plus `NETWORK_ERROR` / `CLIENT_ERROR`) and a `source` (`service` / `network` / `client`).
- `AppErrorBoundary` catches render errors. `registerGlobalErrorHandlers()` (`errorReporting.ts`) catches uncaught errors and unhandled rejections.
- All reporting goes through `reportError()` in `errorReporting.ts` (console for now).
- The texts of the error screen are in `errorTexts.ts`. Screens show a context-specific message for their own failures.

## Data loading

- Use `useAsyncResource({ requestKey, load, isEmpty, readCache })` for every query. It returns `idle | loading | success | empty | error`, the data, the error, `reload` and `refreshInBackground`. A changed `requestKey` reloads, and stale responses are ignored.
  - `reload` goes to the server with a loading state, e.g. "טעינה מחדש" or a history after a save.
  - `refreshInBackground` goes to the server **silently**: the current data stays until the new data arrives, and there is no loading state. A failure keeps the current data and is only reported (`reportError`). A response for an older `requestKey` is ignored.
  - Used for the desktop trainees list after a save in the drawer ([01 §8.2](specs/01_children_list.md)).
  - **The one exception:** `usePermitLookup` (04 form, the search for the restrictions of a number). It is not a query of the screen but an action the user triggers, and its result drives the form's state (`completePhoneSearch`, `markLookupOutdated`). It keeps its own request state and takes only the response of the latest search.
- **Cached queries:** a service may keep its last response in a `createQueryCache` (`src/infrastructure/queryCache.ts`) and expose a `getCached…` reader for `readCache`. Cached data shows at once, e.g. when returning to a screen, and `reload` always goes to the server. **A mutation must update or clear the caches of the queries it affects.**
- Background calls (loaded in parallel and not blocking the screen) surface failures where they matter: a toast or an inline retry.

## Mock server

- `src/mock-server` simulates the service: latency, axios-shaped responses and errors, and in-memory data that resets on reload.
- Mock data exists for every schema type, one file per type, in `mock-server/data`. Derived values (such as trainee flags) are computed in handlers from the records, as the server would.
- Add a route in `mockRoutes.ts` together with the screen that needs it. Resources loaded directly by the browser (images) use `MOCK_RESOURCE_ROUTES`, which return a data URI or a missing path (like a 404).
- Scenarios are set by URL parameters read once at startup: `mockDelayMs`, `mockError`, `mockNetworkError`, `mockEmpty` (comma-separated keys such as `trainees,locations`), and `mockSingleInstitute=true`.
- A resource the browser loads by itself (the trainee photo in an `img`) has no error response: under `mockError` / `mockNetworkError` its key (`traineePhotos`) returns an address that fails to load, so the fallback shows. The mock photo is one real image for every trainee (`src/assets`, loaded through webpack's built-in `asset/resource` rule; imported only by the mock layer).

## Local persistence

- User selections that should survive visits use `saveWithExpiry` / `readWithExpiry` (`src/infrastructure/expiringStorage.ts`). Each save renews the expiry, and every read validates the stored shape.
  - Today: the selected institute (`store/instituteSelection.ts`) and the trainees wing filter (`features/trainees-list/wingFilterSelection.ts`).
- All keys are in `STORAGE_KEYS` (`src/config/appConstants.ts`). Storage may be blocked inside the iframe, and the app must keep working without it.

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

- Use `AppIcon` and the registry in `src/shared/components/appIcons.ts`. Production icons are image files from storage (`<img src>`). An entry is either that URL or a temporary `@mui/icons-material` component.
