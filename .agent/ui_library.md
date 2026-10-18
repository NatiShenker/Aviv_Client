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
  - **Evaluate every part of the control** (trigger area, label, chevron, picker, helper text) against native first. MUI enters only for a part that native cannot fully cover; otherwise an `Ips*Mobile` uses no MUI components (the theme's styling engine is fine).
- **Mobile look and behavior:** while the app is mobile-only, every library control a screen uses must look and behave like a mobile control (touch-sized, mobile patterns, no desktop chrome), native or not. It does not have to be the most modern look, but it must clearly read as mobile. If an existing control does not, adapt it in the library (a mobile variant or an `Ips*Mobile` control).
- **Modifying the UI Library (Sensitive Action):** Creating a new `Ips*Mobile` / `Ips*` control or modifying an existing one in `../ui-library` triggers the architect's self-review protocol (`<architect_review>` in `CLAUDE.md`).
- **Changing the design of an existing control:** first check whether Aviv created it (the `Ips*Mobile` controls and the variants added on branch `AVIV` – see the library's git history) or whether it existed in the library before.
  - **Created by Aviv:** its design may be changed relatively freely (still with `<architect_review>`).
  - **Existed before:** change it only with a serious justification – a shared need, not a local preference. For a one-off need, override that specific point where the control is used (through the control's own styling props, e.g. `sx`), and leave the control unchanged.
- **Infrastructure Git Workflow:** Any changes to `../ui-library` must be performed on a dedicated branch named `AVIV`.
- **No Autonomous Git Commands:** Do not execute Git commands or create Pull Requests (PRs) for library changes on your own. Implement the changes locally, ask the user to verify that they function correctly and meet UX standards, and—only after the user's approval—provide the specific Git commands for the user to execute.
- Use a control's own props (`variant`, `size`, `color`, `error`, `helperText`, …) for its appearance. Tailwind classes do not override control styles (see `design.md`).
- Icons: always through `AppIcon` (see `.agent/infrastructure.md` › Icons). Production icons are image files from storage; `@mui/icons-material` serves only as a temporary stand-in.

## Mapping: sketch element → library control (Mobile Native-First check required)

| Sketch element | Library Control / Strategy | Notes |
|---|---|---|
| Primary and outlined buttons, bottom CTA, edit button | `IpsButton` | `variant`, `fullWidth`, `startIcon`/`endIcon`, `loading`. Mobile primary actions (sheet / form footers): `size="large"` (48px). |
| Back, close, toolbar icons | `IpsIconButton` | Requires `icon`; add `aria-label`. In a mobile toolbar next to a field: `variant="surface"` (44px white square, outlined like the fields, button radius). |
| Search field | `IpsSearchFieldMobile` (available) | Native `<input type="search">`, 44px, outlined like the other mobile fields (field radius); pass `clearButtonLabel`. |
| Phone input, duration input | `IpsTextFieldMobile` (available) | Native `<input>`, 16px (no iOS zoom). `inputMode="tel"` / `"numeric"`, `suffix` (unit after the value), `endIcon`, `clearButtonLabel`. `IpsTextField` uses 14px and zooms on iOS. |
| Details text | `IpsTextAreaMobile` (available) | Native `<textarea>`, full width, 16px, `rows` (default 3), not resizable. `IpsTextArea` has a fixed 288px width and 14px text. |
| Reason select, institute selector | `IpsSelectMobile` (native `<select>`, available) or `IpsSelect` | Prefer native OS picker on mobile (`IpsSelectMobile`) per Mobile Native-First rule. `onChange` returns the option's original value type. `variant="plain"` (text + chevron) for a context selector in a header row. |
| Multi-select (devices, wing/location filters) | `IpsMultiSelectMobile` (available) | Native `<select multiple>` on a real iPhone/iPad; `IpsSelect multiple` elsewhere (Android, desktop, devtools emulation). `allOptionLabel` adds an explicit "הכל" option. |
| Grouped options (any select) | `group` on `IpsSelectOption` | Native `<optgroup>` / menu subheaders, in all select controls. |
| Single choice from a list of rows (sort options) | `IpsRadioListMobile` (available) | Native radios as full-width rows; selected row bold with a check. |
| Single choice between a few options side by side (limit type) | `IpsRadioGroupMobile` (available) | Native radios behind drawn 20px circles, one wrapping row. |
| Date range | `IpsDatePickerMobile` (available) | Native `date` under the field box; `formatValue`, `min`/`max`, `muted`. Avoids the English locale issue of `IpsDatePicker`. |
| Hour range | `IpsTimePickerMobile` (available) | Native `time` under the field box; `clearButtonLabel` turns the clock icon into a clear X. No `Moment`. |
| Approver picker | **External 3rd-party Approver MFE** | Imported only through `src/integrations/approver-mfe/ApproverPicker` (a stand-in until the MFE arrives). Wrapped by the app's `ApproverField`. |
| Repeat toggle | `IpsSwitch` | |
| Filter chips (few fixed options) | `IpsPillSelect` | Single or `multiple`. `label` for the group title; `allowDeselect={false}` when the group always keeps a value (e.g. "הכל"). On mobile `size="large"` (44px). |
| Bottom sheets (sort, filter) | `IpsDrawer` | `anchor="bottom"`: grab handle, drag down to close, height up to 90%. Pass `closeButtonLabel="סגירה"`. |
| Form sheet (create / edit) | `IpsDialog` | `fullScreen` + `transition="slide"` + `rtl`; header through `renderHeader` (Hebrew close label, touch-sized X). Use the app's `FormSheet`. |
| Expandable record card | Custom app card or `IpsAccordion` | Must match the UX behavior specified in `00-foundations.md §3.22`. |
| Save and error feedback | `useToast` | |
| Confirmations | `IpsDialog` | |
| Required attachment | `IpsFileUpload` | Uploads directly from the client to SharePoint after its own "שמור קבצים". Wrapped by the app's `ApprovalFileField` (one file, attached-file row). |
