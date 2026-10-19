# 01 – Children list (home)

Prototype source: `client/pages/ChildrenList.tsx`.

---

## 1. Purpose & entry points

- The app's home screen: the list of trainees in the institute, with search, filter and sort. Tapping a trainee opens their actions screen ([02](02_child_actions.md)).
- **Entry points:** app launch; the back arrow on the actions screen.

---

## 2. Route & parameters

- **Route:** `/`
- **Parameters:** none. Search, filter and sort state are not kept in the URL.
- **Returning to the list** from another screen (e.g. back from a trainee) shows it as the user left it, until the page is reloaded:
  - The search, every filter group and the sort.
  - The loaded list itself, with no new load (`"נסה שוב"` always reloads from the server). Exception: a save in an action screen changes the trainee flags, so the list loads again; the search, filters, sort and position are still restored.
  - The number of cards already shown, and the scroll position (mobile only; see §8.2).
- **After a page reload** everything resets, except the persisted selections below.
- **Persisted selections (local storage, 30 days from the last selection):**
  - The selected institute (institute selector, §3.1a).
  - The wing filter (filter sheet, group **a**), stored per institute. It is restored only when the stored institute is the selected one and the wing still exists.
- **Changing the institute** resets the search, the other filters and the sort for the new institute.

---

## 3. Layout

Side padding 20px, 50px top spacing, 40px bottom padding.

### 3.1 Header (two rows)

No row may overflow the screen width (320px and up). The header (both rows) stays in place; only the cards scroll under it.

**Row 1:**

| Position (RTL) | Element | Details |
|---|---|---|
| Right | Title `"רשימת חניכים"` (Trainees list) | 18px, weight 500 |
| Left | Institute selector (§3.1a) | Clean "super control": the institute name and a chevron, no border or background. A long name is truncated |

**Row 2:**

| Position (RTL) | Element | Details |
|---|---|---|
| Right, takes the remaining width | Search field | Always visible (`IpsSearchFieldMobile`: a white field outlined like the form fields, with a search icon and a clear button `"ניקוי חיפוש"`). aria-label `"חיפוש חניכים"`, placeholder `"חיפוש לפי שם או מספר"`. Filters live as you type |
| Left | Filter button | Filter icon only. When any filter group is not `"הכל"`, a small dot in the primary color shows on the icon, and the accessible name becomes `"סינון, יש סינון פעיל"` |
| Left | Sort button | Sort icon only, aria-label `"מיון"` |

- The row is uniform: the search field and both buttons are 44px tall, white, and outlined like the form fields ([00 §2.3](00_foundations.md)). The buttons are squares with the button radius (`IpsIconButton variant="surface"`).
- The search field and both buttons are disabled until the list has loaded.

### 3.1a Institute selector

