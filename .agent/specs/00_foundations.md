# 00 – Foundations

Everything shared by all screens. Screen files reference the components and patterns here by name.

---

## 1. Platform

- **Mobile web**, Hebrew, right-to-left: every screen root has `dir="rtl"` and `lang="he"`.
- **Content width:** max 375px, centered. The app background (`#f6f8fe`) fills the viewport.
- **Font:** Rubik, weights 400 / 500 / 600 (700 only for the voice message scope titles). Load once globally.
- **Top spacing:** 50px above the header on every screen (status-bar area).
- **Mixed direction:** dates, times, ranges, phone numbers and "+N" counters are wrapped in `dir="ltr"` spans so they read left to right inside RTL text.

---

## 2. Design tokens

### 2.1 Colors

| Proposed token | Value | Usage |
|---|---|---|
| `text-primary` | `#00033d` | Main text, icons, titles; filled navy buttons and active chips on the children list |
| `action` | `#006aff` | Primary buttons, outline buttons, links, radio, switch (on), focus border, selected option check |
| `bg-app` | `#f6f8fe` | Page background, sticky footer background, search input inside sheets |
| `text-secondary` | `#8e929f` | Secondary text, field labels, placeholders, input borders, disabled button background |
| `divider` | `#c5cbdd` | Header bottom line, section dividers, card outline (0.5px), switch (off), "ended" badge text |
| `error` | `#a72223` | Error text, invalid field border, required asterisk |
| `chip` | `#e0ebff` | Phone chips, type tag, selected multi-select options, action-row icon circle, voice record icon circle |
| `danger-soft` / `danger-icon` | `#fef2f2` / `#fb444c` | Record icon circle on the trainee and number history lists |
| `success-soft` / `success` | `#e7ffef` / `#069940` | "Active" badge on history lists |
| `muted-soft` | `#f6f9fc` | "Ended" badge background |
| `warning` | `#bd4d00` | Data-gap warning on the children list |
| `border-light` | `#ededed` | Children card border, sheet row separators, actions-screen dividers |
| `border-row` | `#e6e9f0` | Action row border on the actions screen |
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
| Field label, FieldIntro, accordion row, toolbar label, detail label | 14 / 18 | 400 | `text-secondary` (labels) / `text-primary` (titles) |
| Hint text, error text, compact FieldIntro description | 12 / 15 | 400 | `text-secondary` / `error` |
| Badge, type tag | 10 / 12 | 400 | per badge |

### 2.3 Shape and spacing

| Element | Spec |
|---|---|
| Page side padding | 16px (20px on the children list) |
| Header | 41px tall, 0.5px bottom line `divider` |
| Section divider | 0.5px `divider`, 24px above, 23.5px below |
| Field | 42px tall, radius 8, 1px border `text-secondary`, 16px side padding; focus border `action`; invalid border `error` |
| Button | 48px tall, radius 8. Primary: `action` background, white text. Outline: white background, 1px `action` border, `action` text |
| History card | White, radius 8, padding 16, 0.5px inset outline `divider` |
| Children card | White, radius 19, padding 16, 0.5px border `border-light` |
| Bottom sheet | Top radius 24, side padding 20, bottom padding 32, grab handle 40×4 |
| Badge / tag | 20px tall, pill, 8px side padding |
| Sticky footer | Fixed to the bottom, max 375px, `bg-app`, 12px top padding, bottom padding `max(24px, safe-area-inset-bottom)`. Page content has 108px bottom padding so the last field is never hidden |

### 2.4 Motion

| Name | Spec | Used for |
|---|---|---|
| `fadeIn` | Opacity 0→1, 200ms ease-out | Sheet backdrop, expanded card content, accordion content, fields and blocks that appear conditionally |
| `sheetUp` | translateY(100%)→0, 300ms ease-out | Bottom sheets |
| `searchOpen` | clip-path expanding from the search icon, 200ms ease-out | Toolbar search field. Runs only with `prefers-reduced-motion: no-preference` |
| Chevron rotate | 180°, 200ms | Accordions, expandable cards, "אפשרויות נוספות" |

