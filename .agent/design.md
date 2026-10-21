# Design Sources and Styling

Binding guidance for building or changing any screen, layout or styling in Aviv. Read it together with `ui_library.md`.

## What the design is based on

There is no binding design system yet. The look comes from two sources:

1. **Screen sketches**: `reference/builder-screens/` (read-only). Translated from Figma into code, one self-contained file per screen.
   - They define the **spirit, flow and behavior** of the app. Follow them for structure, hierarchy, interaction and wording.
   - They are **not pixel-exact**. Exact sizes, spacing and shades will change.
   - Mobile sketches are in `pages/`. Desktop sketches are in `pages/desktop/`: a grid of trainee cards, and a side drawer for the actions, histories and forms. They lag the specs (no "create based on", no permissions, an older filter and sort model); where they differ, the specs and the mobile code win.
   - Tablet is not designed yet; do not invent it — ask.
2. **The UI library**: `../ui-library` (see `ui_library.md`). It owns the look and behavior of the controls themselves.

## User Experience (UX) Excellence

Excellent UX across all platforms is a primary goal. When building screens, you must strictly enforce the following:
- **State Clarity:** The user must always know what is happening. Explicitly implement and design Loading, Empty, and Error states for EVERY data-fetching or mutation interaction. Match the loading feedback to what is coming: a `"טוען…"` text while app context loads (e.g. institutes), skeletons of the expected content for lists.
- **Form UX:** Clearly distinguish mandatory fields from optional ones. Dependent fields must be logically grouped and their disabled/enabled states clearly communicated visually.
- **Transitions & Feedback:** Use smooth, standard transitions (e.g., sheets sliding up, skeleton loaders). Use toast notifications (`useToast()`) or inline alerts for success/failure feedback on actions.
- **Icons & Affordance:** Actions must be recognizable. Ensure touch targets are adequately sized for mobile fingers (minimum 44x44px functional area).
  - A small library button (an X in a chip, a small text button) keeps its look and grows only its touch area: `EXPANDED_TOUCH_TARGET_SX` (`shared/components/touchTarget.ts`) – a transparent `::after` layer, so the layout does not move.
  - Surfaces the app builds itself (a card, a row) show keyboard focus with `FOCUS_RING_CLASS` (`shared/components/focusRing.ts`, `focus-visible` only – never on touch), in both layouts. On mobile a row or card that navigates darkens slightly while pressed (`active:` / `group-active:`); a card or accordion that opens in place needs no pressed state – it responds at once.
- **Contrast:** small secondary text must pass WCAG AA (4.5:1). The provisional `text-muted` token is `#667085` for that reason (the sketch shade was 3.1:1).
- **Toasts:** at the bottom, near where the user tapped (like a snackbar). On mobile they sit above the bottom action bar (`STICKY_ACTION_BAR_HEIGHT_PX` + a gap, through `IpsToastProvider bottomOffset`), not over it; on desktop at the bottom left, next to the trainee drawer where the user saves (decided 2026-10-21) (`LayoutToastProvider` in `App.tsx`). The close button is named `"סגירה"` (`closeButtonLabel`).
- **Trainee identity:** where the trainee is the subject (the card, the actions screen header, the desktop drawer header) the name comes first and the personal number in a gray line under it; where the trainee is context (the history and form headers) it is one gray line, `"{name} | {code}"`.
- **Width:** every mobile screen must fit 320px width without horizontal scroll.
- **Filters:** filters with many or dynamic options use a select (multi-select where relevant), not chips.
- **Wording** (decided 2026-10-21, in the copy review after the mobile UI/UX phase):
  - Buttons and empty-field placeholders name the action as a noun: "שמירה", "בחירת סיבה" – not the imperative ("שמור", "בחר").
  - Instructions and messages use the impersonal, formal form: "ניתן ל…", "יש ל…" – not "אפשר", and not the imperative.
  - "ללא", not "בלי" (formal).

## What not to copy from the sketches

The sketches were built to be self-contained, not maintainable. Do not carry over:

- Local data arrays and `sessionStorage` persistence. All data goes through the service layer (see `CLAUDE.md`).
- Passing records between screens through `location.state`. Load a record by its ID.
- Hard-coded hex colors and pixel values. Use the tokens.
- Inline `<style>` blocks with font imports and keyframes.
- Helper components duplicated in every file (`Icon`, `Sheet`, `SearchField`, `StatusBadge`, …). Build each once.
- The fixed `max-w-[375px]` frame. Layouts must be responsive.

## Styling rules

