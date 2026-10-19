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

- `IpsThemeProvider` provides the theme, the RTL Emotion cache, `CssBaseline` and `dir`. Nested inside a Shell that has its own provider, it reuses the Emotion cache but still renders `CssBaseline`, whose global `html` / `body` styles apply to the Shell page (see the desktop readiness backlog in `pending-decisions.md`).
- `IpsToastProvider` enables `useToast()`.
- Both are set once in `src/App.tsx`. Do not add another MUI `ThemeProvider`, Emotion cache or `CssBaseline`.

## Rules & Mobile Native-First Strategy

- **All Controls Come from `ui-library`:** Screens use `ui-library` controls (`Ips*` / `Ips*Mobile`). Never use raw MUI controls (`@mui/material`) or unencapsulated raw HTML controls directly inside a screen file.
- **Mobile Native-First Policy (`Ips*Mobile` vs `Ips*`):**
  - Although desktop controls generally use MUI, **on Mobile you must first evaluate whether a native HTML/OS control provides a good, natural mobile UX** (for example: native `<select>`, `<input type="date">`, `<input type="time">`, `<input type="range">` slider, etc.).
  - **When a good native mobile option exists:** Create a dedicated mobile control inside `../ui-library` named **`Ips<Control>Mobile`** (e.g., `IpsSliderMobile`, `IpsDatePickerMobile`, `IpsTimePickerMobile`, `IpsSelectMobile`) built on the native control, and consume it in the mobile app. Later, when Desktop mode is developed, a separate `Ips<Control>` based on MUI will be created/used for desktop.
  - **When NO good native option exists:** Create or use a single `Ips<Control>` in `../ui-library` based on MUI that serves both mobile and future platforms.
  - **Evaluate every part of the control** (trigger area, label, chevron, picker, helper text) against native first. MUI enters only for a part that native cannot fully cover; otherwise an `Ips*Mobile` uses no MUI components (the theme's styling engine is fine).
- **Controls follow the layout:** the mobile layout uses `Ips*Mobile` (native-first); the desktop layout uses the MUI-based `Ips*`.
  - In the forms, the shared blocks take their controls from the layout (`useFormControls()`; `MOBILE_FORM_CONTROLS` / `DESKTOP_FORM_CONTROLS`, see `infrastructure.md` › Form controls per layout). Never import an `Ips*Mobile` or a desktop control into a shared form block.
  - In the mobile layout, every control must look and behave like a mobile control (touch-sized, mobile patterns, no desktop chrome), native or not. If an existing control does not, adapt it in the library (a mobile variant or an `Ips*Mobile` control).
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
| Single choice between a few options (limit type, scope, restriction or permit) | `IpsRadioGroupMobile` (available) | Native radios behind drawn 20px circles, one wrapping row. A `description` on the options stacks them, each with its consequence – used for every choice that defines a record (spec 00 §3.8). |
| Date range | `IpsDatePickerMobile` (available) | Native `date` under the field box; `formatValue`, `min`/`max`, `muted`. Avoids the English locale issue of `IpsDatePicker`. |
| Hour range | `IpsTimePickerMobile` (available) | Native `time` under the field box; `clearButtonLabel` turns the clock icon into a clear X. No `Moment`. |
| Approver picker | **External 3rd-party Approver MFE** | Imported only through `src/integrations/approver-mfe/ApproverPicker` (a stand-in until the MFE arrives). Wrapped by the app's `ApproverField`. |
| Repeat toggle | `IpsSwitch` | |
| Filter chips (few fixed options) | `IpsPillSelect` | Single or `multiple`. `label` for the group title; `allowDeselect={false}` when the group always keeps a value (e.g. "הכל"). On mobile `size="large"` (44px). |
| Bottom sheets (sort, filter) | `IpsDrawer` | `anchor="bottom"`: grab handle, drag down to close, height up to 90%. Pass `closeButtonLabel="סגירה"`. |
| Form sheet (create / edit) | `IpsDialog` | `fullScreen` + `transition="slide"` + `rtl`; header through `renderHeader` (Hebrew close label, touch-sized X). Use the app's `FormSheet`. |
| Expandable record card | Custom app card or `IpsAccordion` | Must match the UX behavior specified in `00_foundations.md §3.22`. |
| Save and error feedback | `useToast` | |
| Confirmations | `IpsDialog` | |
| Required attachment | `IpsFileUpload` | Uploads directly from the client to SharePoint after its own "שמור קבצים". Wrapped by the app's `ApprovalFileField` (one file, attached-file row). |

## Mapping: desktop layout

| Element | Library control | Notes |
|---|---|---|
| Search field | `IpsTextField type="search"` | `fullWidth`, `placeholder`, `clearButtonLabel` (Hebrew, keyboard-reachable clear button), `aria-label` through `inputProps`. `onChange` passes the event: read `event.target.value`. |
| Single select (filter, sort, reason) | `IpsSelect` | External label: `FieldLabelText id` + `labelId`. Without a visible label: `inputProps={{ "aria-label": … }}` – a top-level `aria-label` lands on the wrapper, not on the control. `renderValue` can change the closed value only (e.g. "מיין לפי: …" in the list, a sort icon + "מיון" in the drawer's history). For a form field that must take focus by id: `SelectDisplayProps={{ id }}` (the focusable combobox). |
| Multi-select (wing, location filters, devices) | `IpsSelect multiple` | No explicit "הכל" option on desktop (pending-decisions): `placeholder` "הכל" shows for an empty selection, and `renderValue` shows the summary (one name, or "{n} נבחרו"; the devices: one name or "{n} מכשירים"). Groups through `group` on the options. |
| Context selector in a header row (institute, the action in the drawer) | `IpsSelect` + `sx` at the usage | A one-off plain look (no border, inherited font and color), set where it is used (`CONTEXT_SELECT_SX` in `shells/desktop/contextSelectSx.ts`); the control itself is unchanged. |
| Secondary action (e.g. "נקה מסננים") | `IpsButton variant="outlined" size="small"` | `startIcon` with `AppIcon`. |
| Side drawer (trainee drawer) | `IpsDrawer anchor="left"` | `anchor` is the physical edge (the end side in RTL); `size` 480, `renderHeader` for the trainee header. A one-off `sx` at the usage (`SideDrawer`) clears the padding and scrolling of `.ips-drawer-content`, so each screen decides what scrolls; `SlideProps.onExited` runs after the closing animation. Escape inside a text field is ignored by `SideDrawer`. |
| Date (forms) | `IpsDatePicker` | `locale={he}` (`date-fns/locale`; the `locale` prop was added on branch `AVIV`), `format="dd/MM/yy"`, `enableAccessibleFieldDOMStructure={false}` (a plain input that takes the field `id`), `localeText` placeholders `--`, `slotProps.textField` for `id`, `fullWidth` and `aria-labelledby`. A muted default value through `sx` at the usage. Values: `Date` ↔ `'YYYY-MM-DD'` in `pickerValues.ts`. |
| Time (forms) | `IpsTimePicker` | `ampm={false}`, `format="HH:mm"`, `enableAccessibleFieldDOMStructure={false}`, `slotProps.field.clearable` with `localeText.fieldClearLabel` (the Hebrew clear label). Values: `Moment` ↔ `'HH:mm'`. |
| Text field (phone, duration) | `IpsTextField` | `inputProps` for `inputMode`, `maxLength`, `enterKeyHint`, `onKeyDown` and the aria attributes; `endAdornment` for the unit ("דק'"), the icon, or a clear button (`IpsIconButton`) once there is a value. |
| Details text | `IpsTextArea` | `fullWidth` (the control's default width is a fixed 288px), `rows={3}`. |
| Single choice between a few options (limit type, scope, restriction or permit) | `IpsRadioGroup` (added on branch `AVIV`) | Same API as `IpsRadioGroupMobile`: one wrapping row, or stacked with a `description` per option. `variant="cards"` makes each option a bordered card, clickable as a whole, for choosing one record among several (a permit's restriction, 04 form §8.1). |
| Confirmation (e.g. leaving with unsaved changes) | `IpsDialog` | `title`, `showCloseButton={false}`, `maxWidth="xs"`. `actions`: the safe `IpsButton variant="outlined"` first (right, `autoFocus`), then the confirming one (left). A destructive confirmation is `variant="contained" color="error"`. |
| Form footer | `IpsButton` | Regular size on desktop (`FormFooter buttonSize="medium"`); `large` only on mobile. |