Production: respect `prefers-reduced-motion` for all animations (the prototype only gates `searchOpen`).

### 2.5 Icons

24×24 outline icons, stroke 1.5 (1.6 on the children list and actions screen), round caps and joins, no fill, always `aria-hidden`. Used: back arrow, close X, chevron down, chevron left (action rows, links), search, sort, filter, check, calendar, clock, timer, phone, plus, file upload, edit, location pin, warning circle, person, open lock (number records), circle with slash (trainee restrictions), microphone with plus (voice messages).

---

## 3. Shared components

Each entry: **structure**, **states**, **used in**.
**Architectural rule (`ui-library`):** `Aviv_Client` does **not** manage primitive controls itself; all form controls are consumed from `ui-library`. On Mobile, `ui-library` prioritizes native HTML/OS controls first wrapped as `Ips*Mobile` (e.g., `IpsDatePickerMobile`, `IpsTimePickerMobile`, `IpsSelectMobile`, `IpsMultiSelectMobile`, `IpsSliderMobile`), falling back to MUI-based `Ips*` controls only when no suitable native mobile option exists. The behavioral specifications below define the required UX for these controls.

### 3.1 Headers

- **HistoryHeader** – back arrow link (aria-label `"חזרה"`) to the actions screen, then the page title. Used in all history screens.
- **FormHeader** – page title, and on the opposite side a close X link (aria-label `"סגירה ללא שמירה"`, closes without saving) back to the history list. Navigation **replaces** the current history entry. Used in all forms.

### 3.2 Section title and divider

- `h2`, 16/20, regular weight. Blocks inside a form are separated by the **section divider** (§2.3).

### 3.3 FieldIntro

- **Structure:** title (14/18, `text-primary`) and a one-line description (14/18, or 12/15 in the **compact** variant, `text-secondary`). The description is truncated with an ellipsis; the full text is in a tooltip (`title` attribute).
- **Used in:** date range, limit type, voice message hours and devices.

### 3.4 FieldLabel

- 14/18, `text-secondary`, truncated. Required fields add `"*"` in `error` color right after the text.

### 3.5 ErrorText

- 12/15, `error` color, 4px below the field or group, `role="alert"`. Rendered only when there is a message.

### 3.6 PickerInput (date / time)

- **Structure:** optional FieldLabel above; a 42px box with the formatted value (or a placeholder) and a trailing icon (calendar / clock). An invisible native `date`/`time` input covers the whole box, so tapping anywhere opens the native picker.
- **Pairs:** start and end sit side by side in a 2-column grid. Only the first of the pair has a label: `"בחר תאריך"` (Pick a date) or `"בחר שעה"` (Pick a time).
- **Placeholders:** `"--/--/--"` (date), `"--:--"` (time).
- **Clearable (time only):** when a time has a value, the icon is replaced by an X button (aria-label `"ניקוי {field}"`, e.g. `"ניקוי שעת התחלה"`). Dates have no clear button.
- **States:** empty, **muted** (a default date the user has not touched yet is shown in `text-secondary`), filled, focused (`action` border), invalid (`error` border, `aria-invalid`).
- **Limits:** supports `min` / `max` (end date `min` = start date; permit dates bounded by their restriction).

### 3.7 DurationField

- **Structure:** FieldLabel `"משך מרבי לכל שיחה"` + `"*"` (Max duration per call); text input with numeric keyboard; placeholder `"הזן דקות"` (Enter minutes); the unit `"דק'"` (min) appears right after the digits once there is a value; trailing timer icon, or X (aria-label `"ניקוי משך השיחה"`) when filled.
- **Input rules:** non-digits are stripped as you type; max 3 characters.
- **Width:** half of the content width (first column of a 2-column grid).
- **States:** empty, filled, focused, invalid.
- **Used in:** trainee form, number form (inside **LimitTypeSelector**).

### 3.8 RadioGroup / RadioOption

