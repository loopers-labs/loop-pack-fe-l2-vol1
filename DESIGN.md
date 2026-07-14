# Commerce Design System

## 1. Atmosphere & Identity

Commerce is a quiet, warm-neutral learning interface: dark ink text sits on cream-toned surfaces, while soft borders and restrained shadows separate working areas without making the page feel heavy. Its signature is practical tonal layering—the page, panels, controls, and muted states stay recognizably related while remaining easy to scan. This contract records the current interface; it does not introduce a redesign.

## 2. Color

### Palette

| Role          | Token                   | Value                | Current or planned usage                                          |
| ------------- | ----------------------- | -------------------- | ----------------------------------------------------------------- |
| Ink           | `--color-ink`           | `#08060d`            | Page headings, strong labels, focus outlines, highlighted borders |
| Text          | `--color-text`          | `#18212e`            | Body copy, controls, option content                               |
| Muted text    | `--color-muted`         | `#5a6675`            | Supporting descriptions                                           |
| Subtle text   | `--color-subtle`        | `#8794a3`            | Secondary metadata, disabled content, icons                       |
| Border        | `--color-border`        | `#d8d2c3`            | Controls, cards, option boundaries                                |
| Soft border   | `--color-border-soft`   | `#e4dece`            | Section-level separation                                          |
| Surface       | `--color-surface`       | `#fffdf6`            | Select triggers, popovers, elevated Dialog content                |
| Muted surface | `--color-surface-muted` | `#f8f7f0`            | Section containers and hover states                               |
| Soft surface  | `--color-surface-soft`  | `#f4f3ec`            | Inline code, highlighted and disabled options                     |
| Panel         | `--color-panel`         | `#fbfaf3`            | Demo cards and nested panels                                      |
| Overlay       | `--color-overlay`       | `rgb(8 6 13 / 0.55)` | Planned Dialog backdrop                                           |

### Rules

- Use the palette by semantic role; extend this table before adding a new color.
- New Dialog demo styling uses these custom properties instead of raw color values.
- Existing page and Select raw color values remain unchanged as accepted debt in Section 8.

## 3. Typography

### Current scale

| Level         | Size   | Weight         | Line height            | Usage                               |
| ------------- | ------ | -------------- | ---------------------- | ----------------------------------- |
| Page title    | `28px` | `800`          | Inherited              | Main page heading                   |
| Section title | `16px` | `700`          | Tailwind default       | Demo section heading                |
| Body          | `16px` | `400`          | `1.7` where specified  | Introductory and page copy          |
| UI small      | `14px` | `400` or `700` | `20px` or `24px`       | Controls, descriptions, card titles |
| Caption       | `12px` | `400`          | `20px` where specified | Dense supporting detail             |
| Inline code   | `15px` | `400`          | `1.35`                 | Repository paths                    |

### Font stack

- Primary: the inherited Tailwind sans-serif stack; `Geist` is loaded as `--font-geist-sans` by the root layout.
- Monospace: Tailwind `font-mono`; `Geist Mono` is loaded as `--font-geist-mono` by the root layout.
- Serif: not used.

### Rules

- Preserve the current scale and weight hierarchy; this extraction does not retune typography.
- Use real text and a logical heading order. Do not encode meaning through size or color alone.

## 4. Spacing & Layout

### Base unit

All current spacing is interpreted on a **4px base unit**. The active steps are `4`, `8`, `12`, `16`, `24`, `32`, and `64px`; half-step utilities already present in the page resolve to multiples of `2px` and are recorded rather than migrated.

### Current layout

- The page is a centered, single-column composition with a `640px` maximum width, `24px` horizontal padding, and `64px` vertical padding.
- Sections and cards use `16px` internal spacing; major text and section breaks use `24px` or more.
- Select controls fill their container and keep at least a `48px` control height.
- Responsive behavior remains a fluid single column; Tailwind's existing breakpoints remain authoritative when a later component needs an explicit breakpoint.

### Rules

