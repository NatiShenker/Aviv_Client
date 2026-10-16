# 01 – Children list (home)

Prototype source: `client/pages/ChildrenList.tsx`.

---

## 1. Purpose & entry points

- The app's home screen: the list of trainees in the institute, with search, filter and sort. Tapping a trainee opens their actions screen ([02](https://www.google.com/search?q=02-child-actions.md)).
- **Entry points:** app launch; the back arrow on the actions screen.

---

## 2. Route & parameters

- **Route:** `/`
- **Parameters:** none. Search, filter and sort state are not kept in the URL; they reset when the screen is opened again.

---

## 3. Layout

Side padding 20px, 50px top spacing, 40px bottom padding.

### 3.1 Header row (34px)

| Position (RTL) | Element | Details |
|---|---|---|
| Right | Title `"רשימת חניכים"` (Trainees list) | 18/23, weight 500. Visually hidden while search is open (still read by screen readers) |
| Right → left, while searching | ToolbarSearch field | aria-label `"חיפוש חניכים"`, placeholder `"חיפוש לפי שם או מספר"` (Search by name or number). Takes the remaining width |
| Left | Search button | Search icon only, aria-label `"חיפוש"`. Hidden while search is open |
| Left | Filter button | Filter icon + `"סינון"` (Filter), or `"סינון ({n})"` when *n* filters are active. Text and icon turn `action` blue when *n* > 0. While searching: icon only |
| Left | Sort button | Sort icon + `"מיון"` (Sort). While searching: icon only |

### 3.2 Cards list

12px below the header, 12px between cards. Each card is a link to `/child/{id}`.

**Child card** (white, radius 19, 0.5px `#ededed` border, padding 16):

1. **Top row**
   - **Right:** photo 60×60 (radius 6, cover). Without a photo: gradient placeholder (`#d5dce9` → `#9aa5bb`) with a white person icon.
   - **Next to the photo:** name (14/17, weight 500, one line), e.g. `"יוסי כהן | 012453"` (name | personal number); below it the date `DD/MM/YY` (12/14, gray).
   - **Left:** status badge (pill, 12/14, 6px dot):
     - Active: `"פעיל"` – bg `#e7ffef`, text `#15833a`, dot `#22c55e`.
     - Restricted: `"מוגבל עד {DD/MM}"` (Restricted until) – bg `#ffe8e8`, text `#d4262b`, dot `#ff3b3b`.
2. **Divider:** 16px below, 0.6px `#ebebf0`.
3. **Bottom row** (8px below, 12/15, gray):
   - **Right group:** location pin + `"אגף {wing.name}"` (and wing location `location.name` when present); timer + `"{remainingMinutes} דקות"` (fetched by the backend from the 3rd-party Cellcom service).
   - **Left (conditional):** warning icon + `"קיים פער בנתונים בסלקום"` (Data gap in Cellcom), color `#bd4d00` – **rendered only when `flags.hasCellcomDiscrepancy === true`** (from the 3rd-party Cellcom service).

### 3.3 Empty state

`"לא נמצאו חניכים"` (No trainees found) – EmptyState.

### 3.4 Filter sheet (6 business filter categories: 1a–1f)

BottomSheet titled `"סינון"`, filtering trainees via `matchesTraineeFilters(trainee, filters)` (`trainees.schema.ts`):

| # | Group heading (14, weight 500, gray) | Chips | Mapped Schema Field (`trainees.schema.ts`) |
|---|---|---|---|
| **a** | `"אגף"` (Wing) | `"הכל"` (default), plus the institute's wings (`InstituteWithWingsDto.wings`) | `trainee.wing.id` |
| **b** | `"מיקום באגף"` (Location in wing) | `"הכל"` (default), plus locations (`WingLocationDto[]`) | `trainee.location?.id` |
| **c** | `"הגבלה לחניך"` (Trainee restriction) | `"הכל"` (default), `"הגבלה מלאה פעילה"`, `"הגבלת דקות פעילה"`, `"ללא"` | `flags.hasActiveFullRestriction`, `flags.hasActiveMinutesRestriction` |
| **d** | `"הודעה לנמען"` (Recipient message) | `"הכל"` (default), `"הודעה פעילה"`, `"הודעה אינטראקטיבית פעילה"`, `"ללא"` | `flags.hasActiveMessage`, `flags.hasActiveInteractiveMessage` |
| **e** | `"הגבלה/היתר למספר"` (Phone exception) | `"הכל"` (default), `"הגבלה למספר פעילה"`, `"היתר למספר פעיל"`, `"ללא"` | `flags.hasActivePhoneRestriction`, `flags.hasActivePhonePermit` |
| **f** | `"יתרה"` (Balance) | `"הכל"` (default), `"קיימת יתרה"`, `"ללא יתרה"` | `flags.hasBalance` |

