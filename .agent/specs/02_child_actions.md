# 02 – Trainee actions

Prototype source: `client/pages/ChildDetails.tsx`.

---

## 1. Purpose & entry points

- The hub for one trainee: entry to the three management features and to additional information.
- **Entry points:** tapping a card on the children list ([01](01-children-list.md)); the back arrow on any of the three history screens.
- **Navigation:** a regular page – it enters sideways (forward from the left, back from the right), like every page. Forms open as full-height bottom sheets ([00 §2.4](00_foundations.md)).

---

## 2. Route & parameters

- **Route:** `/child/:id`
- **`id`:** trainee ID.
- **Unknown ID:** the not-found screen is shown ([OQ-21](README.md#oq-21)).

---

## 3. Layout

### 3.1 Header (side padding 16px)

- **Right:** back arrow link to `/` (aria-label `"חזרה"`).
- **Next to it (16px gap):** the trainee's full name as `h1`, 20/24, weight 500, e.g. `"יוסי כהן"` (name only, no personal number).
- **Divider:** 17px below, 1px `#ededed`, 16px side margins.

### 3.2 Actions section (side padding 19px)

- **Title** `"פעולות"` (Actions), 16/20, 31px below the divider.
- **Rows** 15px below the title, 4px apart. Each row: 60px, white, radius 8, 1px `#e6e9f0` border, 12px side padding; a 36px `#e0ebff` circle with a navy icon; the label (16/20); a chevron pointing left at the far side.

| Order | Label | Icon | Opens |
|---|---|---|---|
| 1 | `"הגבלה/היתר לחניך"` (Trainee restriction/permit) | Circle with a slash | `/child/{id}/block` – [03 history](03-trainee-restriction/history.md) |
| 2 | `"הגבלה/היתר למספר"` (Number restriction/permit) | Open lock | `/child/{id}/exception` – [04 history](04-number-restriction/history.md) |
| 3 | `"הוספת הודעה קולית"` (Add voice message) | Microphone with plus | `/child/{id}/voice-message` – [05 history](05-voice-message/history.md) |

- **Permissions:** the menu is built from the permission IDs returned by `GetPermissionsForInstitution` for the selected institute, and is the same for every trainee. Each action has its own permission ID; a row is shown only when the user has it. The section (title included) is hidden when no action is permitted.
- **Rows without a screen yet** (number restriction, voice message – until screens 04 and 05 are built) are shown disabled.

### 3.3 Additional information section

- **Divider** 24px below the actions (same style as §3.1).
- **Title** `"מידע נוסף"` (Additional information), 16/20, weight 500, 23px below the divider.
- **One row**, 15px below: `"הסטורית דקות"` (Minutes history), clock icon, same row style **without a border**. It has no destination ([OQ-08](README.md#oq-08)), so it is shown disabled.
- **Permission:** the whole section (divider, title and rows) requires one general permission ID.

---

## 6. Data & API (`trainees.schema.ts`)

- Reads the trainee's `fullName`, `traineeCode`, and `instituteId` directly from the cached `TraineeListItemDto` in the client service store (loaded on the home screen via `POST Trainees/GetTrainees` – see [01 §6.2](01_children_list.md)).
- When the trainees store is empty (e.g. it was cleared after saving a restriction), the service layer fetches the institute's trainees list first; if the `traineeId` does not exist, the not-found screen is shown.

---

## 7. Loading & errors (proposed – not in the prototype)

| State | Behavior |
|---|---|
| Trainee loading | Back arrow and the menu are shown; the title is empty until the name arrives |
| Trainee not found (or invalid ID) | Under the header: `"החניך לא נמצא"` **(proposed)** – until the not-found screen is designed ([OQ-21](README.md#oq-21)) |
| Trainee failed | The title stays empty; the menu still works. A retry is not needed on this screen |
| Permissions loading | Skeleton of three rows |
| Permissions failed | `"לא ניתן לטעון את ההרשאות לפנימייה"` + `"נסה שוב"` (reloads the permissions) |
| No permitted item | `"אין לך הרשאה לפעולות על חניכים בפנימייה זו"` **(proposed)** |

- **Direct link to an action screen without its permission:** the screen shows `"אין לך הרשאה לפעולה זו"` **(proposed)** under its header.