- **Tailwind for everything the app owns**: layout, spacing, typography and app-level elements.
- **Tokens only**: colors, radii and the font family come from `src/styles/tokens.css`. Tailwind's default colors and radii are disabled, so only token classes exist (`bg-primary`, `text-text-muted`, `rounded-card`, …). Do not use arbitrary values such as `bg-[#…]` or `rounded-[19px]`.
- **Spacing and font sizes** use Tailwind's default scales (4px spacing unit; `text-xs`…`text-2xl`), which match the library's scale.
- **Token precedence**: when a role exists both in the library and in the sketches, the library value wins. Sketch-only roles are in the provisional block of `tokens.css`; similar sketch shades were merged. A binding tokens file will replace them.
- **Library controls keep their own styling.** MUI's styles are not in a CSS layer, so they win over Tailwind utilities. Do not try to restyle a control with Tailwind classes; use Tailwind only for layout around it.
- **Surfaces and controls** (one rule for every screen): a card on the page background is white with **no border**; a card on a white surface (inside a form sheet) gets a 1px `divider` border; anything the user types into or operates (fields, the search field, toolbar icon buttons) is **outlined**. Radii follow the library tokens by role: cards `rounded-card`, fields `rounded-input`, buttons `rounded-base`.
- **Layout tokens**: a repeated layout value that has no Tailwind default gets a theme key in `tokens.css` instead of an arbitrary value (e.g. `--grid-template-columns-cards` → `grid-cols-cards`).
- **RTL**: the app is Hebrew-only and right-to-left. Prefer logical utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`) over physical ones (`ml-*`, `left-*`, `text-right`). Wrap LTR content such as phone numbers and date ranges in `dir="ltr"`.
- **Font**: Rubik, with Heebo as fallback, loaded by `index.html`, the same as the library.

## Run modes and global CSS

| Format | How the app runs | Global CSS impact |
|---|---|---|
| Mobile | Full iframe inside a host frame (top and bottom bars only) | Isolated by the iframe |
| Tablet | Fully standalone | Isolated |
| Desktop | Now: the same standalone app in a wide browser. Later: micro-frontend inside the host Shell (Module Federation) – an open decision | Standalone: isolated. MFE: **leaks into the Shell page** |

- The layout is not the run mode: it comes from the width of Aviv's container (`usePlatform().layout`, ≥ 1024px = desktop). There is no tablet layout; a narrower tablet gets the mobile layout.

**Open decision**: in desktop MFE mode, global CSS — mainly Tailwind's preflight reset and the base styles, and the `CssBaseline` of `IpsThemeProvider` — would apply to the whole Shell page. Do not add global CSS rules beyond the current setup, and raise the issue when working on desktop hosting (see the desktop readiness backlog in `pending-decisions.md`).

## Desktop layout

Decided for desktop phase 1 (the trainees list) and phase 2 (the trainee drawer). Spec 01 §8 and spec 02 §8 have the screens themselves; spec 00 §4.4 has the history and form pattern inside the drawer.

- **Page:** `DesktopPage` fills the viewport. The header rows and panels stay in place, and **only the list area scrolls**.
- **Panels:** white panels (`rounded-card bg-paper`) on the page background, with no border. A card inside a panel is on a white surface, so it gets the 1px `divider` border – on its wrapper, so the card component stays the same as on mobile.
- **Labels:** above the fields, with `FieldLabelText` linked to the control (`labelId`), not MUI's floating label. This holds in the drawer forms too. Exception: a toolbar row has no labels above its controls, so the row keeps one height (the search has a placeholder; the sort shows its meaning in its value).
- **Context selector** (e.g. the institute in the title row, the action in the drawer): text and chevron with no border **and no background**, the text starting at the content line (no inner indent, so a plain title and the selector line up), in the main text color – the same look as on mobile; a focus ring for the keyboard, since there is no field border to show focus; an empty one shows its placeholder in gray (`CONTEXT_SELECT_SX` / `EMPTY_CONTEXT_SELECT_SX`, applied at the usage; decided 2026-10-21).
- **Page title:** 20/500 – one step above the mobile list title (18), with the selector next to it at 18 (16 on mobile), so the two keep the mobile relation (decided 2026-10-21; it was 24, the only 24 in the app).
- **Sizes:** spacing stays compact (`p-4`, `gap-4`), so the list keeps as much height as possible.
- **Clickable surfaces:** a whole card that opens something (e.g. the trainee card) is a transparent button over the card. The card itself does not change. On hover the frame turns `border-strong` – on every card or row that opens something: trainee cards, action rows, history cards (decided 2026-10-21); an active card has a `primary` frame plus a 1px `primary` ring. Raw buttons need `cursor-pointer` – Tailwind's preflight resets the cursor of buttons, and no global CSS rule is added for it (see Run modes).
- **Lines** (decided 2026-10-21): a line only where the drawer's fixed frame meets a screen – under the trainee header, and above a form's footer. Rows inside a screen (the top row, a toolbar, the form's title row) and the trainees list toolbar have no line under them; the spacing separates them.
- **Empty selects:** the placeholder (`"בחירת סיבה"`, `"כל המכשירים"`) is gray, as on mobile; the filters' `"הכל"` is a value and keeps the value color.

### Side drawer (phase 2)

- **Shape:** a modal drawer from the end side of the screen (left, in RTL), over a dark overlay, at a fixed width of **560px** (`SIDE_DRAWER_WIDTH_PX`), with **32px** side padding.
  - Why 560: common side panels are 400–600px wide (e.g. Ant Design 378, Primer 480, Australian Government Design System 512, Fluent UI 592). The first version (480 with 24px padding) felt cramped. At 560 the content is about 480px wide (496px minus the gutter a classic scrollbar reserves; 496px with overlay scrollbars): the cards and the form's half-row fields get room, and a card line holds about 64 characters, still inside the readable 50–75. On a 1024px container part of the list stays visible behind the overlay.
  - Decided 2026-10-19 (480 on the same day, widened after review).
- **Inside:**
  - The side padding is set by the containers, not by the content components: `DRAWER_ROW_GUTTER_CLASS` for a fixed row (header, top row, toolbar, footer) and `DRAWER_SCROLL_AREA_CLASS` for an area that scrolls (`shells/desktop/drawer/drawerSpacing.ts`).
  - **Scrollbar gutter:** a classic scrollbar (Windows) takes its width only from the area that scrolls, so the controls above a list came out wider than the cards. Every row in the drawer reserves the same gutter (`scrollbar-gutter: stable`, the `scrollbar-gutter-stable` utility), so the header, the toolbar, the cards, the form fields and the footer all end on the same line. With overlay scrollbars (macOS) the gutter is 0.
  - The drawer has a fixed header. Each screen decides what scrolls: a top row and a toolbar stay in place, and only the list or the form body scrolls. A form's footer is fixed at the bottom of the drawer.
- **Text hierarchy** (decided 2026-10-19; before it the trainee, the action and the section title were all 18px bold):
  - Level 1, the trainee (the drawer's header): 20px, weight 500, with a 60px photo and the personal number below the name (14, `text-secondary`); no status badge (decided 2026-10-21).
  - Level 2, the screen (the action selector, the form title): 18px, weight 500.
  - Level 3, sections ("היסטוריית…", "פעולות", "מידע נוסף", the form blocks): 16px, regular, with no exceptions.
  - The heading elements follow the same levels for screen readers: the trainee `h2`, the screen `h3`, the sections `h3`–`h4` (`SectionHeadingLevelProvider` sets the level by frame; on mobile the default stays `h2`). The look comes from the classes, not the level.
- **Navigation inside the drawer:** the drawer's X is its only X and closes the whole drawer. Every inner screen (a history, a form) goes back with a back arrow at the start of its top row. The top row holds navigation only; a screen's primary action sits at the end of its section title row (e.g. the create button of a history).
- **Motion:** screens slide inside the drawer, the outgoing one too ([00 §2.4](specs/00_foundations.md), [02 §8.5](specs/02_child_actions.md)).
- **Forms:**
  - The same two-column grid as on mobile: short fields (dates, times, duration) take half a row; the others take a full row.
  - There are no desktop-only field widths (decided 2026-10-19: fields of varying widths read as disorder, and a full-width short field does not fit either).
- **Buttons:** the library's regular size on desktop; `size="large"` (48px, touch) is for mobile only.
- **Button pairs:** the secondary action is at the start (right) and the primary at the end (left), in every pair: the form footer ("ביטול" | "שמירה"), confirmations ("המשך עריכה" | "יציאה ללא שמירה") and the file upload's actions ("נקה הכל" | "שמור קבצים"). In a confirmation of a destructive action:
  - the least destructive button gets the initial focus (WAI-ARIA APG);
  - the destructive one is contained in the error color.
- **Confirmation dialog** (decided 2026-10-21, at the usage): the pair aligned to the end (left), the dialog convention; 24px from the edges, like the text; both buttons the same height (an outlined button is taller than a contained one by its border, so the row stretches them); the title 18, like the sheet titles.
- **Reduced motion:** with "reduce motion" the drawer and the dialog open and close without a transition, like the screens inside the drawer.
