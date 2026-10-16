# UI Library (Controls)

Binding guidance for using, wrapping or adding any control in Aviv. Read it together with `design.md` and `CLAUDE.md`.

## What it is

The organization's shared React component library: `Ips*` components (wrapping MUI v7 or native mobile controls), plus a theme built from Figma tokens and full RTL support. All Aviv controls come from it.

| Source | Use it for |
|---|---|
| `../ui-library/` | The library itself. Protected shared repository: do **not** edit casually; any additions or modifications must follow the `<architect_review>` protocol on branch `AVIV` (see Rules below). |
| `../ui-library/README.md` | The props API of every component (Hebrew). The source of truth for usage. |
| `reference/storybook/StorybookCatalog.tsx` | Live usage examples of every component. Copy the usage pattern, not its import paths: it imports from the library's internal files. |
| `../ui-library/THEME_NOTES.md` | How the Figma tokens map to the MUI theme. |
| `../ui-library/docs/PACKAGING_NOTES.md` | Known packaging defects of the library. |

## How to consume it

- Always import from the package name: `import { IpsButton } from "ui-library"`.
- Never import from `../ui-library/src`, `../ui-library/dist` or any relative path into the library.
- The library expects React, MUI, Emotion and the date pickers from the consuming app. Webpack resolves them from Aviv's `node_modules` first, so there is one instance of each.

## App root

- `IpsThemeProvider` provides the theme, the RTL Emotion cache, `CssBaseline` and `dir`. It is safe to nest inside a Shell that has its own.
- `IpsToastProvider` enables `useToast()`.
- Both are set once in `src/App.tsx`. Do not add another MUI `ThemeProvider`, Emotion cache or `CssBaseline`.

## Rules & Mobile Native-First Strategy

- **All Controls Come from `ui-library`:** Screens use `ui-library` controls (`Ips*` / `Ips*Mobile`). Never use raw MUI controls (`@mui/material`) or unencapsulated raw HTML controls directly inside a screen file.
- **Mobile Native-First Policy (`Ips*Mobile` vs `Ips*`):**
  - Although desktop controls generally use MUI, **on Mobile you must first evaluate whether a native HTML/OS control provides a good, natural mobile UX** (for example: native `<select>`, `<input type="date">`, `<input type="time">`, `<input type="range">` slider, etc.).
  - **When a good native mobile option exists:** Create a dedicated mobile control inside `../ui-library` named **`Ips<Control>Mobile`** (e.g., `IpsSliderMobile`, `IpsDatePickerMobile`, `IpsTimePickerMobile`, `IpsSelectMobile`) built on the native control, and consume it in the mobile app. Later, when Desktop mode is developed, a separate `Ips<Control>` based on MUI will be created/used for desktop.
  - **When NO good native option exists:** Create or use a single `Ips<Control>` in `../ui-library` based on MUI that serves both mobile and future platforms.
- **Modifying the UI Library (Sensitive Action):** Creating a new `Ips*Mobile` / `Ips*` control or modifying an existing one in `../ui-library` triggers the architect's self-review protocol (`<architect_review>` in `CLAUDE.md`).
- **Infrastructure Git Workflow:** Any changes to `../ui-library` must be performed on a dedicated branch named `AVIV`.
- **No Autonomous Git Commands:** Do not execute Git commands or create Pull Requests (PRs) for library changes on your own. Implement the changes locally, ask the user to verify that they function correctly and meet UX standards, and—only after the user's approval—provide the specific Git commands for the user to execute.
- Use a control's own props (`variant`, `size`, `color`, `error`, `helperText`, …) for its appearance. Tailwind classes do not override control styles (see `design.md`).
- Icons: `@mui/icons-material` is installed because the library requires it. The icon source for the app is not decided yet; ask before choosing icons for a real screen.

## Mapping: sketch element → library control (Mobile Native-First check required)

| Sketch element | Library Control / Strategy | Notes |
|---|---|---|
| Primary and outlined buttons, bottom CTA, edit button | `IpsButton` | `variant`, `fullWidth`, `startIcon`/`endIcon`, `loading`. |
| Back, close, toolbar icons | `IpsIconButton` | Requires `icon`; add `aria-label`. |
| Search field, phone input, duration input | `IpsTextField` (or `IpsTextFieldMobile`) | `type="search"` / `inputMode="tel"` / `inputMode="numeric"`. |
| Details text | `IpsTextArea` | Note fixed width gap below; adjust in `ui-library` if full-width is needed. |
| Reason select | `IpsSelectMobile` (native `<select>`) or `IpsSelect` | Prefer native OS picker on mobile (`IpsSelectMobile`) per Mobile Native-First rule. |
| Devices multi-select | `IpsMultiSelectMobile` (native `<select multiple>`) or `IpsChipSelect` | Prefer native mobile multi-select picker on mobile if suitable. |
| Date range | `IpsDatePickerMobile` (native `date`) or `IpsDatePicker` | Native mobile date picker avoids the English locale issue of `IpsDatePicker` and gives native OS UX. |
| Hour range | `IpsTimePickerMobile` (native `time`) or `IpsTimePicker` | Native mobile time picker avoids `Moment` overhead and gives native OS UX. |
| Approver picker | **External 3rd-party Approver MFE** (or `OptionsSheet` in simulation) | In production, approver selection is handled via a 3rd-party MFE. |
| Repeat toggle | `IpsSwitch` | |
| Filter chips (status, wing, etc.) | `IpsPillSelect` | Single or `multiple`. |
| Bottom sheets (sort, filter) | `IpsDrawer` | `anchor="bottom"`. |
| Expandable record card | Custom app card or `IpsAccordion` | Must match the UX behavior specified in `00-foundations.md §3.22`. |
| Save and error feedback | `useToast` | |
| Confirmations | `IpsDialog` | |
| Required attachment | `IpsFileUpload` | Uploads directly from the client to SharePoint. |