- **Chip:** 36px pill, 14px weight 500, `aria-pressed`. Selected: navy fill, white text. Not selected: white, `#ededed` border, navy text.
- **Button:** `"הצג תוצאות ({count})"` (Show results), full width, 48px, radius 30, navy fill, white 16px weight 500, 32px below the chips. Closes the sheet.

### 3.5 Sort sheet

SortSheet titled `"מיון"` with options `"שם"` (Name), `"תאריך אחרון"` (Last date), `"זמן שהייה / יתרת דקות"` (Remaining minutes), `"אגף"` (Wing), `"מיקום באגף"` (Location), then the `"כיוון מיון"` row. *(Note: the unlinked `"+"` circle button from the raw sketch is removed).*

---

## 4. Behavior & states

### 4.1 Defaults

- Search closed and empty; status `"הכל"`; wing `"הכל"`; sort `"תאריך אחרון"`, direction `"יורד"` (newest first).

### 4.2 Search

- Matches trainees whose **display name contains the trimmed query**. The personal number is matched only because it is part of the display name ([OQ-06](https://www.google.com/search?q=README.md%23oq-06)).

### 4.3 Filter

- Selecting a chip applies the filter **immediately**. The list behind the sheet and the count in `"הצג תוצאות ({count})"` update live.
- Status and wing combine with **AND**, and also combine with the search query.
- The filter button shows the number of groups not set to `"הכל"` (0–2).
- Opening the sheet removes focus from the search field. A non-empty search stays open and applied.

### 4.4 Sort

| Option | Compares |
|---|---|
| `"שם"` | Display name, Hebrew locale order |
| `"תאריך אחרון"` | The card date |
| `"זמן שהייה"` | The minutes value ([OQ-07](https://www.google.com/search?q=README.md%23oq-07)) |

---

## 6. Data & API

### 6.2 Calls

| When | Call | Schema (`trainees.schema.ts` / `organization.schema.ts`) |
|---|---|---|
| Screen opens | `GET /api/trainees?instituteIds={instituteId}` | Request: `GetTraineesRequest` (`instituteIds: number[]`)<br>Response: `GetTraineesResponse` (`trainees: TraineeListItemDto[]`).<br>*(Server merges SQL SP results with the 3rd-party Cellcom service for `remainingMinutes`, `hasBalance`, and `hasCellcomDiscrepancy`).* |
| Immediately after trainees load (in background) | 1. `GET /api/wing-locations`<br>2. `GET /api/devices?instituteIds={instituteId}` | `GetWingLocationsResponse`, `GetInstituteDevicesResponse` – cached in client memory so filter sheets and forms open without delay. *(Institutes & wings are loaded on app init via `GetInstitutesAndWingsRequest`).* |

- Search, filter (`matchesTraineeFilters`) and sort run **on the client** over the loaded list.

---

## 7. Loading & errors (proposed – not in the prototype)

| State | Behavior |
|---|---|
| Loading | Header and toolbar are shown. In place of the list: EmptyState text `"טוען…"` (Loading) **(proposed)** |
| Load failed | EmptyState text `"לא ניתן לטעון את הרשימה"` (The list could not be loaded) **(proposed)** + text button `"נסה שוב"` (Try again) **(proposed)**, 14/18 in `action`, which repeats the call |
| Photo failed to load | Show the gradient placeholder |