- `IpsSelectMobile variant="plain"`: the visible text and chevron, with a transparent native select over them, so a tap opens the OS picker. aria-label `"פנימייה"`, placeholder `"בחר פנימייה"` (Pick an institute).
- Options: the institutes returned by `GetInstitutionsAndWings` (already filtered by the user's permissions on the server).
- **Initial value:** the stored selection if it is still in the list. Otherwise, when the user has exactly one institute, it is selected automatically (and not stored). Otherwise, nothing is selected.
- While no institute is selected, the list area shows `"יש לבחור פנימייה כדי להציג את רשימת החניכים"` and the search, filter and sort buttons are disabled.
- Changing the institute resets the search and the filters and restores that institute's stored wing filter.

### 3.2 Cards list

12px below the header, 12px between cards. Each card is a link to `/trainee/{id}`.

- **Incremental rendering:** the first 30 cards are rendered. When the user scrolls near the end, the next 30 are added. Any change to the search, filters, sort or institute starts again from the first 30.

**Child card** (white, no border, padding 16; radius from the library token):

1. **Top row**
   - **Right:** photo 60×60 (radius 6, cover), loaded from the trainee photo call (§6.2) only for rendered cards. When it fails to load (no photo): gradient placeholder with a white person icon.
   - **Next to the photo:** name (14/17, weight 500, one line), e.g. `"יוסי כהן | 012453"` (name | personal number). No date (removed 2026-10-18).
   - **Left:** status badge (pill, 12/14, 6px dot):
     - Active: `"פעיל"` – bg `#e7ffef`, text `#15833a`, dot `#22c55e`.
     - Restricted: `"מוגבל עד {DD/MM}"` (Restricted until) – bg `#ffe8e8`, text `#d4262b`, dot `#ff3b3b`.
2. **Divider:** 16px below, 0.6px `#ebebf0`.
3. **Bottom rows** (8px below, 12/15, gray). One fixed structure at every card width (decided 2026-10-19), so the minutes are in the same place on every card:
   - **First row, right:** location pin + `"אגף {wing.name}"` (and wing location `location.name` when present), truncated when long.
   - **First row, left:** timer + `"{remainingMinutes} דקות"` (fetched by the backend from the 3rd-party Cellcom service).
   - **Second row (conditional), right:** warning icon + `"קיים פער בנתונים בסלקום"` (Data gap in Cellcom), color `#bd4d00` – **rendered only when `flags.hasCellcomDiscrepancy === true`** (from the 3rd-party Cellcom service).
   - The loading skeleton follows the same structure (photo, name and badge; then location and minutes).

### 3.3 Empty state

`"לא נמצאו חניכים"` (No trainees found) – EmptyState.

### 3.4 Filter sheet (6 business filter categories: 1a–1f)

BottomSheet titled `"סינון"`, filtering trainees via `matchesTraineeFilters(trainee, filters)` (`trainees.schema.ts`):

| # | Group heading (14, weight 500, gray) | Options | Mapped Schema Field (`trainees.schema.ts`) |
|---|---|---|---|
| **a** | `"אגף"` (Wing) | **Multi-select** (`IpsMultiSelectMobile`): an explicit `"הכל"` option first, then the institute's wings (`InstituteWithWingsDto.wings`) | `trainee.wing.id` |
| **b** | `"מיקום באגף"` (Location in wing) | **Multi-select**: `"הכל"` first, then the locations of the selected wings (of the whole institute when no wing is selected), **grouped by wing** (native `optgroup` / menu subheaders). Disabled with a status text while locations load or after they fail (+ `"נסה שוב"`) | `trainee.location?.id` |
| **c** | `"הגבלה לחניך"` (Trainee restriction) | `"הכל"` (default), `"הגבלה מלאה פעילה"`, `"הגבלת דקות פעילה"`, `"ללא"` | `flags.hasActiveFullRestriction`, `flags.hasActiveMinutesRestriction` |
| **d** | `"הודעה קולית לנמען"` (Voice message to the recipient) | `"הכל"` (default), `"הודעה רגילה פעילה"` (active regular message), `"הודעה חוזרת פעילה"` (active repeating message – "interactive" in the schema, [05 overview §2](05-voice-message/05_voice_message_overview.md)), `"ללא"` | `flags.hasActiveMessage`, `flags.hasActiveInteractiveMessage` |
| **e** | `"הגבלה/היתר למספר"` (Phone exception) | `"הכל"` (default), `"הגבלה למספר פעילה"`, `"היתר למספר פעיל"`, `"ללא"` | `flags.hasActivePhoneRestriction`, `flags.hasActivePhonePermit` |
| **f** | `"יתרה"` (Balance) | `"הכל"` (default), `"קיימת יתרה"`, `"ללא יתרה"` | `flags.hasBalance` |

- **Multi-select text:** `"הכל"` when nothing is selected; one selected → its name; more → `"{n} נבחרו"`.
- **`"הכל"` and specific options exclude each other:** choosing `"הכל"` clears the selected options, and choosing an option while `"הכל"` is selected keeps only that option.
- **Groups c–f:** `IpsPillSelect` with a group label; tapping the selected chip again keeps it (`allowDeselect={false}`).
- **Wing → location dependency:** changing the wings removes selected locations that no longer belong to the selected wings. Changing the institute reloads both.
- **Button:** `"הצג תוצאות ({count})"` (Show results), full width. Closes the sheet.

### 3.5 Sort sheet

SortSheet titled `"מיון"`: one row per field **and** direction (`IpsRadioListMobile`), no separate direction row. The selected row is bold, in the primary color, with a check icon. Rows:

`"שם – א׳ עד ת׳"` (default), `"שם – ת׳ עד א׳"`, `"סטטוס – עם הגבלה לחניך קודם"`, `"סטטוס – פעילים קודם"` **(proposed labels)**, `"יתרת דקות – מהגבוהה לנמוכה"`, `"יתרת דקות – מהנמוכה לגבוהה"`, `"אגף – א׳ עד ת׳"`, `"אגף – ת׳ עד א׳"`, `"מיקום באגף – א׳ עד ת׳"`, `"מיקום באגף – ת׳ עד א׳"`.

---

## 4. Behavior & states

### 4.1 Defaults

- Search empty; every filter group `"הכל"` (except the wing, which is restored from storage when available, §2); sort `"שם – א׳ עד ת׳"`.

### 4.2 Search

- Matches trainees whose **name or trainee code contains the trimmed query** (two separate fields, [OQ-06](../pending-decisions.md#oq-06), closed). The card shows them as `"{name} | {code}"`.

### 4.3 Filter

- Every selection applies the filter **immediately**. The list behind the sheet and the count in `"הצג תוצאות ({count})"` update live.
- All groups combine with **AND**, and also combine with the search query. Inside a multi-select group, the selected values combine with **OR**.
- The filter button shows the active-filter dot when any group is not `"הכל"`.

### 4.4 Sort

| Option | Compares |
|---|---|
| `"שם"` | Display name, Hebrew locale order |
| `"סטטוס"` | Whether the trainee has an active **trainee restriction** (the `"מוגבל עד"` badge, `restrictedUntilDate`) – not a number restriction |
| `"יתרת דקות"` | The minutes value ([OQ-07](../pending-decisions.md#oq-07)) |

- Ties in any sort are broken by name, always `א׳ עד ת׳`.

---

## 6. Data & API

### 6.2 Calls

All calls go to Aviv_Service. `clientIds` is always `[AVIV_CLIENT_ID]` (55).

| When | Call | Schema (`trainees.schema.ts` / `organization.schema.ts`) |
|---|---|---|
| App start, before the screen can show the list | `POST Institutions/GetInstitutionsAndWings` | `GetInstitutesAndWingsRequest` (`clientIds`) → `GetInstitutesAndWingsResponse`. The server checks permissions and returns only the permitted institutes, each with its wings (`isVirtualContainer` per wing) |
| An institute is selected (in background, parallel) | `GET Institutions/GetPermissionsForInstitution` | `GetPermissionsForInstituteRequest` (`instituteId`, `clientIds`) → `number[]` (the user's permission IDs for that institute). A failure shows a toast; the screen keeps working |
| An institute is selected (parallel) | `POST Trainees/GetTrainees` *(approximate – not in the service yet)* | `GetTraineesRequest` (`instituteIds`, optional `wingIds`) → `GetTraineesResponse`. *(Server merges SQL SP results with the 3rd-party Cellcom service for `remainingMinutes`, `hasBalance`, and `hasCellcomDiscrepancy`).* |
| An institute is selected (in background, parallel) | `POST Locations/GetLocationsAndVirtualLocations` | `GetLocationsAndVirtualLocationsRequest` (`clientIds`, `instituteIds`, `wingIds` = all the institute's wings) → `GetLocationsAndVirtualLocationsResponse` (`isVirtual`, `hasDevice` per location). Feeds filter group **b** |
| An institute is selected | *One more call – not defined yet* | See `.agent/pending-decisions.md` |
| A card is rendered | `GET Trainees/GetTraineePhoto` *(name is a placeholder)* | `GetTraineePhotoRequest` (`traineeId`). Returns the image file itself, so the client builds the URL (`serviceClient.buildServiceUrl`) and puts it in the `img` `src`; the browser loads it lazily |

- Search, filter (`matchesTraineeFilters`) and sort run **on the client** over the loaded list.

---

## 7. Loading & errors (proposed – not in the prototype)

| State | Behavior |
|---|---|
| Institutes loading | The whole screen shows `"טוען…"` (Loading) |
| Institutes failed | `"לא ניתן לטעון את רשימת הפנימיות"` + `"נסה שוב"` **(proposed)** |
| No permitted institutes | `"אין לך הרשאה לאף פנימייה"` **(proposed)** |
| Trainees loading | Header, toolbar and institute selector are shown. In place of the list: skeleton cards |
| Trainees failed | EmptyState text `"לא ניתן לטעון את הרשימה"` (The list could not be loaded) **(proposed)** + text button `"נסה שוב"` (Try again) **(proposed)**, which repeats the call |
| Locations loading / failed | Shown only inside filter group **b**: `"טוען מיקומים…"` / `"לא ניתן לטעון את המיקומים"` + `"נסה שוב"` **(proposed)** |
| Permissions failed | Toast `"לא ניתן לטעון את ההרשאות לפנימייה"` **(proposed)** |
| Photo failed to load | Show the gradient placeholder |

---

## 8. Desktop (Aviv's container ≥ 1024px)

Desktop phase 1 (decided 2026-10-19). The data, the search, the filter and sort logic, the card, the states and the texts are the mobile ones; only the layout and the controls differ ([design.md](../design.md) › Desktop layout). The desktop sketch (`pages/desktop/DesktopChildrenList.tsx`) gives the spirit; where it differs, this section wins.

### 8.1 Layout

The page fills the viewport. Top to bottom:

1. **Title row:** `"רשימת חניכים"` (start) and the institute selector (end) – text and chevron with no border, in the main text color, as on mobile (§3.1a).
2. **Filters panel** (white): a header row with the title `"מסננים"` **(proposed)** and, at the end, the outlined button `"נקה מסננים ({n})"` **(proposed)**. Below it, the six filter groups (§3.4 a–f) in **one row of equal columns**, each with its label above:
   - **Wing, location:** multi-selects **without an explicit `"הכל"` option** (a desktop deviation from §3.4, see pending-decisions): an empty selection shows `"הכל"`; one selected → its name; more → `"{n} נבחרו"`. The location keeps its loading / error states and `"נסה שוב"`.
   - **Groups c–f:** single selects with the same options as the mobile chips (`"הכל"` is one of them).
3. **Results panel** (white), filling the rest of the height:
   - **Toolbar:** the search field (narrow, at the start, placeholder `"חיפוש לפי שם או מספר"`, clear button `"ניקוי חיפוש"`), right after it the count `"מוצגים {n} חניכים"` / `"מוצג חניך אחד"` **(proposed)**, and at the end the sort. The sort is a select with the rows of §3.5 (no prefix in the menu); its closed value reads `"מיין לפי: {row}"` **(proposed)**. No labels above the toolbar controls.
   - **Cards:** a grid of the §3.2 cards (columns of at least 340px), each card with a 1px `divider` border. **Only this area scrolls.**

### 8.2 Behavior

- **Filter, search and sort** behave as on mobile (§4): every choice applies at once.
- **`"נקה מסננים ({n})"`:** `n` is the number of filter groups that are not `"הכל"`. It resets all six groups – including the stored wing filter – but not the search and not the sort. Disabled (not hidden) when no group is active, and then shown without the count.
- **Tools disabled** (filters, clear, search, sort) until the list has loaded, as on mobile.
- **Cards are not interactive** in phase 1; the actions drawer comes in phase 2.
- **Incremental rendering:** 30 cards, then 30 more when the end of the scroll area is reached.
- **Returning:** the search, filters and sort are kept until a page reload (as on mobile). The scroll position is **not** restored on desktop.
- **Crossing the 1024px breakpoint** shows the other layout with the same search, filters and sort. An inner mobile page (and an open form) closes without saving, and the address becomes the list.

### 8.3 States

As in §7, inside the results panel. Loading shows 12 skeleton cards in the grid.
