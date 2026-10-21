# 00 – Foundations

Everything shared by all screens. Screen files reference the components and patterns here by name.

---

## 1. Platform

- **Mobile web**, Hebrew, right-to-left: every screen root has `dir="rtl"` and `lang="he"`.
- **Desktop layout** (Aviv's container ≥ 1024px, decided 2026-10-19): the same rules, with a desktop composition per screen. The shared desktop rules are in [design.md](../design.md) › Desktop layout, and each screen spec describes its desktop layout in its own section: the trainees list ([01 §8](01_children_list.md)), the trainee drawer ([02 §8](02_child_actions.md)) and the history and form specs of 03–05 (§8 in each). The history and form screens share one desktop pattern (§4.4).
- **Content width:** the full width of the frame, with no fixed width; every screen fits 320px without horizontal scroll ([design.md](../design.md)). The app background (`#f6f8fe`) fills the viewport.
- **Font:** Rubik, weights 400 / 500 / 600. Load once globally.
- **Top spacing:** 50px above the header on every screen (status-bar area).
- **Mixed direction:** dates, times, ranges, phone numbers and "+N" counters are wrapped in `dir="ltr"` spans so they read left to right inside RTL text.
- **Address and direct entry:** Aviv's URL is appended to the host's URL: host domain (with the environment prefix) + the host's own route + Aviv's route. The part of the path before Aviv's route is the router base, derived at startup, so every in-app link keeps the host prefix. A direct entry to an inner Aviv route (a link or a page refresh) starts at the children list (the address is replaced; query parameters such as the mock scenarios are kept, but `basedOn`, which belongs to the create route, is removed).

---

## 2. Design tokens

### 2.1 Colors

| Proposed token | Value | Usage |
|---|---|---|
| `text-primary` | `#00033d` | Main text, icons, titles; filled navy buttons and active chips on the children list |
| `action` | `#006aff` | Primary buttons, outline buttons, links, radio, switch (on), focus border, selected option check |
| `bg-app` | `#f6f8fe` | Page background, sticky footer background, search input inside sheets |
| `text-secondary` | `#8e929f` | Secondary text, field labels, placeholders, input borders, disabled button background. **In code** (decided 2026-10-20): the provisional token `text-muted` is `#667085` – the sketch shade is only 3.1:1 on white, below WCAG AA for small text; `#667085` is 5.0:1 on white and 4.6:1 on the app background |
| `divider` | `#c5cbdd` | Header bottom line, section dividers, card outline (0.5px), switch (off) |
| `error` | `#a72223` | Error text, invalid field border, required asterisk |
| `chip` | `#e0ebff` | Phone chips, type tag, selected multi-select options, action-row icon circle, voice record icon circle |
| `danger-soft` / `danger-icon` | `#fef2f2` / `#fb444c` | Record icon circle on the trainee and number history lists |
| `success-soft` / `success` | `#e7ffef` / `#069940` | "Active" badge on history lists |
| `muted-soft` | `#f6f9fc` | Not used since 2026-10-20: the "ended" badge is `text-secondary` on `grey-100` (with `divider` text it was 1.5:1, nearly invisible) |
| `warning` | `#bd4d00` | Data-gap warning on the children list |
| `border-light` | `#ededed` | Sheet row separators, actions-screen dividers |
| `border-inner` | `#ebebf0` | Divider inside a children card |
| `grabber` | `#dfe3ec` | Bottom sheet grab handle |
| `chevron` | `#0c3058` | Expand chevron on history cards |
| `info-box` | `#f8f9fb` | Voice message content box (with a `#c5cbdd` border) |
| `overlay` | `#00033d` at 40% | Bottom sheet backdrop |

### 2.2 Typography (size / line height, px)

| Role | Size | Weight | Color |
|---|---|---|---|
| Page title (header `h1`) | 20 / 25 | 500 | `text-primary` |
| Children list title, sheet title | 18 / 23 | 500 | `text-primary` |
| Section title (`h2`), body text, input value, card lines, detail values | 16 / 20 | 400 | `text-primary` |
| Primary and outline buttons | 16 / 20 | 600 | – |
| Radio option label | 16 / 24 | 400 | `text-primary` |
| Field label (every field, including the labels above the filter groups) | 12 / 12 | 400 | `text-secondary` – the library's mobile field label; `FieldLabelText` matches it (decided 2026-10-20) |
| FieldIntro, accordion row, toolbar label, detail label | 14 / 18 | 400 | `text-secondary` (labels) / `text-primary` (titles) |
| Hint text, error text, compact FieldIntro description | 12 / 15 | 400 | `text-secondary` / `error` |
| Badge, type tag | 10 / 12 | 400 | per badge |

### 2.3 Shape and spacing

| Element | Spec |
|---|---|
| Page side padding | 16px (20px on the children list) |
| Header | 41px tall, 0.5px bottom line `divider` |
| Section divider | 0.5px `divider`, 24px above, 23.5px below |
| Field | 42px tall, radius from the library field token (6), 1px border, 16px side padding; focus border `action`; invalid border `error`. The search field and toolbar icon buttons are outlined the same way (44px) |
| Button | 48px tall, radius 8. Primary: `action` background, white text. Outline: white background, 1px `action` border, `action` text |
| Card | **One rule for every card:** white, radius from the library card token (12), padding 16. On the page background (history cards, children cards, action rows) – **no border**. On a white surface (inside a form sheet) – 1px `divider` border. Rows that stand in a field's place (an attached file, a chosen approver) look like a field (field radius, field border) |
| Bottom sheet | Top radius 24, side padding 20, bottom padding 32 above the screen's safe area (the iPhone home bar), grab handle 40×4 |
| Badge / tag | 20px tall, pill, 8px side padding |
| Sticky footer | Stays at the bottom of the viewport, `bg-app`, 12px top padding, 24px bottom padding. Implemented as `position: sticky` inside the page (not `fixed`), so it moves with the page during the page transition and never hides the last item |

### 2.4 Motion

| Name | Spec | Used for |
|---|---|---|
| `fadeIn` | Opacity 0→1, 200ms ease-out | Sheet backdrop, accordion content, fields and blocks that appear conditionally |
| `sheetUp` | translateY(100%)→0, 300ms ease-out | Bottom sheets |
| Card expand | Height 0→content height, while the content fades in and moves down slightly (8px); 300ms ease-out. Collapse runs the same in reverse | Expandable record cards on history screens |
| Chevron rotate | 180°, 200ms (300ms on expandable cards, in sync with the card expand) | Accordions, expandable cards |
| `pageEnterForward` / `pageEnterBack` | translateX(-100%)→0 / translateX(100%)→0, 300ms ease-out. Only the incoming page moves; the outgoing page disappears at once | Navigation between pages: forward enters from the left, back from the right (RTL). No animation on the first page of a visit or on a replace |
| Form sheet | Slides up on open and down on close. Covers the whole screen: no rounded corners, no grab handle, no drag to close | Create / edit forms open over their history screen instead of navigating sideways. Implemented by `IpsDialog` `fullScreen` + `transition="slide"` |
| Drawer screens (desktop) | Like `pageEnterForward` / `pageEnterBack`, and **the outgoing screen moves too** (decided 2026-10-19 – a deviation from the mobile rule above, for the drawer only): forward, the new screen enters from the left while the old one is pushed out to the right; back, the reverse. 300ms ease-out | Screens inside the trainee drawer ([02 §8.5](02_child_actions.md)), including the form layer: it enters like a forward screen and leaves like a back, and the history under it moves with it. No slide when switching the action in the selector (like a replace) or on the first screen of an opening (the drawer itself slides in) |

Production: respect `prefers-reduced-motion` for all animations.

### 2.5 Icons

24×24 outline icons, stroke 1.5 (1.6 on the children list and actions screen), round caps and joins, no fill, always `aria-hidden`. Used: back arrow, close X, chevron down, chevron left (action rows, links), search, sort, filter, check, calendar, clock, timer, phone, plus, file upload, edit, location pin, warning circle, person, open lock (number records), circle with slash (trainee restrictions), microphone with plus (voice messages).

---

## 3. Shared components

Each entry: **structure**, **states**, **used in**.
**Architectural rule (`ui-library`):** `Aviv_Client` does **not** manage primitive controls itself; all form controls are consumed from `ui-library`. On Mobile, `ui-library` prioritizes native HTML/OS controls first wrapped as `Ips*Mobile` (e.g., `IpsDatePickerMobile`, `IpsTimePickerMobile`, `IpsSelectMobile`, `IpsMultiSelectMobile`, `IpsSliderMobile`), falling back to MUI-based `Ips*` controls only when no suitable native mobile option exists. The behavioral specifications below define the required UX for these controls.

### 3.1 Headers

- **HistoryHeader** – back arrow (aria-label `"חזרה"`) to the actions screen, then the page title. Used in all history screens.
- **FormHeader** – page title, and on the opposite side a close X (aria-label `"סגירה ללא שמירה"`, closes without saving) back to the history list. In production it is the header of the full-height form sheet. Used in all forms.
- **The trainee under the title** (decided 2026-10-20): the history and form headers show the trainee as a line under the title – `"{name} | {code}"`, 14px, `text-secondary` – so a sensitive action always shows whom it is about. The back arrow and the X stay aligned with the title line. On the actions screen the trainee is the subject: its name is the title, and the personal number is the gray line under it ([02 §3.1](02_child_actions.md)) – one header shape on every inner screen. The desktop drawer is unchanged (its trainee header frames every screen).
- **Back and close navigation:** the back arrow and the form close go **one step back** in the browser history (so the page enters from the "back" side and no duplicate entries pile up). Every inner screen is reached from inside the app (§1, direct entry), so there is always a previous entry.

### 3.2 Section title and divider

- `h2`, 16/20, regular weight. Blocks inside a form are separated by the **section divider** (§2.3).

### 3.3 FieldIntro

- **Structure:** title (14/18, `text-primary`) and an optional one-line description (14/18, or 12/15 in the **compact** variant, `text-secondary`). The description is truncated with an ellipsis; the full text is in a tooltip (`title` attribute). Without a description it is the title of a stacked radio group.
- **Used in:** date range; title of the limit type and voice message scope groups.

### 3.4 FieldLabel

- 12/12, `text-secondary`, truncated – the same as the library's field labels (decided 2026-10-20; it was 14/18). Required fields add `"*"` in `error` color right after the text.

### 3.5 ErrorText

- 12/15, `error` color, 4px below the field or group, `role="alert"`. Rendered only when there is a message.

### 3.6 PickerInput (date / time)

- **Structure:** optional FieldLabel above; a 42px box with the formatted value (or a placeholder) and a trailing icon (calendar / clock). An invisible native `date`/`time` input covers the whole box, so tapping anywhere opens the native picker.
- **Pairs:** start and end sit side by side in a 2-column grid. Each field has its own label (decided 2026-10-19): `"תאריך התחלה"` / `"תאריך סיום"` (dates), `"שעת התחלה"` / `"שעת סיום"` (times).
- **Placeholders:** `"--/--/--"` (date), `"--:--"` (time).
- **Clearable (time only):** when a time has a value, the icon is replaced by an X button (aria-label `"ניקוי {field}"`, e.g. `"ניקוי שעת התחלה"`). Dates have no clear button.
- **States:** empty, **muted** (a default date the user has not touched yet is shown in `text-secondary`), filled, focused (`action` border), invalid (`error` border, `aria-invalid`).
- **Limits:** supports `min` / `max` (end date `min` = start date; permit dates bounded by their restriction).
- **Implemented by** `IpsDatePickerMobile` / `IpsTimePickerMobile` (native `date` / `time`).

### 3.7 DurationField

- **Structure:** FieldLabel `"משך מרבי לכל שיחה"` + `"*"` (Max duration per call); text input with numeric keyboard; placeholder `"מספר דקות"` (Number of minutes); the unit `"דק׳"` (min, with the Hebrew geresh) appears right after the digits once there is a value; trailing timer icon, or X (aria-label `"ניקוי משך השיחה"`) when filled.
- **Input rules:** non-digits are stripped as you type; max 3 characters.
- **Width:** half of the content width (first column of a 2-column grid).
- **States:** empty, filled, focused, invalid.
- **Used in:** trainee form, number form (inside **LimitTypeSelector**).
- **Implemented by** `IpsTextFieldMobile` (`inputMode="numeric"`, `suffix`, `endIcon`, `clearButtonLabel`).

### 3.8 RadioGroup / RadioOption

- **Structure:** container with `role="radiogroup"` and an accessible name. Each option: a native radio (visually hidden) + a 20px circle with `action` border (1px unchecked, 2px checked) and a 10px `action` dot when checked; label 16/24. Options sit in one wrapping row (16px horizontal gap, 8px vertical gap). Keyboard focus shows a ring around the circle.
- **Stacked variant – choices that define the record** (decided 2026-10-18): every option has a description, so the consequence of each option is visible before choosing. Options are stacked one per row (16px gap): title 16/24 weight 500, description 14/18 `text-secondary` below it; the whole option is tappable, and the description is read after the radio's name. **No asterisk** – a radio group always has a value. The option that reveals a dependent field is **last**, and the field appears right below the group. Used for: `"הגבלה או היתר"` (04), `"סוג ההגבלה"` / `"סוג ההיתר"` (03, 04, via LimitTypeSelector), `"היקף ההפעלה"` (05).
- **Implemented by** `IpsRadioGroupMobile` (a `description` on the options switches it to the stacked variant).

### 3.9 LimitTypeSelector

- **Structure:** FieldIntro title → stacked RadioGroup (§3.8) with two options, each with its description → DurationField (only when the duration option is selected) → ErrorText for the duration.
- **Configurations:**

| Context | Title | Option 1 (default) | Description 1 | Option 2 | Description 2 |
|---|---|---|---|---|---|
| Restriction | `"סוג ההגבלה"` | `"הגבלה מלאה"` | `"השיחות חסומות, למעט השעות והמכשירים שיוגדרו למטה"` (decided 2026-10-21) | `"הגבלת משך שיחה"` | `"השיחות מותרות, עד משך מרבי לכל שיחה"` |
| Permit | `"סוג ההיתר"` | `"היתר מלא"` | `"השיחות מותרות ללא הגבלת משך"` | `"היתר עם הגבלת משך"` | `"השיחות מותרות, עד משך מרבי לכל שיחה"` |

- **Behavior:**
  - Selecting option 2 shows the DurationField with a fade-in and **moves focus into it** – only when the user changed the selection, not when an existing record opens.
  - Switching back to option 1 hides the field. The typed value is kept while the form is open (it reappears if the user switches again) but is **not saved**: option 1 always saves "no duration".
  - Changing the selection clears the duration error.
- **Used in:** trainee form, number form.

### 3.10 ConditionAccordion

- **Structure:** a 40px row button: title (14/18, `text-primary`), then the current value summary (gray, truncated, takes the remaining width), then a chevron. The content below fades in when open. The ErrorText for the condition sits at the bottom of the accordion (under the content when open, under the row when closed) and is **visible in both states**.
- **States:** closed (default), open, with error.
- **Rules:**
  - Closed by default.
  - Opens automatically when the form loads with values in it (edit), and when submit finds an error in it.
  - The user can always open and close it. Nothing forces it open.
- **Accessibility:** `aria-expanded` on the row button.
- **Used in:** "שעות מותרות" and "מכשירים מותרים" in the trainee and number forms.

### 3.11 NativeSelect

- Native single `select`, 42px, chevron on the left. The first option is the placeholder (empty value). Text is gray while empty, `text-primary` once chosen.
- **Used in:** `"סיבה"` (reason).

### 3.12 NativeMultiSelect

- A closed field that opens a multi-select picker. The closed value is a summary: one device's name, or `"{n} מכשירים"`.
- **Nothing selected** (decided 2026-10-21): the field shows the same text as the accordion summary (§3.10), by the "open by default" rule ([03 overview §3.2](03-trainee-restriction/03_trainee_restriction_overview.md)) – `"כל המכשירים"` (All devices) when the restriction is open by default, and always in a permit; `"לא הוגדרו"` (Not set) when everything is blocked. The text changes at once when the type or the hours change. While devices are selected but their list has not loaded (or failed), the field stays empty.
- **Mobile:** `IpsMultiSelectMobile` – the native `select multiple` picker on a real iPhone/iPad, `IpsSelect multiple` elsewhere. **Desktop:** `IpsSelect multiple` ([ui_library.md](../ui_library.md)). Both get the text above as the field's `placeholder`.
- FieldLabel `"מכשירים"` (Devices, decided 2026-10-21).
- **Devices are grouped by wing** (native `optgroup` / menu subheaders), in the institute's wing order, because an institute can have many devices. The group heading is `"אגף {name}"`, or just the name for a virtual wing (e.g. `"מיקומים שונים"`). **No `"הכל"` option** – with nothing selected the rule above applies.
- **Used in:** permitted devices.

### 3.14 DetailsTextArea

- FieldLabel `"פירוט"`, textarea 96px tall (3 rows), placeholder `"הוספת פירוט"` (Add details), not resizable. Implemented by `IpsTextAreaMobile`.

### 3.15 PhoneInputRow, PhoneNumbersField, PhoneSearchField

- **PhoneInputRow:** a field (phone keyboard, placeholder `"מספר טלפון"` (Phone number), phone icon, aria-label `"מספר טלפון"`, described by the hint above it) + an 88px action button next to it. The button is blue when enabled and gray (`text-secondary`) when disabled. Enter triggers the action when it is enabled.
- **PhoneNumbersField (multiple numbers):** hint line → PhoneInputRow with `"הוספה"` (Add) + plus icon (enabled when the input is not blank) → ErrorText → list of chips (aria-label `"מספרים שנוספו"`). Each chip: 32px pill, `chip` background, LTR number, X button (aria-label `"הסרת המספר {phone}"`).
- **PhoneSearchField (one number):** hint line → PhoneInputRow with `"חיפוש"` (Search) + search icon → ErrorText. No chips.
- **Used in:** number form (both), voice form (PhoneNumbersField).

### 3.16 FileField

- FieldLabel `"צירוף קובץ"` + `"*"`. A 42px box that opens the file picker when tapped (aria-label `"צירוף קובץ (חובה)"`). Shows `"העלאת קובץ"` (Upload file) in gray, or the file name in `text-primary`. Trailing upload icon, or X (aria-label `"הסרת הקובץ"`) once a file is chosen.
- **One file only.** Picking again replaces the file.
- **Production:** replaced by the library's upload controls with an attached-file row (§4.3). Mobile (decided 2026-10-20): `IpsFileUploadMobile` – this very field (42px, `"בחירת קובץ"` **(proposed)**, a paperclip icon) plus a camera button, and the upload starts as soon as a file is chosen. Desktop: `IpsFileUpload`, the existing library component the user chose. Both use the same upload mechanism of the library.
- **Used in:** all forms.

### 3.17 Switch

- 48×24 track (`action` when on, `divider` when off), 20px white knob inside it that slides. `role="switch"`, `aria-checked`.
- **A settings row** (decided 2026-10-19): full width – the label (and an optional gray line below it, read as the switch's description) on the right, the switch at the far left. The label is clickable.
- **Used in:** voice form `"הודעה חוזרת"`. Implemented by `IpsSwitch`, sized at the usage (`sx`) – the control existed in the library before Aviv.

### 3.18 StatusBadge

- History lists: `"פעילה"` (restriction, message) or `"פעיל"` (permit) on `success-soft` / `success`; ended – `"הסתיימה"` (restriction, message) or `"הסתיים"` (permit), in the record's gender like the active badge, `text-secondary` on `grey-100` (decided 2026-10-20). Shown next to the date range in the card's meta line (§3.22).
- The children list has its own badge, see [01](01_children_list.md).

### 3.19 TypeTag

- `"היתר"` (permit) or `"הגבלה"` (restriction), `chip` background, `text-primary`. Number history only.

### 3.20 RecordIcon

- 44px circle. Trainee restriction: circle-with-slash icon. Number record: open-lock icon. Both on `danger-soft` with `danger-icon` stroke. Voice message: microphone icon on `chip` with `action` stroke.
- The number list uses **one icon for every card**, whether permit or restriction.

### 3.21 DetailGrid

- Two-column definition list, 16px row gap. Label 14/18 `text-secondary`; value 16/20 `text-primary`, keeps line breaks, wraps long words. Dates, times and phones are LTR. Some items span both columns (`col-span-2`). The first item of each row is on the right (RTL).

### 3.22 ExpandableRecordCard

- **Information order, every action** (decided 2026-10-18): **what → when → conditions → why and who** – the same order as the form.
- **Closed:** a button (`aria-expanded`) with RecordIcon, a **title line** (16/20, `text-primary`, truncated) with what the record does – trainee restriction: its type label; number record: the number + TypeTag; message: the number or `"כל השיחות"` – a **meta line** (16/20 gray) with when – the date range (LTR) + StatusBadge – and a chevron (`chevron` color) that rotates when open. The reason is not in the closed card.
- **Open:** DetailGrid with only what the two summary lines do not already show (they stay visible above it), in the form's order; then a divider and a text button with an icon at the end of the card (left), with a 44px touch target – a secondary action, not a full-width outline button repeated in every card (decided 2026-10-20, both layouts):
  - **Active or future record:** `"עריכה"` (Edit) with an edit icon.
  - **Ended record** (decided 2026-10-19, closing the edit part of [OQ-14](../pending-decisions.md#oq-14)): an ended record **cannot be edited**. The button is `"יצירת … דומה"` (Create a similar …, worded per record type – decided 2026-10-21: `"יצירת הגבלה דומה"`, `"יצירת היתר דומה"`, `"יצירת הודעה דומה"`) with a copy icon, and opens the create form prefilled from the record (§4.2).
- **Motion:** opening and closing animate smoothly ("Card expand", §2.4). While closed, the content is hidden from screen readers and the keyboard.
- **Each card opens and closes on its own; several can be open together** (decided 2026-10-21, both layouts; it was one at a time). Opening a card does not close another, so the tapped card does not jump up when an open card above it collapses, and records can be compared. Tapping an open card closes it. After a save the saved record opens, and the cards that were open stay open.

### 3.23 HistoryToolbar

Same structure and look as the children list header rows 2 and 3 ([01 §3.1](01_children_list.md)), for uniformity across screens:

- **Row 1:** the section title (`h2`, 16px, regular), e.g. `"היסטוריית הגבלות"` – smaller than the page title above it, like the form sections and level 3 in the desktop drawer (decided 2026-10-20; it was 18px, weight 500, almost the page title's size).
- **Row 2:** an always-visible search field (`IpsSearchFieldMobile`, takes the remaining width, clear button `"ניקוי חיפוש"` clears the text) + a square sort button (`IpsIconButton variant="surface"`, sort icon only, aria-label `"מיון"`). Both 44px, white, and outlined like the form fields (the field radius for the search field, the button radius for the sort button), so they read as controls and match the cards below them.
- **Row 3** (decided 2026-10-21): the results count, like the children list row 3 – 14px, `text-muted`, at the start, pinned with the toolbar, so it updates in view while searching. Its text is per action, in the record's gender (§3 of each history spec). The row always keeps its height: while the records load it shows a skeleton bar, and on an error or with no records at all it stays empty – so the cards below never move. With a search that finds nothing it reads 0, above the EmptyState, as in the children list.
- The search field and the sort button are disabled until the records have loaded.
- Results filter live as you type (trimmed substring match).

### 3.24 BottomSheet

- Backdrop (`overlay`, a button with aria-label `"סגירה"`), and a dialog anchored to the bottom (`role="dialog"`, `aria-modal="true"`, aria-label = title): grab handle, title (18/23, 500), X button on the left (aria-label `"סגירה"`), content. Escape closes. Animations `fadeIn` + `sheetUp`.
- **Height:** follows the content, up to 90% of the screen; longer content scrolls inside the sheet.
- **Drag to close:** dragging the sheet down closes it, which is what the grab handle signals.
- Implemented by the app's `BottomSheet` (`shells/mobile/BottomSheet.tsx`): `IpsDrawer anchor="bottom"` with a header built by the app (`renderHeader`) – the title (18/500) at the start and a touch-sized X at the end (left), like the form sheet. The drawer's own composed header puts the X on the right in RTL (a double flip in the library, see pending-decisions) and is smaller than a touch target. The paddings above (20 / 32 + safe area) are set there too; the backdrop is the library's.

### 3.25 SortSheet

- BottomSheet titled `"מיון"` (Sort). One 56px row per sort option, where every option is a field **and** a direction, written `"{field}: {direction}"` (e.g. `"שם: א׳ עד ת׳"`, decided 2026-10-20). There is no separate direction row.
- Rows are separated by a line. The selected row is bold, in the primary color, with a check icon. Implemented by `IpsRadioListMobile` (native radios).
- Choosing a row applies the sort and closes the sheet (decided 2026-10-19). Tapping the row that is already selected changes nothing, so the sheet stays open; the X, the backdrop and dragging down close it.

### 3.26 StickyActionBar

- Sticky bottom bar (§2.3). On a history screen: one full-width primary "create" button. In every form: two equal columns, outline `"ביטול"` (Cancel, closes without saving) + primary `"שמירה"` (Save, submit; decided 2026-10-21) ([OQ-17](../pending-decisions.md#oq-17), closed 2026-10-18).

### 3.27 EmptyState

- Centered text, 16/20, `text-secondary`, 64px below the list area.

---

## 4. Shared patterns

### 4.1 History screen

1. **HistoryHeader** with the feature title.
2. **HistoryToolbar** (§3.23): section title row, then the search field and sort button row, then the results count. The header and the toolbar stay in place; only the cards scroll under them.
3. **Cards** (12px below the toolbar, 8px apart): ExpandableRecordCard per record, rendered incrementally (30 at a time, the next 30 near the end of the list).
4. **EmptyState** when no record matches (or there are none).
5. **StickyActionBar** with one primary "create" button (text + plus icon).

Rules shared by all history screens:

- **Default sort:** start date, descending. Options: `"תאריך התחלה"` (start date), `"תאריך סיום"` (end date), `"סטטוס"` (status: active vs ended, ties broken by start date).
- **Status rows in the record's gender** (decided 2026-10-21): `"סטטוס: פעילות תחילה"` / `"סטטוס: שהסתיימו תחילה"` in the trainee restrictions and the voice messages; `"סטטוס: פעילים תחילה"` / `"סטטוס: שהסתיימו תחילה"` in the number records (restrictions and permits together). The sort keys and logic are shared; each action's texts file holds its two status labels (`statusSort`).
- **Search** matches a text built from the record's visible values (listed per screen). Case-sensitive substring; non-breaking spaces count as spaces.
- **After save:** the list refreshes **silently** – the current cards stay until the new data arrives, with no skeleton, and a failed refresh keeps them with no error message (decided 2026-10-20, both layouts) – and then shows the saved record **open**. If several were saved at once, the first one is open.
- **Edit:** the "עריכה" button opens the form in edit mode for that record – only an active or future record. An edit URL of an ended record goes back to the history list (replace), like an unknown record.
- **Create based on:** on an ended record, the button opens the create form based on it (§4.2).
- The screen scrolls to the top when it opens.

### 4.2 Form screen

1. **FormHeader** – title depends on create / edit (and on the record type in the number form).
2. **Blocks** separated by section dividers. The last block is always **"סיבות ואישורים"** (§4.3).
3. **StickyActionBar** with the submit button.

Rules shared by all forms:

- The screen scrolls to the top when it opens.
- **Validation runs on submit** and shows all errors at once. Exception: the phone "add" and "search" actions check the number immediately.
- **Each error disappears** as soon as the user changes a field it relates to (listed per form).
- **On success:** save, then go one step back to the history list (like closing, §3.1), with the saved record open. The form URL stays as a "forward" entry: going forward opens an empty create form, or redirects an edit URL of the replaced record to the list.
- **Save confirmation** (decided 2026-10-20): a short success toast – `"ההגבלה נשמרה"` / `"ההגבלות נשמרו"` / `"ההיתר נשמר"` / `"ההודעה נשמרה"` / `"ההודעות נשמרו"` **(proposed)** (plural when one save created a record per number). It also confirms a save whose card an active search hides. The toasts are at the bottom, near where the user tapped (like a snackbar); on mobile they sit above the bottom action bar (§3.26), not over it.
- **Close / cancel** goes back to the list without saving and without confirmation ([OQ-16](../pending-decisions.md#oq-16)).
- **New record defaults:** start date = today, end date = tomorrow, both shown **muted** until changed. They are real values and are saved as is.
- **Edit:** all fields load from the record; dates are not muted; accordions that contain values start open.
- **Create based on an ended record** (decided 2026-10-19): the create route with `?basedOn={record}` (e.g. `/trainee/1/trainee-restriction/new?basedOn=12`; in the number form the record key, `permit-12`). The form opens in create mode with: **what** the record does (type, duration, hours, devices, number, scope, repeat), the **reason** (matched by name when the list arrives) and the **details**. The **dates** are the new-record defaults (today–tomorrow, muted); **approver and file are empty** – a new decision needs a new approval. A source that is not found opens a plain create form. Per-form details are in each form spec.

### 4.3 Reasons & decision block

Block title `"סיבות ואישורים"` (Reasons and approvals, decided 2026-10-21). Identical in every form, except for the reason list:

| Order | Field | Component (`ui-library` / External) | Placeholder | Required |
|---|---|---|---|---|
| 1 | `"סיבה"` (Reason) | `IpsSelectMobile` (NativeSelect behavior) | `"בחירת סיבה"` (prototype: `"הכל"`) | **Yes** in every form (decided 2026-10-19) – error `"יש לבחור סיבה"` **(proposed)** |
| 2 | `"פירוט"` (Details) | `IpsTextAreaMobile` (DetailsTextArea behavior) | `"הוספת פירוט"` | **Yes** in every form (decided 2026-10-18) – error `"יש להזין פירוט"` **(proposed)**. Only spaces count as empty |
| 3 | `"גורם מאשר"` (Approver) | **External 3rd-party Approver MFE** – see below | – | **Yes** – error `"יש לבחור גורם מאשר"` **(proposed)** |
| 4 | `"צירוף קובץ"` (File) | `IpsFileUpload` → **Direct upload to SharePoint** – see below | – | **Yes** – error `"יש לצרף קובץ"` (A file must be attached) |

Fields 1–3 are stacked 8px apart; the file field is 16px below them. See [OQ-15](../pending-decisions.md#oq-15).

- **Approver (ApproverField):** the MFE is a full-width search box with its own open results list, and reports the chosen approver through `onSelect`. Once chosen, the field shows the approver's name and role with a `"החלפה"` (Change) button, which shows the MFE again; `"ביטול"` (Cancel), under the MFE at the end (left) – the side of `"החלפה"`, as in the permit's restriction picker (decided 2026-10-21) – returns to the chosen approver. Until the MFE is integrated, a stand-in with the same contract is used (`src/integrations/approver-mfe`).
- **File (ApprovalFileField):** without a file, the layout's upload control (from `useFormControls()`), one file, camera allowed:
  - **Mobile** (decided 2026-10-20): `IpsFileUploadMobile` – a field (`"בחירת קובץ"`) and a camera button (`"מצלמה"`) **(proposed)**. Choosing a file uploads it at once; while it uploads the field shows its name and `"מעלה…"` **(proposed)**. It keeps `IpsFileUpload`'s mechanics as they are (the same hidden file input, camera dialog and upload hook), because the upload is sensitive across iOS and Android in the organization's environment.
  - **Desktop:** a hint `"יש לבחור קובץ וללחוץ על ״שמור קבצים״ כדי לצרף אותו"` (decided 2026-10-21: impersonal, with Hebrew quotation marks) and `IpsFileUpload`, laid out at the usage (decided 2026-10-21): `"או"` between the drop text and the drop zone's buttons; each pair of buttons equal in width (by the longer one); the pair under the drop zone aligned to the end (left), like every action pair in a form, with `"נקה הכל"` (secondary) on the right and `"שמור קבצים"` (primary) on the left – in the DOM order too, so also for the keyboard; and the buttons at weight 400, like every other button. The emoji, the drop text and the error message are the control's own and stay.

  After the upload the file is registered in the service (to get its `approvedFileId`), and the field shows a file row (icon, name, X `"הסרת הקובץ"`) instead of `IpsFileUpload`. Saving waits while a file uploads. Upload or registration failure: `"העלאת הקובץ נכשלה. ניתן לנסות שוב"` (decided 2026-10-21).

### 4.4 Desktop: history and form in the trainee drawer

Decided for desktop phase 2 (2026-10-19). On desktop the history and form screens of 03–05 open inside the trainee drawer ([02 §8](02_child_actions.md)), below its fixed trainee header. The data, cards, search, sort, states, form blocks, validation and texts are the ones of §4.1–§4.3 and of each feature spec; only the layout and the controls differ.

**History screen.** Top to bottom; the top row and the toolbar stay in place, and only the cards scroll. The texts follow the drawer's hierarchy ([design.md](../design.md) › Side drawer): the trainee (20), then the screen (18, the action selector), then the section (16, regular).

1. **Top row – navigation only** (decided 2026-10-19, so the row stays quiet):
   - At the start, a back arrow `"חזרה לפעולות"` **(proposed)** to the actions screen.
   - Next to it, the current action as a context selector – text and chevron with no border, like the institute selector ([design.md](../design.md) › Desktop layout), 18px, weight 500. Its options are only the permitted actions, and its accessible name is `"החלפת פעולה"` **(proposed)**. With only one permitted action it is a plain title.
2. **Toolbar:**
   - The section title (16px, regular) at the start of its row, and at the end of the same row the primary create button (text + plus icon, the regular button size). It takes the place of the mobile StickyActionBar (§3.26).
   - Below them, in one row: the search field, always visible and taking the remaining width (clear button `"ניקוי חיפוש"`), and the sort select.
   - Below that row, the results count (§3.23 row 3), in a row of its own – at the drawer's width there is no room for it next to the search (decided 2026-10-21).
   - The sort select's closed value is only a sort icon and `"מיון"`, like the mobile sort button. At the drawer's width there is no room for "מיון לפי …" next to the search (decided 2026-10-19). Its list has one row per field + direction (§3.25), and its accessible name includes the current row: `"מיון לפי {row}"` (decided 2026-10-21, like the trainees list's closed sort value; it was `"מיון: {row}"`).
   - Both are disabled until the records have loaded.
   - No line under the toolbar (design.md › the lines rule). The section title is `h4`, under the trainee (`h2`) and the action (`h3`).
3. **Cards:** ExpandableRecordCard (§3.22) on the drawer's white surface. Each card, and each skeleton card, gets a 1px `divider` frame on its wrapper; a card's frame turns `border-strong` on hover, like the trainee cards and the action rows (decided 2026-10-21), and a skeleton's does not. The cards render incrementally inside the drawer's scroll area, which shows the app's focus ring when it has keyboard focus.
4. **States:** as on mobile. Before the permissions load: skeleton cards. Without permission: the blocked message ([02 §7](02_child_actions.md)). The top row is available in every state.

**Form.**

- **Presentation:** a layer over the history inside the drawer, below the trainee header – the desktop counterpart of the mobile form sheet. It enters and leaves like a drawer screen, and the history moves with it (§2.4). The history stays mounted and inert under it, so its search, sort, open card and scroll position are kept.
- **Layer layout:**
  - At the top: a back arrow `"חזרה ללא שמירה"` **(proposed)** at the start, and the form title next to it (create / edit, as in each form spec; 18px, weight 500, `h3`). An arrow and not an X: the drawer's X is the only X, and every inner screen goes back with an arrow (decided 2026-10-19). No line under this row (decided 2026-10-21; with the trainee header's line it framed a single row with two lines).
  - The blocks scroll in the middle. Their titles are `h4` (and the field-group titles `h5`), under the form title – the same look as on mobile.
  - At the bottom, a fixed footer with a line above it: `"ביטול"` on the right and `"שמירה"` on the left, two equal columns in the regular button size.
  - The general save error is shown above the buttons.
- **Focus:** moves into the layer when it opens. The back arrow and `"ביטול"` go back to the history without confirmation ([OQ-16](../pending-decisions.md#oq-16)), and focus returns to the button that opened the form as soon as the layer starts to leave.
- **Controls:** the desktop controls of the library (MUI): dates (`IpsDatePicker` in Hebrew, `DD/MM/YY`, empty sections shown as `--`), times (`IpsTimePicker`, 24h, clear button), selects, text fields, text area and radio groups. Labels are above the fields.
  - The grid is the mobile one: dates, times and the duration take half a row; reason, details, approver, file, and phone with its button take a full row. There are no desktop-only widths (decided 2026-10-19).
  - A date or time that is only partly typed counts as empty, so validation reports it.
  - Decided 2026-10-21:
    - **Details** (the text area): its text starts at the same inner padding as the other fields (the theme's field padding is not added to the text area's own), and it is a fixed 3 rows tall – longer text scrolls inside it.
    - **An empty select** shows its text in gray – `"בחירת סיבה"`, and in the devices field `"כל המכשירים"` / `"לא הוגדרו"` – as on mobile (§3.11), so it does not read as a chosen value. The filters' `"הכל"` keeps the value color.
    - **The phone row:** `"הוספה"` / `"חיפוש"` take the field's height (on desktop the field is 39px and a regular button 44px). Mobile is unchanged.
    - **Required fields** are announced as required (`aria-required`); a select's error or load-failure text is linked to it, so it is read with the field.
    - **The date and time pickers** use MUI's Hebrew texts (`heIL`), so their buttons and calendar are read in Hebrew.
- **After save:**
  - The layer closes.
  - The history refreshes silently (no skeleton, decided 2026-10-20), then shows the saved record open and focused (§4.1).
  - The trainees list behind the drawer refreshes silently ([01 §8.2](01_children_list.md)).
- **Unavailable record:** an edit of a record that is no longer available (replaced or ended) closes the layer. This replaces the mobile redirect to the history URL.
- **Closing the whole drawer** while a form has changes asks first ([02 §8.6](02_child_actions.md)).

## 5. Formats

| Item | Display | Notes |
|---|---|---|
| Date | `DD/MM/YY` | e.g. `16/04/23` |
| Date range | `DD/MM/YY-DD/MM/YY` | Rendered LTR, so the start date is on the left |
| Time | `HH:mm` (24h) | |
| Time range | `HH:mm-HH:mm` | LTR |
| Duration | `"עד X דק׳"` (up to X min, with the Hebrew geresh) | Inside type labels the spaces are non-breaking so the value never wraps |
| Devices summary | 1 device → its name; more → `"{n} מכשירים"` | Used in accordion summaries and permit summaries |
| Phone | As entered, after normalization | Normalization: remove spaces, parentheses and hyphens. Valid: `^0\d{8,9}$` (landline 9 digits, mobile 10). See [OQ-20](../pending-decisions.md#oq-20) |

---

## 6. Lookup lists & External Sources

In production each lookup item is typed as `LookupItem<number> { id: number; name: string }` (`common.schema.ts`):

- **Institutes, Wings & Wing Locations (`organization.schema.ts`):** Fetched via existing endpoints by `clientIds: number[]`, `instituteIds: number[]`, and `wingIds: number[]`.
- **Devices (`organization.schema.ts`):** Fetched per boarding school (`instituteIds: number[]`) **in the background immediately after the trainees list loads**, and cached in the client. **Every device belongs to a wing** (`wingId`); devices of the whole institute come in a virtual wing named `"מיקומים שונים"`. Prototype demo labels: `"טלפון ציבורי – אגף א"`, `"טלפון ציבורי – אגף ב"`, `"טלפון ציבורי – אגף ג"`, `"טלפון משרד הפנימייה"`.
- **Reasons:**
  - **Trainee restriction:** `"הפרת משמעת"`, `"שימוש לא תקין בטלפון"`, `"בקשת גורם טיפולי"`, `"בקשת הורים"`, `"אחר"`.
  - **Number restriction / permit:** `"מורשה לזמן מוגבל"`, `"קשר עם בן משפחה"`, `"קשר עם גורם טיפולי"`, `"בקשת הורים"`, `"אחר"`.
  - **Voice message to the recipient:** `"זיהוי מקור השיחה"`, `"בקשת הורים"`, `"בקשת גורם טיפולי"`, `"הנחיית הנהלה"`, `"אחר"`.

---

## 7. API & Schema conventions

Full TypeScript contracts live in `common.schema.ts`, `organization.schema.ts`, `trainees.schema.ts`, `trainee-restrictions.schema.ts`, `phone-exceptions.schema.ts`, and `voice-messages.schema.ts` (the last one approximate, drafted in the client – see pending-decisions):

- **Style:** JSON over HTTP to Aviv_Service in `Controller/Action` form (e.g. `Institutions/GetInstitutionsAndWings`), through the internal HTTP client. Queries may use `POST` when they send arrays of IDs. The feature specs (03–05) list placeholder `Controller/Action` names until those endpoints are defined ([pending-decisions](../pending-decisions.md)).
- **IDs:** `number`.
- **Scalability with Arrays:** `GET`, `Lookup`, and `POST` (create) endpoints accept arrays (`clientIds: number[]`, `instituteIds: number[]`, `traineeIds: number[]`, `phoneNumbers: PhoneString[]`, `deviceIds: number[]`) where cost is low. `PUT` (update) targets a single record ID (`previousId: number`).
- **Immutable Updates:** Updating an existing record (`PUT`) sets `LOGI_ACTIVE = 0` on the previous DB record and inserts a new active record (`LOGI_ACTIVE = 1`), returning the new ID(s) in `MutationResultDto`.
- **Dates & Times:** Dates `YYYY-MM-DD` (`ISODateString`), Times `HH:mm` (`TimeString`).
- **Errors:** one shape for every failure.

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Human-readable summary",
  "fieldErrors": { "endDate": "תאריך הסיום לא יכול להיות לפני תאריך ההתחלה" }
}
```

| HTTP | `code` | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Field rules failed. `fieldErrors` keys are request field names; each form spec maps them to its error slots |
| 403 | `FORBIDDEN` | The user may not perform the action |
| 404 | `NOT_FOUND` | Unknown child or record |
| 409 | `CONFLICT` | State changed since the screen loaded (e.g. the restriction a permit relies on is no longer active) |
| 5xx | `SERVER_ERROR` | Anything else |

The server repeats every client-side validation rule; the Hebrew messages in the form specs are the expected `fieldErrors` texts.
