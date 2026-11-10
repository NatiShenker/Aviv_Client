# 02 – Trainee actions

Prototype source: `client/pages/ChildDetails.tsx`.

---

## 1. Purpose & entry points

- The hub for one trainee: entry to the three management features and to additional information.
- **Entry points:** tapping a card on the children list ([01](01_children_list.md)); the back arrow on any of the three history screens.
- **Navigation:** a regular page – it enters sideways (forward from the left, back from the right), like every page. Forms open as full-screen form sheets that slide up ([00 §2.4](00_foundations.md)).

---

## 2. Route & parameters

- **Route:** `/trainee/:traineeId`
- **`id`:** trainee ID.
- **Unknown ID:** the not-found screen is shown ([OQ-21](../pending-decisions.md#oq-21)).

---

## 3. Layout

### 3.1 Header (side padding 16px)

- **Right:** back arrow, one step back to the children list (aria-label `"חזרה"`, [00 §3.1](00_foundations.md)).
- **Next to it (16px gap):** the trainee's full name as `h1`, 20/24, weight 500, and the personal number in a line under it (14px, `text-secondary`) – the same order as the children card, and the same header shape as the history and form screens (a title and a gray line under it). Decided 2026-10-20; before it the `h1` was `"{name} | {code}"` (decided 2026-10-18), which was cut on narrow screens.
- **Divider:** 17px below, 1px `#ededed`, 16px side margins.

### 3.2 Actions section (side padding 19px)

- **Title** `"פעולות"` (Actions), 16/20, 31px below the divider.
- **Rows** 15px below the title, 4px apart. Each row: at least 60px tall, with 12px vertical padding, so a row with a description grows; a card on the page background – white, card radius, no border ([00 §2.3](00_foundations.md)) – 12px side padding; a 36px `#e0ebff` circle with a navy icon; the label (16/20) and, under it, a description line (12px, `text-secondary`, like the personal number under the name on the children card; decided 2026-10-21); a chevron pointing left at the far side.

| Order | Label | Description (decided 2026-10-21) | Icon | Opens |
|---|---|---|---|---|
| 1 | `"הגבלות לחניך"` (Trainee restrictions; decided 2026-10-21) | `"חסימת השיחות של החניך, מלאה או לפי משך שיחה"` (Blocking the trainee's calls, fully or by call duration) | Circle with a slash | `/trainee/{id}/trainee-restriction` – [03 history](03-trainee-restriction/03_trainee_restriction_history.md) |
| 2 | `"הגבלות והיתרים למספר"` (Number restrictions and permits; decided 2026-10-21) | `"חסימה או פתיחה של מספרי טלפון מסוימים"` (Blocking or opening specific phone numbers) | Open lock | `/trainee/{id}/number-restriction` – [04 history](04-number-restriction/04_number_restriction_history.md) |
| 3 | `"הודעה קולית לנמען"` (Voice message to the recipient – decided 2026-10-18) | `"הודעה שמושמעת לנמען בשיחות של החניך"` (A message played to the recipient in the trainee's calls) | Microphone with plus | `/trainee/{id}/voice-message` – [05 history](05-voice-message/05_voice_message_history.md) |

- **Permissions:** the menu is built from the permission IDs returned by `GetPermissionsForInstitution` for the selected institute, and is the same for every trainee. Each action has its own permission ID; a row is shown only when the user has it. The section (title included) is hidden when no action is permitted.
- **Rows without a screen** are shown disabled.

### 3.3 Additional information section

- **Divider** 24px below the actions (same style as §3.1).
- **Title** `"מידע נוסף"` (Additional information), 16/20, 23px below the divider. Regular weight, like `"פעולות"` – every section title has the same weight, on both layouts (decided 2026-10-19; the sketch had it bold).
- **One row**, 15px below: `"היסטוריית דקות"` (Minutes history; the spelling "היסטוריית" is used on every screen – decided 2026-10-18), clock icon, same row style, with no description line (decided 2026-10-21). It has no destination ([OQ-08](../pending-decisions.md#oq-08)), so it is shown disabled.
- **Permission:** the whole section (divider, title and rows) requires one general permission ID.

---

## 6. Data & API (`trainees.schema.ts`)

- Reads the trainee's `textFullName`, `numbPersonalNumber` (formatted by `formatPersonalNumber`), and `idntInstitution` directly from the cached `TraineeListItemDto` in the client service store (loaded on the home screen via `POST Trainees/GetTrainees` – see [01 §6.2](01_children_list.md)).
- When the trainees store is empty (e.g. it was cleared after saving a restriction), the service layer fetches the institute's trainees list first; if the `traineeId` does not exist, the not-found screen is shown.

---

## 7. Loading & errors (proposed – not in the prototype)

| State | Behavior |
|---|---|
| Trainee loading | Back arrow and the menu are shown; the title is empty until the name arrives |
| Trainee not found (or invalid ID) | Under the header: `"החניך לא נמצא"` **(proposed)** – until the not-found screen is designed ([OQ-21](../pending-decisions.md#oq-21)) |
| Trainee failed | The title stays empty; the menu still works. A retry is not needed on this screen |
| Permissions loading | A skeleton of the actions section: a title bar and three rows shaped like the real ones – icon circle, label and description – at their height, so nothing moves when the menu arrives (decided 2026-10-21). On desktop each skeleton row has the drawer's row frame |
| Permissions failed | `"לא ניתן לטעון את ההרשאות לפנימייה"` + `"טעינה מחדש"` (reloads the permissions; decided 2026-10-21) |
| No permitted item | `"אין לך הרשאה לפעולות על חניכים בפנימייה זו"` **(proposed)** |

- **Direct link to an action screen without its permission:** the screen shows `"אין לך הרשאה לפעולה זו"` **(proposed)** under its header.

---

## 8. Desktop (Aviv's container ≥ 1024px)

Desktop phase 2 (decided 2026-10-19). On desktop the trainee's screens – this actions screen, the histories and the forms of 03–05 – open in a side drawer over the trainees list ([01 §8](01_children_list.md)). They work like the mobile screens; the layout and the controls differ ([design.md](../design.md) › Desktop layout). The desktop sketch (`pages/desktop/ChildDrawer.tsx`) gives the spirit; where it differs, this section wins.

### 8.1 Entry from the list

- The whole trainee card opens the drawer on the actions screen. It is a transparent button over the card, named `"פתיחת הפעולות של {name}, {code}"` **(proposed)**, so the card itself stays as on mobile. The accessible names use a comma, not `"|"`, which a screen reader reads as "vertical bar" (decided 2026-10-21).
- Card states:
  - hover: `border-strong` frame and a pointer cursor;
  - keyboard focus: a ring;
  - the trainee whose drawer is open: `primary` frame and a 1px `primary` ring (decided 2026-10-21).
- **⋮ menu** (built 2026-10-19, as in the sketch): a ⋮ button at the card's top end (after the status badge, when there is one), named `"פעולות עבור {name}, {code}"` **(proposed)**. It sits above the card's transparent button, which comes first in the tab order.
  - The menu lists the permitted actions that have a drawer screen; each one opens the drawer straight on its history. Then a divider and `"כל הפעולות"` **(proposed)**, which opens the drawer on the actions screen.
  - While the permissions load, after a load error, or with no permitted action, the menu has only `"כל הפעולות"`; the actions screen shows the matching state (§7).
  - Arrow keys move between the items; Escape closes the menu and returns focus to ⋮. The drawer opens after the menu has closed, so closing the drawer returns focus to ⋮.
  - Implemented by `IpsMenu` (added to the library on branch `AVIV`). The mobile card has no ⋮.

### 8.2 The drawer

- **Shape:** a modal drawer from the end side of the screen (left, in RTL), a fixed 560px wide with 32px side padding (decided 2026-10-19, [design.md](../design.md) › Side drawer), over a dark overlay. The list behind is inert.
- **State:** in memory only, so the address does not change. The browser's Back leaves Aviv's screen. Crossing below the 1024px breakpoint closes the drawer and drops an open form without asking.
- **Every opening** starts at the actions screen – or, from the card's ⋮ menu, at the chosen action's history (§8.1).

### 8.3 Header (fixed on every screen)

The top level of the drawer's text hierarchy ([design.md](../design.md) › Side drawer); enlarged on 2026-10-19:

- The trainee photo (60px, as on the card).
- Next to it, the trainee's name as the drawer's title (20px, weight 500, truncated with the full name in a tooltip; it also names the drawer), and the personal number under it (14px, `text-secondary`) – the same order as the card. No status badge (decided 2026-10-21; before it the title was `"{name} | {code}"` with the badge below).
- At the end, aligned to the top, an X `"סגירה"` **(proposed)** with a tooltip – the drawer's only X.
- The trainee comes from the trainees list that is already loaded. A trainee who is no longer in the list shows `"החניך לא נמצא"` under the header; the same text names the drawer (a hidden title).

### 8.4 Actions screen

The sections of §3.2–§3.3: `"פעולות"` with the permitted actions, and `"מידע נוסף"` with `"היסטוריית דקות"` disabled ([OQ-08](../pending-decisions.md#oq-08)). The sketch's tabs are not used.

- The rows sit on the drawer's white surface, so they get a 1px `divider` frame (`border-strong` on hover). They show the same description lines as on mobile; the card's ⋮ menu (§8.1) shows the labels only.
- The sections have **no inset** on desktop (decided 2026-10-21): the mobile 4px inset aligns the rows to the back arrow of the page header, and the drawer's actions screen has no back arrow – its photo sits on the content line. The section titles are `h3`, under the trainee's name (`h2`).
- The rows keep the 12px padding of mobile (decided 2026-10-21): relative to their denser text (label 16, description 12) it is the same proportion as the history cards' 16.
- An action opens its history screen in the drawer ([00 §4.4](00_foundations.md)).
- The permission states are those of §7.

### 8.5 Navigation and focus

- The screens change inside the drawer, and each new screen starts at its top.
- **Motion** (decided 2026-10-19, [00 §2.4](00_foundations.md)): both screens move. Forward (an action, or opening a form), the new screen slides in from the left while the old one is pushed out to the right; back (the back arrow, or closing a form), the reverse. Switching the action in the selector replaces the screen without a slide. With "reduce motion" there is no animation.
- After a screen change, focus moves to the new screen, so a screen reader announces it. Going back to the actions screen moves focus to the row of the action the user came from (decided 2026-10-21), so the keyboard continues from there.
- Focus stays inside the drawer.
- **Escape** closes the drawer, except:
  - inside a text field, where it belongs to the field (e.g. to clear the search);
  - inside an open list or calendar, which it closes.
- **Closing** returns focus to the trainee's card. If the card is no longer shown (e.g. it moved in a status sort), focus goes to the cards area.

### 8.6 Closing with unsaved changes

- Clicking the overlay, pressing Escape or the drawer's X while the open form has a changed field opens a dialog first:
  - title `"לצאת ללא שמירה?"`, text `"השינויים בטופס לא יישמרו."`;
  - on the right, `"המשך עריכה"`: outlined, and it gets the initial focus, as the least destructive action;
  - on the left, `"יציאה ללא שמירה"`: contained, in the error color;
  - all texts **(proposed)**; "ללא" rather than "בלי" decided 2026-10-21.
- Escape or the overlay in the dialog keeps editing.
- A form that was opened but not changed closes without asking.
- The form's own close (the X on mobile, the back arrow on desktop) and `"ביטול"` go back to the history without asking ([OQ-16](../pending-decisions.md#oq-16)).
- A form that was closed and is still sliding out no longer counts: the overlay or Escape right after `"שמירה"` / `"ביטול"` closes the drawer without asking.

### 8.7 After a save

The trainees list behind the drawer refreshes silently ([01 §8.2](01_children_list.md)), so its cards' status badges are up to date too. The save toast appears at the bottom left, next to the drawer; the drawer is modal and hides the toast from screen readers, so the same message is also announced inside the drawer (decided 2026-10-21).
