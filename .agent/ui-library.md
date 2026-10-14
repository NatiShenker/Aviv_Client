# UI Library (Controls)

Binding guidance for using, wrapping or adding any control in Aviv. Read it together with `design.md`.

## What it is

The organization's shared React component library: `Ips*` components that wrap MUI v7, plus a theme built from Figma tokens and full RTL support. All Aviv controls come from it.

| Source | Use it for |
|---|---|
| `../ui-library/` | The library itself. **Read-only** for this project; never edit it. |
| `../ui-library/README.md` | The props API of every component (Hebrew). The source of truth for usage. |
| `reference/storybook/StorybookCatalog.tsx` | Live usage examples of every component. Copy the usage pattern, not its import paths: it imports from the library's internal files. |
| `../ui-library/THEME_NOTES.md` | How the Figma tokens map to the MUI theme. |
| `../ui-library/docs/PACKAGING_NOTES.md` | Known packaging defects of the library. |

## How to consume it

- Always import from the package name: `import { IpsButton } from "ui-library"`.
- Never import from `../ui-library/src`, `../ui-library/dist` or any relative path into the library.
- On the external network the package is not on npm, so `ui-library` is a local bridge: webpack aliases built on `UI_LIBRARY_PATH` in `webpack.config.js`, and a tsconfig `paths` entry, all point to the sibling folder's built `dist`. Moving to the internal npm package means removing those entries and adding the dependency to `package.json`.
- The library expects React, MUI, Emotion and the date pickers from the consuming app. Webpack resolves them from Aviv's `node_modules` first, so there is one instance of each.

## App root

- `IpsThemeProvider` provides the theme, the RTL Emotion cache, `CssBaseline` and `dir`. It is safe to nest inside a Shell that has its own.
- `IpsToastProvider` enables `useToast()`.
- Both are set once in `src/App.tsx`. Do not add another MUI `ThemeProvider`, Emotion cache or `CssBaseline`.

## Rules

- Screens use library controls. Never use MUI controls (`@mui/material`) directly in a screen.
- When the library has no matching control, build an app-level wrapper around MUI: one control per file, styled from the library theme. Ask before adding one, since it may belong in the library instead.
- Use a control's own props (`variant`, `size`, `color`, `error`, `helperText`, …) for its appearance. Tailwind classes do not override control styles (see `design.md`).
- Icons: `@mui/icons-material` is installed because the library requires it. The icon source for the app is not decided yet; ask before choosing icons for a real screen.

## Mapping: sketch element → library control

| Sketch element | Control | Notes |
|---|---|---|
| Primary and outlined buttons, bottom CTA, edit button | `IpsButton` | `variant`, `fullWidth`, `startIcon`/`endIcon`, `loading`. |
| Back, close, toolbar icons | `IpsIconButton` | Requires `icon`; add `aria-label`. |
| Search field, phone input | `IpsTextField` | `type="search"` adds a search icon; `startAdornment`/`endAdornment`. |
| Details text | `IpsTextArea` | Fixed width (288px, or 576px with `wide`); see gaps. |
| Reason select | `IpsSelect` | `options: { label, value }[]`. |
| Devices multi-select | `IpsChipSelect` | Or `IpsSelect` with `multiple`. |
| Approver picker with search | `IpsAutocomplete` | Functional match; the sketch shows it as a bottom sheet. |
| Date range | `IpsDatePicker` ×2 | Values are `Date`. |
| Hour range | `IpsTimePicker` ×2 | Values are `Moment`. |
| Repeat toggle | `IpsSwitch` | |
| Filter chips (status, wing) | `IpsPillSelect` | Single or `multiple`. |
| Bottom sheets (sort, filter) | `IpsDrawer` | `anchor="bottom"`. |
| Expandable record card | `IpsAccordion` | Candidate only; the sketch card looks different. |
| Save and error feedback | `useToast` | Not shown in the sketches. |
| Confirmations | `IpsDialog` | Not shown in the sketches. |
| Required attachment | `IpsFileUpload` | See "File upload" below. |

Other library components not used by the sketches: `IpsDateTimePicker`, `IpsTable`, `IpsDataTable`, `IpsTabs`, `IpsStepper`, `IpsCarousel`, `IpsRichTextEditor`, `IpsToolTips`, `IpsCheckBox`.

## File upload

`IpsFileUpload` uploads files directly to the organization's file server and returns an `UploadResult` (path and related details). Aviv stores those details as part of its own record, through the service layer; it does not handle the file contents.

**Open decision**: the file server is not reachable from the external network, and it is not decided how the upload is simulated. Ask before implementing an attachment field.

## Gaps: no matching control in the library

- Radio group (exception type, voice message scope).
- Status badge (active / blocked / ended).
- Removable chips for a list of entered values (phone numbers).
- Single-select bottom sheet with search (the sketch's approver picker).
- Loading, empty and error states.
- Page header with back or close action.
- Full-width `IpsTextArea`: the component has a fixed width.

## Known issues

- **Mixed date types**: `IpsDatePicker` and `IpsDateTimePicker` use `Date`, while `IpsTimePicker` uses `Moment`. Convert at the boundary between the form and the service layer.
- **Date picker locale**: `IpsDatePicker` does not set a Hebrew locale, so its calendar texts are in English.
- **Time picker locale**: the library registers moment's Hebrew locale on its own copy of moment. Aviv registers it again on its own copy in `src/bootstrap.tsx`; keep that import.
- **Missing `dist/node_modules`**: the library's `dist` imports bundled copies of `moment`, `@tanstack/*` and `@tiptap/*` from `dist/node_modules/`, but the library's `.gitignore` excludes that folder, so it is missing from the repository. `webpack.config.js` redirects those imports to the library's own `node_modules`. This is part of the local bridge; recheck it when moving to the npm package.
- **Undeclared requirement**: `@mui/icons-material` is required by the library's `dist` but not declared in its `package.json`; Aviv declares it.
- **Bundle size**: importing from the package root pulls in the whole library, including the rich-text editor (`@tiptap/*`) and all moment locales, even when unused.
