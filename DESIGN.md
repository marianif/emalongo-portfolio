---
name: Emanuele Longo — Espressionismo Visionario
description: Bilingual portfolio for a visionary-expressionist painter — a warm-dark gallery crypt bound into a bone-paper catalogue.
colors:
  ember: "#9a3322"
  ember-bright: "#c0492f"
  crypt-soot: "#14110d"
  crypt-soot-deep: "#0d0b08"
  crypt-raise: "#1d1812"
  crypt-bone: "#ece4d6"
  crypt-ash: "#8a8073"
  crypt-ash-dim: "#5b5347"
  cat-paper: "#ece3d2"
  cat-paper-raise: "#f3ecdd"
  cat-ink: "#221d16"
  cat-ink-soft: "#4f463a"
  cat-rule: "#cabfa8"
typography:
  display:
    fontFamily: "Besley, Georgia, serif"
    fontSize: "clamp(2.75rem, 7vw, 6rem)"
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Besley, Georgia, serif"
    fontSize: "clamp(1.75rem, 3vw, 2.5rem)"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Besley, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 500
    lineHeight: 1.2
  body:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.01em"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "48px"
  xl: "96px"
rounded:
  none: "0px"
components:
  language-toggle:
    textColor: "{colors.crypt-ash}"
    typography: "{typography.label}"
    padding: "8px 12px"
  language-toggle-active:
    textColor: "{colors.ember}"
    typography: "{typography.label}"
    padding: "8px 12px"
  nav-link:
    textColor: "{colors.crypt-bone}"
    typography: "{typography.label}"
  nav-link-active:
    textColor: "{colors.ember}"
    typography: "{typography.label}"
  artwork-meta:
    textColor: "{colors.crypt-ash}"
    typography: "{typography.label}"
---

# Design System: Emanuele Longo

## 1. Overview

**Creative North Star: "The Catalogue and the Crypt"**

Two worlds, one binding. The galleries are a **crypt**: a warm bistre near-black
(`#14110d`) where the paintings glow off the wall like objects lit in a closed
room after hours. The reading surfaces — biography, the artist statement — are
the **catalogue**: a warm bone-paper ground (`#ece3d2`) with an inked slab serif,
the printed monograph that accompanies the exhibition. Moving between the two,
out of the dark room to read and back in to look, is the experience.

The type carries the duality. The voice is **Besley**, a slab serif of Clarendon
lineage with ink and weight, chosen deliberately against the airy editorial
text-serifs (Fraunces, Newsreader, Cormorant) that have become the reflex for
art and culture sites. It reads like printed wood-type or a defaced devotional
plate, not a fashion magazine. The chrome is **Hanken Grotesk**, a quiet humanist
grotesque that disappears into the role of a gallery label. There is no
monospace: metadata sits in the sans, lowercase and minimal, to stay out of the
"display-serif + mono-label + ruled-column" editorial fingerprint entirely.

This system explicitly rejects the **sterile white-cube** default (stark white,
tiny uniform thumbnails, zero atmosphere), the **generic SaaS/template** look
(centered hero with tagline and two buttons, feature cards, rounded-everything,
gradient CTAs), **Instagram-feed flatness** (endless equal-weight scroll), and
**effect-for-its-own-sake spectacle** (motion that upstages the imagery).

**Key Characteristics:**
- Dark/light duality: crypt-dark galleries, catalogue-light editorial pages.
- Warm-tinted blacks and bone whites — never pure `#000` or `#fff`.
- An inked slab serif (voice) against a quiet grotesque (chrome). No mono.
- Zero corner rounding; depth from value and atmosphere, never shadows.
- Motion deliberate by default, fully immersive only in signature moments.
- Imagery leads every screen; chrome stays quiet so the art can be loud.

## 2. Colors

Warm darkness and warm paper, with a single muted ember that appears almost
never. The site opens in the crypt; sections opt into the catalogue with a
`data-ground="catalogue"` attribute that re-points the semantic color roles.

### Primary
- **Ember / Oxblood** (`#9a3322`): the one accent. Active navigation, the active
  language, an "available" marker, a single hover tint. Muted and desaturated,
  drawn from the manifesto's "art born of blood and fire" but held to embers,
  never bright. **Ember Bright** (`#c0492f`) exists only as a hover lift.

### Neutral — Crypt (dark world)
- **Soot / Bistre Black** (`#14110d`): the gallery ground; warm, umber-tinted,
  never blue-black. **Soot Deep** (`#0d0b08`): deeper pools, vignettes, footer.
  **Crypt Raise** (`#1d1812`): a barely-raised dark surface.
- **Bone** (`#ece4d6`): primary text and the artist's name on dark.
- **Ash** (`#8a8073`): low-contrast warm grey for metadata and dividers.
  **Ash Dim** (`#5b5347`): hairlines and decorative type.

### Neutral — Catalogue (light world)
- **Bone Paper** (`#ece3d2`): editorial ground for bio and statement.
  **Paper Raise** (`#f3ecdd`): a lifted paper panel.
- **Ink** (`#221d16`): warm near-black body text. **Ink Soft** (`#4f463a`):
  secondary text and captions. **Rule** (`#cabfa8`): paper-toned hairline.

### Named Rules
**The Two-Worlds Rule.** Galleries and imagery live in the crypt (dark);
long-form reading lives in the catalogue (light). The ground is set by the
`data-ground` attribute at a section or page boundary, never by an inline
ternary, and the two grounds never mix within one content zone.

**The Ember Scarcity Rule.** The accent appears on ≤5% of any screen. Its rarity
is the meaning: when it shows, something is active, live, or available.

