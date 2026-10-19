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
- **Width:** every screen must fit 320px width without horizontal scroll.
- **Filters:** filters with many or dynamic options use a select (multi-select where relevant), not chips.

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
- **RTL**: the app is Hebrew-only and right-to-left. Prefer logical utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`) over physical ones (`ml-*`, `left-*`, `text-right`). Wrap LTR content such as phone numbers and date ranges in `dir="ltr"`.
- **Font**: Rubik, with Heebo as fallback, loaded by `index.html`, the same as the library.

## Run modes and global CSS

| Format | How the app runs | Global CSS impact |
|---|---|---|
| Mobile | Full iframe inside a host frame (top and bottom bars only) | Isolated by the iframe |
| Tablet | Fully standalone | Isolated |
| Desktop | Micro-frontend inside the host Shell (Module Federation) | **Leaks into the Shell page** |

**Open decision**: in desktop MFE mode, global CSS — mainly Tailwind's preflight reset and the base styles, and the `CssBaseline` of `IpsThemeProvider` — would apply to the whole Shell page. Do not add global CSS rules beyond the current setup, and raise the issue when working on desktop hosting (see the desktop readiness backlog in `pending-decisions.md`).
