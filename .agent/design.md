# Design Sources and Styling

Binding guidance for building or changing any screen, layout or styling in Aviv. Read it together with `ui-library.md`.

## What the design is based on

There is no binding design system yet. The look comes from two sources:

1. **Screen sketches**: `reference/builder-screens/` (read-only). Translated from Figma into code, one self-contained file per screen.
   - They define the **spirit, flow and behavior** of the app. Follow them for structure, hierarchy, interaction and wording.
   - They are **not pixel-exact**. Exact sizes, spacing and shades will change.
   - They cover **mobile only**. Tablet and desktop are not designed yet; do not invent them — ask.
2. **The UI library**: `../ui-library` (see `ui-library.md`). It owns the look and behavior of the controls themselves.

## Screen inventory (from the sketches)

Entry point: `reference/builder-screens/client/App.tsx`.

| Route | Sketch file | Purpose |
|---|---|---|
| `/` | `ChildrenList.tsx` | Trainee list. Search by name or number; filter sheet (status, wing); sort sheet (name, last date, stay time). Card: photo, name and ID, last date, status badge (active / blocked until a date), wing, minutes, data-gap warning. |
| `/child/:id` | `ChildDetails.tsx` | Trainee page. Actions: block, exception, voice message. More info: minutes history. |
| `/child/:id/block` | `BlockList.tsx` | Block history: search, sort sheet, expandable record cards with edit, fixed "new" button. |
| `/child/:id/block/new`, `…/:recordId/edit` | `BlockForm.tsx` | Restrict the trainee's calls by date range, optional hour range and devices. Reason, details, approver, required attachment. |
| `/child/:id/exception` | `ExceptionList.tsx` | Exception history, same list pattern. Card shows the phone number and its type. |
| `/child/:id/exception/new`, `…/:recordId/edit` | `ExceptionForm.tsx` | Per phone number: open a blocked number or block an open one. One or more numbers; same decision details as the block form. |
| `/child/:id/voice-message` | `VoiceMessageList.tsx` | Voice message history, same list pattern. |
| `/child/:id/voice-message/new`, `…/:recordId/edit` | `VoiceMessageForm.tsx` | Message played on the trainee's calls: on all calls or only to selected numbers, optional repeat during the call, plus the same decision details. |
| `*` | `NotFound.tsx` | Not-found page. |

**Naming is under review.** The names and scope of "block" (חסימה) and "exception" (החרגה) are not final: a block may also include opening, and an exception may work in either direction. Describe these features by what they do, and do not rename, merge or split them without explicit instruction.

## Recurring patterns

- Page header: title with a back arrow (list pages) or a close button (forms).
- Toolbar search that expands in place, next to filter and sort actions.
- Bottom sheets for sort, filter and option pickers.
- Expandable record card: summary row (icon, dates or phone, status badge, reason) that opens to a details grid and an edit button.
- Fixed bottom action bar: a single CTA on lists; cancel and save on forms.
- Forms in sections separated by dividers; a collapsible "more options" area (hour range, devices).
- Date range and hour range as two side-by-side pickers.
- Required file attachment.
- Empty result text ("לא נמצאו …").

## Behavior observed in the sketches

These rules appear in the sketches. Treat them as expected behavior, and confirm against the spec when one is provided:

- End date cannot be before start date.
- Hours are either both empty (all day) or both set, with end after start.
- An attachment is required to save.
- Phone numbers: Israeli format, `0` followed by 8–9 digits; duplicates rejected.
- Exception: at least one phone number; saving creates one record per number.
- Voice message: phone numbers are required only when the scope is "selected numbers".
- A record is "active" while its end date has not passed.

## What not to copy from the sketches

The sketches were built to be self-contained, not maintainable. Do not carry over:

- Local data arrays and `sessionStorage` persistence. All data goes through the service layer (see `CLAUDE.md`).
- Passing records between screens through `location.state`. Load a record by its ID.
- Hard-coded hex colors and pixel values. Use the tokens.
- Inline `<style>` blocks with font imports and keyframes.
- Helper components duplicated in every file (`Icon`, `Sheet`, `SearchField`, `StatusBadge`, …). Build each once.
- Native `<select>`, date and time inputs. Use the library controls.
- The fixed `max-w-[375px]` frame. Layouts must be responsive.

## Gaps in the sketches

- No tablet or desktop design.
- No loading or error states; only empty states.
- The "minutes history" screen is linked but not designed.
- The data-gap warning on trainee cards ("קיים פער בנתונים בסלקום") is static; its rule is unknown.
- The sort sheet on the trainee list contains a "+" button with no defined purpose.
- No delete action and no confirmation when leaving a form with unsaved changes.

When a screen needs any of these, ask before deciding.

## Styling rules

- **Tailwind for everything the app owns**: layout, spacing, typography and app-level elements.
- **Tokens only**: colors, radii and the font family come from `src/styles/tokens.css`. Tailwind's default colors and radii are disabled, so only token classes exist (`bg-primary`, `text-text-muted`, `rounded-card`, …). Do not use arbitrary values such as `bg-[#…]` or `rounded-[19px]`.
- **Spacing and font sizes** use Tailwind's default scales (4px spacing unit; `text-xs`…`text-2xl`), which match the library's scale.
- **Token precedence**: when a role exists both in the library and in the sketches, the library value wins. Sketch-only roles are in the provisional block of `tokens.css`; similar sketch shades were merged. A binding tokens file will replace them.
- **Library controls keep their own styling.** MUI's styles are not in a CSS layer, so they win over Tailwind utilities. Do not try to restyle a control with Tailwind classes; use Tailwind only for layout around it.
- **RTL**: the app is Hebrew-only and right-to-left. Prefer logical utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`) over physical ones (`ml-*`, `left-*`, `text-right`). Wrap LTR content such as phone numbers and date ranges in `dir="ltr"`.
- **Font**: Rubik, with Heebo as fallback, loaded by `index.html`, the same as the library.

## Run modes and global CSS

| Format | How the app runs | Global CSS impact |
|---|---|---|
| Mobile | Full iframe inside a host frame (top and bottom bars only) | Isolated by the iframe |
| Tablet | Fully standalone | Isolated |
| Desktop | Micro-frontend inside the host Shell (Module Federation) | **Leaks into the Shell page** |

**Open decision**: in desktop MFE mode, global CSS — mainly Tailwind's preflight reset and the base styles — would apply to the whole Shell page. Do not add global CSS rules beyond the current setup, and raise the issue when working on desktop hosting.