- **Structure:** container with `role="radiogroup"` and an accessible name. Each option: a native radio (visually hidden) + a 20px circle with `action` border (1px unchecked, 2px checked) and a 10px `action` dot when checked; label 16/24. Options sit in one wrapping row (16px horizontal gap, 8px vertical gap). Keyboard focus shows a ring around the circle.
- **ScopeOption variant** (voice message): options stacked vertically (16px gap); each has a bold title and a description line below.

### 3.9 LimitTypeSelector

- **Structure:** FieldIntro (title + a hint that changes with the selection) → RadioGroup with two options → DurationField (only when the duration option is selected) → ErrorText for the duration.
- **Configurations:**

| Context | Title | Option 1 (default) | Hint 1 | Option 2 | Hint 2 |
|---|---|---|---|---|---|
| Restriction | `"סוג ההגבלה"` | `"הגבלה מלאה"` | `"השיחות חסומות, למעט ההיתרים שיוגדרו למטה"` | `"הגבלת משך שיחה"` | `"השיחות מותרות, עד משך מרבי לכל שיחה"` |
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
- **Used in:** `"סיבה/הערה"` (reason).

### 3.12 NativeMultiSelect

- Native `select multiple` shown as an open list box with all options visible (list height = number of options). Selected options get the `chip` background.
- **Desktop:** a plain click toggles one option (no Ctrl/Cmd needed). **Mobile:** the OS multi-select picker.
- FieldLabel `"בחר מכשיר"` (Pick a device).
- **Used in:** permitted devices, voice message devices.

### 3.14 DetailsTextArea

- FieldLabel `"פירוט"`, textarea 96px tall (3 rows), placeholder `"הוסף פירוט"` (Add details), not resizable.

### 3.15 PhoneInputRow, PhoneNumbersField, PhoneSearchField

- **PhoneInputRow:** a field (phone keyboard, placeholder `"הקלד"` (Type), phone icon, aria-label `"מספר טלפון"`, described by the hint above it) + an 88px action button next to it. The button is blue when enabled and gray (`text-secondary`) when disabled. Enter triggers the action when it is enabled.
- **PhoneNumbersField (multiple numbers):** hint line → PhoneInputRow with `"הוסף"` (Add) + plus icon (enabled when the input is not blank) → ErrorText → list of chips (aria-label `"מספרים שנוספו"`). Each chip: 32px pill, `chip` background, LTR number, X button (aria-label `"הסרת המספר {phone}"`).
- **PhoneSearchField (one number):** hint line → PhoneInputRow with `"חיפוש"` (Search) + search icon → ErrorText. No chips.
- **Used in:** number form (both), voice form (PhoneNumbersField).

### 3.16 FileField

- FieldLabel `"צירוף קובץ"` + `"*"`. A 42px box that opens the file picker when tapped (aria-label `"צירוף קובץ (חובה)"`). Shows `"העלאת קובץ"` (Upload file) in gray, or the file name in `text-primary`. Trailing upload icon, or X (aria-label `"הסרת הקובץ"`) once a file is chosen.
- **One file only.** Picking again replaces the file.
- **Used in:** all forms.

### 3.17 Switch

- 48×24 track (`action` when on, `divider` when off), 20px white knob that slides. `role="switch"`, `aria-checked`. Label text next to it; the label is clickable.
- **Used in:** voice form `"חזרה במהלך השיחה"`.

### 3.18 StatusBadge

