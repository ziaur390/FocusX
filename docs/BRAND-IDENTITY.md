# FocusX brand identity

FocusX is a study accountability app. The identity gives the student's goal the most visual weight and places it inside an open study circle. Use the dot as the immediate point of attention across the logo, the room timer, and the current action.

## Logo

| Application | Use |
| --- | --- |
| Main lockup | One violet dot inside two fine, opposing deep-ink arcs, followed by the medium-weight **FocusX** wordmark. Capitalize F and X. |
| App icon | Use the same mark in a deep-ink rounded square with thin white arcs and a violet center. Center it with padding around the arcs. |
| Standalone mark | Use the dot and arcs where the app name is already visible. |
| Small-size fallback | Use a single violet dot if the full arcs become unclear. Check the full mark at 24 px and the fallback at 16 px. |

The two arcs suggest the friends around the goal. Keep the dot round and prominent, around half the mark's width. Use two opposing arc strokes around 6% of the mark width, with rounded ends and generous diagonal gaps. Set the wordmark in a medium weight with modestly tight spacing. Place the main lockup on white with clear space on each side at least equal to the dot's radius. Keep the logo level and preserve its proportions. Treat the brand board as the artwork reference and use the exact values below for app surfaces and artwork production. An optional tagline for a landing page is **Study together. Follow through.**

## Colors

| Color | Hex | Role |
| --- | --- | --- |
| Electric Violet | `#6945F5` | Focal dot, primary actions, current steps and focus outlines |
| Violet hover | `#5632D9` | Hover or pressed state on primary actions |
| Deep Ink | `#16122D` | Wordmark, main text, app icon tile and dark timer surface |
| Paper | `#FAF8FF` | Subtle inset surfaces or secondary cards |
| White | `#FFFFFF` | Main canvas, reverse mark arcs and type on violet actions |
| Soft Lavender | `#EEE8FF` | Active room and selected panel surfaces |
| Fresh Mint | `#A8E8CF` | Completed outcomes and peer responses when paired with Deep Ink text |
| Muted Ink | `#56536A` | Secondary text on light surfaces |
| Divider | `#DDD8EE` | Subtle separations on light surfaces |
| Due label | `#8A4B13` on `#FFF1DD` | Awaiting or due action when an explicit status warrants attention |
| Error label | `#A72B4D` on `#FFEDF2` | A real error such as a failed submission |

Use Deep Ink for normal text on Paper, White or Fresh Mint. Use white text on Violet buttons. These pairs measure approximately **17.2:1** for Deep Ink on Paper, **13.0:1** for Deep Ink on Fresh Mint, and **5.6:1** for white on Electric Violet. Place a text label next to status indicators. Show a left, partly completed, or missed check-in neutrally. [W3C text contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)

## Type

| Role | Typeface | Starting style |
| --- | --- | --- |
| Screen headings | Bricolage Grotesque | 600. Use 36/42 px for a desktop page title and 30/36 px on mobile. |
| Section headings | Bricolage Grotesque | 600, 22/28 px |
| UI, forms, goals and feedback | Inter | 400 regular or 600 semibold, 16/24 px |
| Buttons and compact labels | Inter | 600, 14/20 px |
| Timer and score | Inter | 600, about 48/52 px for the room countdown. Enable tabular numbers so the timer stays aligned. |

Preserve the custom wordmark artwork as the logo. Use the font families for live text. Set a system sans-serif fallback so the interface remains readable while fonts load. [Bricolage Grotesque](https://ateliertriay.github.io/bricolage/) · [Inter](https://rsms.me/inter/)

## First room screen

- Start on white with a small FocusX lockup in the header. Give the session title and countdown generous space on the canvas. Use one violet dot beside the current timer state and a clear text label. Reserve Soft Lavender for a selected state or functional highlight.
- Use a simple list for members, with subtle dividers and ample vertical spacing. Make the study goal primary and put **Ready**, **Awaiting check-in**, or **Acknowledged** next to it. Mint marks completed actions rather than ranking people.
- Use one violet button for the student's current action, such as **Set your goal**, **Check in**, or **Respond to a peer**. Use neutral secondary controls for leaving or viewing details.
- On desktop, place the timer above the member cards or beside them if the goals remain readable. On mobile, stack timer, member goals and next action in that order. Show a visible keyboard focus indicator and keep the countdown readable on refresh.

[Product design](PRODUCT-DESIGN.md) · [First room task](../harness/tasks/FX-001.md)