**The No-Pure-Black/White Rule.** `#000000` and `#ffffff` are forbidden. Every
neutral tints warm toward umber or bone, to agree with the warm-toned work.

## 3. Typography

**Display Font:** Besley (with Georgia, serif fallback)
**Body Font:** Hanken Grotesk (with system-ui, sans-serif fallback)
**Label/Mono Font:** none — labels use Hanken Grotesk. Monospace is forbidden.

**Character:** An inked slab serif carrying the artist's voice and titles, held
in check by a quiet humanist grotesque for everything functional. The slab is
the painter speaking, printed and physical; the grotesque is the gallery label
beside the frame. Besley italic carries the manifesto's emphatic passages.

### Hierarchy
- **Display** (Besley, 500, `clamp(2.75rem, 7vw, 6rem)`, line-height 1.05):
  the artist name, the statement's opening lines, gallery section titles.
- **Headline** (Besley, 500, `clamp(1.75rem, 3vw, 2.5rem)`, 1.1): page and
  body-of-work titles.
- **Title** (Besley, 500, 1.25rem, 1.2): artwork titles.
- **Body** (Hanken Grotesk, 400, 1.0625rem, 1.6, max ~66ch): bio and statement
  prose. On dark, line-height stays generous so light type keeps its air.
- **Label / Meta** (Hanken Grotesk, 500, 0.8125rem, letter-spacing 0.01em):
  navigation, language toggle, and artwork metadata (technique, dimensions,
  year). Lowercase or sentence case — never all-caps tracked kickers.

### Named Rules
**The Voice/Label Rule.** Besley is the artist's voice (titles, name, statement).
Hanken is the institution's label (nav, metadata, UI). Never use the serif for
chrome or the sans for the artist's words.

**The No-Mono Rule.** Metadata never goes in a monospace. Mono + display-serif
is the editorial-typographic reflex; this system refuses it on purpose.

## 4. Elevation

Flat by default. Depth comes from darkness and atmosphere, not shadows. In the
crypt, imagery sits in pools of warm dark; separation comes from value and
negative space. The only "elevation" is atmospheric: a subtle vignette or a slow
parallax that makes an image feel lit from within. No Material-style cards, no
glassmorphism, no drop shadows. Corner radius is `0` everywhere — surfaces meet
the ground as printed plates, not as rounded chips.

### Named Rules
**The Atmosphere-Not-Shadow Rule.** Depth is conveyed by light, value, and slow
motion, never by a crisp drop shadow under a card. If a surface must lift, the
ground around it darkens; it does not cast a shadow.

## 5. Components

The component layer is still forming — only navigation and metadata primitives
are styled in code so far. The gallery, artwork viewer, and editorial layouts
will be authored when crafting their screens; re-run `/flow document` after that
to capture them.

### Navigation
- **Style:** horizontal links in Hanken Grotesk at label scale, on the crypt
  ground. Default in bone (`#ece4d6`); the active route shifts to ember
  (`#9a3322`). No underlines at rest; the color shift is the state.
- **Hover/Focus:** a quick (`240ms`) tint toward bone-bright with an exponential
  ease-out (`cubic-bezier(0.22, 1, 0.36, 1)`); focus-visible draws a 1px ember
  ring. Mobile: links collapse to a single row or a quiet toggle, never a
  hamburger-hidden drawer while destinations stay ≤5.

### Language Toggle (signature)
- **Style:** a two-state `IT / EN` control in label type. The active language is
  ember; the inactive is ash. It preserves the current route when switching.
- **State:** the ember marks "this is the language you're reading" — one of the
  few sanctioned uses of the scarce accent.

### Artwork Metadata
- **Style:** technique, dimensions, year in Hanken Grotesk ash (`#8a8073`),
  small, lowercase. Sits quietly beneath the work; the title (Besley) leads.

### Buttons / Inputs / Cards
- Not yet authored. When built: zero radius, solid ember or bordered-bone for
  buttons (never a gradient), 1px rules for separation, no card shadows.

## 6. Do's and Don'ts

### Do:
- **Do** tint every neutral warm — soot/bistre blacks, bone/cream whites.
- **Do** keep the ember accent below ~5% of any screen; let its rarity mean
  "active / live / available."
- **Do** lead every screen with imagery; words support, never precede.
- **Do** use Besley for the artist's voice (titles, name, statement) and Hanken
  Grotesk for institutional chrome (nav, metadata).
- **Do** set the light/dark ground with `data-ground` at a section boundary, and
  make the crypt↔catalogue transition deliberate and felt.
- **Do** keep corner radius at `0` and convey depth with value and slow motion.
- **Do** make motion slow and purposeful; reserve full immersion for signature
  moments (hero, gallery entrance) and honor `prefers-reduced-motion` fully.

### Don't:
- **Don't** ship the **sterile white-cube** default: stark white background, tiny
  uniform thumbnails in a rigid grid, zero atmosphere.
- **Don't** ship the **generic SaaS/template** look: centered hero with tagline
  and two buttons, feature-card grids, rounded-everything, gradient CTAs.
- **Don't** ship **Instagram-feed flatness**: endless equal-weight images with
  no curation or narrative.
- **Don't** add **effect-for-its-own-sake spectacle** that upstages the imagery.
- **Don't** use pure `#000000` or `#ffffff` anywhere.
- **Don't** put metadata in a monospace, or pair display-serif + mono-label +
  ruled columns: that editorial-typographic reflex is banned here.
- **Don't** let the ember become decorative or repeated; it is not a brand color
  to sprinkle.
- **Don't** mix the dark and light grounds within a single content zone.