- History lists: `"פעילה"` (restriction, voice message) or `"פעיל"` (permit) on `success-soft` / `success`; `"הסתיים"` (ended) on `muted-soft` / `divider`.
- The children list has its own badge, see [01](https://www.google.com/search?q=01-children-list.md).

### 3.19 TypeTag

- `"היתר"` (permit) or `"הגבלה"` (restriction), `chip` background, `text-primary`. Number history only.

### 3.20 RecordIcon

- 44px circle. Trainee restriction: circle-with-slash icon. Number record: open-lock icon. Both on `danger-soft` with `danger-icon` stroke. Voice message: microphone icon on `chip` with `action` stroke.
- The number list uses **one icon for every card**, whether permit or restriction.

### 3.21 DetailGrid

- Two-column definition list, 16px row gap. Label 14/18 `text-secondary`; value 16/20 `text-primary`, keeps line breaks, wraps long words. Dates, times and phones are LTR. Some items span both columns (`col-span-2`). The first item of each row is on the right (RTL).

### 3.22 ExpandableRecordCard

- **Closed:** a button (`aria-expanded`) with RecordIcon, a top line (gray value + badges), a second line with the reason (`"ללא סיבה"` (No reason) when empty, truncated), and a chevron (`chevron` color) that rotates when open.
- **Open:** DetailGrid, then a full-width outline button `"עריכה"` (Edit) with an edit icon.
- **Only one card is open at a time**; tapping an open card closes it.

### 3.23 ToolbarSearch

- A search icon button (aria-label `"חיפוש"`). Tapping it expands a pill search field (34px, white, soft shadow) over the title row. The title becomes visually hidden (kept for screen readers), the search button disappears, and the other toolbar buttons show only their icons.
- The field gets focus. Its X button (aria-label `"סגירת חיפוש"`) closes the search and clears the query. Blurring an empty field closes it. Escape closes it and returns focus to the search button.
- Results filter live as you type (trimmed substring match).

### 3.24 BottomSheet

- Backdrop (`overlay`, a button with aria-label `"סגירה"`), and a dialog anchored to the bottom (`role="dialog"`, `aria-modal="true"`, aria-label = title): grab handle, title (18/23, 500), X button (aria-label `"סגירה"`), content. Escape closes. Animations `fadeIn` + `sheetUp`.

### 3.25 SortSheet

- BottomSheet titled `"מיון"` (Sort). One 56px row per sort option, with a check icon on the selected one (`aria-pressed`). A last row `"כיוון מיון"` (Sort direction) shows `"עולה"` (ascending) or `"יורד"` (descending) with an arrow, and toggles on tap.
- Changes apply immediately; the sheet stays open until closed.

### 3.26 StickyActionBar

- Fixed bottom bar (§2.3). Either one full-width primary button, or two equal columns: outline `"ביטול"` (Cancel, link back to the list, replace) + primary `"שמור"` (Save, submit).

### 3.27 EmptyState

- Centered text, 16/20, `text-secondary`, 64px below the list area.

---

## 4. Shared patterns

### 4.1 History screen

1. **HistoryHeader** with the feature title.
2. **Toolbar row** (17px below the header line, 34px tall): section title (e.g. `"הסטוריית הגבלות"`) + ToolbarSearch + sort button (icon + `"מיון"` label).
3. **Cards** (13px below the toolbar, 8px apart): ExpandableRecordCard per record.
4. **EmptyState** when no record matches (or there are none).
5. **StickyActionBar** with one primary "create" link (text + plus icon).

Rules shared by all history screens:

- **Default sort:** start date, descending. Options: `"תאריך התחלה"` (start date), `"תאריך סיום"` (end date), `"סטטוס"` (status: active vs ended, ties broken by start date).
- **Search** matches a text built from the record's visible values (listed per screen). Case-sensitive substring; non-breaking spaces count as spaces.
- **After save:** the list shows the saved record **open**. If several were saved at once, the first one is open.
- **Edit:** the "עריכה" button opens the form in edit mode for that record.
- The screen scrolls to the top when it opens.

### 4.2 Form screen

1. **FormHeader** – title depends on create / edit (and on the record type in the number form).
2. **Blocks** separated by section dividers. The last block is always **"סיבות והחלטה"** (§4.3).
3. **StickyActionBar** with the submit button.

Rules shared by all forms:

- The screen scrolls to the top when it opens.
- **Validation runs on submit** and shows all errors at once. Exception: the phone "add" and "search" actions check the number immediately.
- **Each error disappears** as soon as the user changes a field it relates to (listed per form).
- **On success:** save, then go to the history list (replacing the form in browser history), with the saved record open.
- **Close / cancel** goes back to the list without saving and without confirmation ([OQ-16](https://www.google.com/search?q=README.md%23oq-16)).
- **New record defaults:** start date = today, end date = tomorrow, both shown **muted** until changed. They are real values and are saved as is.
- **Edit:** all fields load from the record; dates are not muted; accordions that contain values start open.

### 4.3 Reasons & decision block

Block title `"סיבות והחלטה"`. Identical in every form, except for the reason list:

| Order | Field | Component (`ui-library` / External) | Placeholder | Required |
|---|---|---|---|---|
| 1 | `"סיבה/הערה"` (Reason/note) | `IpsSelectMobile` (NativeSelect behavior) | `"בחר סיבה"` (prototype: `"הכל"`) | No (Yes in Trainee Restriction `CODE_RESTRICTION`) |
| 2 | `"פירוט"` (Details) | `IpsTextArea` (DetailsTextArea behavior) | `"הוסף פירוט"` | No |
| 3 | `"גורם מאשר"` (Approver) | **External 3rd-party Approver MFE** (prototype: SelectField + OptionsSheet) | `"בחר גורם מאשר"` (prototype: `"הכל"`) | Yes |
| 4 | `"צירוף קובץ"` (File) | `IpsFileUpload` → **Direct upload to SharePoint** (FileField behavior) | `"העלאת קובץ"` | **Yes** – error `"יש לצרף קובץ"` (A file must be attached) |

Fields 1–3 are stacked 8px apart; the file field is 16px below them. See [OQ-15](https://www.google.com/search?q=README.md%23oq-15).

## 5. Formats

| Item | Display | Notes |
|---|---|---|
| Date | `DD/MM/YY` | e.g. `16/04/23` |
| Date range | `DD/MM/YY-DD/MM/YY` | Rendered LTR, so the start date is on the left |
| Time | `HH:mm` (24h) | |
| Time range | `HH:mm-HH:mm` | LTR |
| Duration | `"עד X דק'"` (up to X min) | Inside type labels the spaces are non-breaking so the value never wraps |
| Devices summary | 1 device → its name; more → `"{n} מכשירים"` | Used in accordion summaries and permit summaries |
| Phone | As entered, after normalization | Normalization: remove spaces, parentheses and hyphens. Valid: `^0\d{8,9}$` (landline 9 digits, mobile 10). See [OQ-20](https://www.google.com/search?q=README.md%23oq-20) |

---

## 6. Lookup lists & External Sources

In production each lookup item is typed as `LookupItem<number> { id: number; name: string }` (`common.schema.ts`):

- **Institutes, Wings & Wing Locations (`organization.schema.ts`):** Fetched via existing endpoints by `clientIds: number[]`, `instituteIds: number[]`, and `wingIds: number[]`.
- **Devices (`organization.schema.ts`):** Fetched per boarding school (`instituteIds: number[]`) **in the background immediately after the trainees list loads**, and cached in the client. Prototype demo labels: `"טלפון ציבורי – אגף א"`, `"טלפון ציבורי – אגף ב"`, `"טלפון ציבורי – אגף ג"`, `"טלפון משרד הפנימייה"`.
- **Reasons:**
  - **Trainee restriction:** `"הפרת משמעת"`, `"שימוש לא תקין בטלפון"`, `"בקשת גורם טיפולי"`, `"בקשת הורים"`, `"אחר"`.
  - **Number restriction / permit:** `"מורשה לזמן מוגבל"`, `"קשר עם בן משפחה"`, `"קשר עם גורם טיפולי"`, `"בקשת הורים"`, `"אחר"`.
  - **Voice message:** `"זיהוי מקור השיחה"`, `"בקשת הורים"`, `"בקשת גורם טיפולי"`, `"הנחיית הנהלה"`, `"אחר"`.

---

## 7. API & Schema conventions

Full TypeScript contracts live in `common.schema.ts`, `organization.schema.ts`, `trainees.schema.ts`, `trainee-restrictions.schema.ts`, `phone-exceptions.schema.ts`, and `voice-messages.schema.ts`:

- **Style:** REST + JSON under `/api`.
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
