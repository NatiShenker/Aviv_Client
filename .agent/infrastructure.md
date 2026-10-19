# Client Infrastructure

Binding guidance for the shared infrastructure every screen uses. Read it with `CLAUDE.md`.

## Folder layout

- `src/` root — the app-level files: `bootstrap.tsx` (entry), `App.tsx` (providers and routes), `routes.ts`, `appConstants.ts`.
- `src/shells/mobile/` — the mobile page shell: page root, header, pinned top, sticky action bar, the full-screen form sheet, the mobile navigation (`navigation/`) and the window hooks (`hooks/`). A desktop shell will sit next to it.
- `src/features/<feature>/` — one folder per feature: the `*Screen.tsx` composition, its components and hooks, and its `*Logic.ts`, `*Options.ts` and `*Texts.ts` files.
  - The record features (trainee restrictions, number restrictions, voice messages) split into `history/` and `form/`; a file used by both stays at the feature root. Other features keep their components in `components/`.
  - `features/records/` — the building blocks the record features share (spec 00 §3–§4): `history/` and `form/`.
  - `features/institutes/` — the selected institute, wings and permissions. `features/trainee/` — the trainee of the current route and its display name.
- `src/shared/` — generic code with no domain knowledge: hooks, small components, form primitives, icons, formatting, dates.
- `src/services/` — one file per controller, plus `serviceEndpoints.ts`. `src/infrastructure/` — http, api, errors, storage.
- `src/mock-server/` — the simulated service.
- **Dependency direction:** `shared` imports nothing from `features`, `shells` or the root files (except `appConstants.ts`); `shells` import nothing from `features`.
- **Platform split:** state, logic, cards, data hooks and form bodies know nothing about routes or the page (e.g. `useRecordHistoryState`, `useHistoryFormTarget`, `RecordFormTarget`, the menu model of 02). Routes and page containers stay in `shells/mobile` and in each feature's mobile composition (`*Screen.tsx`, `*History.tsx`, `*FormSheet.tsx`, `use*FormRoute.ts`). A desktop shell reuses the first group and replaces the second.
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

- Use `useAsyncResource({ requestKey, load, isEmpty, readCache })` for every query. It returns `idle | loading | success | empty | error`, the data, the error and `reload`. A changed `requestKey` reloads, and stale responses are ignored.
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
- **Returning to a list screen** restores it as the user left it, until a page reload:
  - A small in-memory module of the screen holds the search, filters and sort (e.g. `traineesListMemory.ts`), along with the number of items shown and the scroll position.
  - The position is restored with `useIncrementalList`'s `initialVisibleCount` and `useWindowScrollRestoration`.

## Icons

- Use `AppIcon` and the registry in `src/shared/icons/appIcons.ts`. Production icons are image files from storage (`<img src>`). An entry is either that URL or a temporary `@mui/icons-material` component.