- New spacing must use the 4px scale and stay local to the component or section it serves.
- This contract adds no layout change to the page or Select demos.

## 5. Components

### Select

- **Structure**: `SelectRoot` composes `SelectTrigger`, `SelectValue`, `SelectContent`, and `SelectItem` without baking demo styles into the shared primitive.
- **Variants**: text, size, and product options share the same headless state contract while consumers render their own content.
- **Spacing**: controls and options use the 4px scale, including `8px` list gaps, `12px` option padding, and `16px` trigger padding.
- **States**: closed, open, hovered, focused, highlighted, selected, disabled, and inline fallback when native Popover or anchor positioning is unavailable.
- **Accessibility**: the trigger is a keyboard-operable combobox; the listbox and options expose their current state, keep focus on the trigger, and retain a visible focus outline.
- **Motion**: only the existing color transitions are retained; this task adds no Select motion.

### Dialog

- **Structure**: a callable `Dialog` root composes `Trigger`, `Overlay`, `Content`, `Title`, `Description`, and `Close`; Overlay and Content are independent body portals.
- **Variants**: uncontrolled and controlled Dialogs share one demonstration surface with one trigger each.
- **Spacing**: demo styling uses the 4px scale and the palette in Section 2.
- **States**: both variants expose closed and open states while differing only in whether the Dialog or its parent owns `open`.
- **Imperative handle**: the public ref window exposes only `open()`, `close()`, and `toggle()`; each method uses the same state request contract as the compound controls, so controlled state remains parent-owned.
- **Accessibility**: Trigger, Overlay, and Close use native button semantics with visible focus. The assignment explicitly defers focus trapping, focus restoration, and Dialog ARIA wiring, so this contract does not add them.
- **Motion**: none. Dialog state changes are immediate and no animation system is planned.

## 6. Motion & Interaction

- No animation system, keyframes, entrance effect, or exit effect is part of the current contract.
- Existing Select `transition-colors` behavior remains untouched.
- Dialog open and close changes are immediate; motion must not be added during the scoped implementation.
- Keyboard and pointer actions receive equivalent outcomes, consumer-cancelled actions remain cancelled, and every interactive control keeps a visible `:focus-visible` treatment.
- With no non-essential animation, reduced-motion users receive the same immediate state changes by default.

## 7. Depth & Surface

The current strategy is **mixed border, tonal shift, and restrained shadow depth**.

- Default controls and cards use a `1px` warm border with `--color-border`; outer sections may use the softer `--color-border-soft`.
- `--color-surface`, `--color-panel`, `--color-surface-muted`, and `--color-surface-soft` form the tonal depth sequence.
- Existing cards, sections, and Select surfaces use only the current small shadow treatment; no new shadow scale is introduced.
- Rounded surfaces range from compact option corners through card and section radii. Dialog styling reuses that visual language rather than creating a new shape family.
- Dialog Overlay uses `--color-overlay` to separate the top layer without changing underlying page styles.

## 8. Accessibility Constraints & Accepted Debt

### Constraints

- Target WCAG 2.2 AA contrast: at least `4.5:1` for body text and `3:1` for large text and meaningful non-text boundaries.
- Preserve logical headings, semantic native controls, keyboard reachability, and visible focus indicators.
- Do not communicate selected, highlighted, disabled, or open state through color alone.
- Keep controls usable at narrow widths without horizontal clipping and retain at least the existing `48px` Select trigger height.
- The later Dialog implementation must stay within the assignment's explicit accessibility scope documented in Section 5; future production use requires a separately approved focus and ARIA pass.

### Accepted debt

| Item                                                                         | Location                                                                                                       | Why accepted                                                                                      | Owner / Exit                                                |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Raw hex colors duplicate the palette instead of consuming custom properties. | `src/app/page.tsx`, `src/app/_components/SelectDemos.client.tsx`, `src/app/_components/select-demos/styles.ts` | Todo 1 preserves the current page and Select presentation and explicitly forbids color migration. | Migrate only in a separately approved page/Select refactor. |
