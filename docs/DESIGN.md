---
name: Urban Energy
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#e1bfb5'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#a98a80'
  outline-variant: '#594139'
  surface-tint: '#ffb59d'
  primary: '#ffb59d'
  on-primary: '#5d1900'
  primary-container: '#ff6b35'
  on-primary-container: '#5f1900'
  inverse-primary: '#ab3500'
  secondary: '#ffb2b9'
  on-secondary: '#67001e'
  secondary-container: '#cf0346'
  on-secondary-container: '#ffe1e2'
  tertiary: '#ffba3a'
  on-tertiary: '#432c00'
  tertiary-container: '#cb8e00'
  on-tertiary-container: '#442d00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbd0'
  primary-fixed-dim: '#ffb59d'
  on-primary-fixed: '#390c00'
  on-primary-fixed-variant: '#832600'
  secondary-fixed: '#ffdadc'
  secondary-fixed-dim: '#ffb2b9'
  on-secondary-fixed: '#40000f'
  on-secondary-fixed-variant: '#91002e'
  tertiary-fixed: '#ffdead'
  tertiary-fixed-dim: '#ffba3a'
  on-tertiary-fixed: '#281900'
  on-tertiary-fixed-variant: '#604100'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-xl:
    fontFamily: hankenGrotesk
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: hankenGrotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: hankenGrotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: hankenGrotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: dmSans
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 28px
  body-md:
    fontFamily: dmSans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: dmSans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: dmSans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-margin: 20px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
  stack-xl: 40px
---

## Brand & Style
The design system is engineered for a high-energy social landscape, specifically targeting the vibrant Gen-Z demographic in urban India. The aesthetic is "Electric Warmth"—a synthesis of deep, dark foundations and high-velocity gradients that mimic the neon pulse of nightlife and street culture.

The style leverages **Dark-Mode Minimalism** with **Glassmorphic** accents. It avoids the coldness of pure black by using a warm charcoal base, ensuring the interface feels human and inviting rather than technical. The emotional response is one of excitement, inclusivity, and "FOMO-breaking" connectivity. Visuals are high-contrast, prioritize photography, and use kinetic energy through gradients to guide the user toward social action.

## Colors
The palette is built on a "Warm Dark" foundation. By using `#111111` instead of pure black, we maintain a sense of depth and tactile quality. 

- **Primary & Secondary:** A high-vibrancy duo of Burnt Orange and Hot Coral. These are never used in isolation for major actions; they are fused into a **Brand Gradient** to represent energy and movement.
- **Accents:** Gold is reserved for premium features or "featured" event status. Green is used strictly for success states and "Active Now" indicators.
- **Text:** The typography uses off-white and warm greys to prevent eye strain and maintain the "human" feel of the brand.

## Typography
The system uses **Hanken Grotesk** (as a high-quality alternative for Cabinet) for headlines to provide a sharp, fashionable edge. **DM Sans** (as a proxy for Satoshi) handles body copy with its clean, geometric, yet approachable character.

- **Display:** Used for hero sections and event titles. It should always be ExtraBold to command attention.
- **Headlines:** SemiBold for sub-headers and Bold for section titles.
- **Body:** Regular for long-form descriptions; Medium for emphasis within text blocks.
- **Labels:** Always slightly more tracked out (letter-spacing) to ensure legibility against dark backgrounds at small sizes.

## Layout & Spacing
The layout follows a **Fluid Grid** model optimized for mobile-first consumption. 

- **Margins:** A standard 20px side margin provides a generous "safe zone" for thumb navigation.
- **Rhythm:** An 8px linear scaling system is used for all internal component spacing (8, 16, 24, 32, 40).
- **Mobile-First:** On mobile, content is primarily single-column stacks. On tablet and larger, cards should reflow into a 2 or 3-column masonry grid to maintain the "discovery" feel of a social feed.

## Elevation & Depth
In this design system, depth is communicated through **Tonal Layering** and **Backdrop Blurs**.

1.  **Level 0 (Base):** #111111 - The canvas.
2.  **Level 1 (Cards):** #1A1A1A with a 1px border of #2A2A2A. This creates a subtle "lift" without needing heavy shadows.
3.  **Level 2 (Modals/Popovers):** #222222. These use a soft, large-radius shadow (0px 12px 32px rgba(0,0,0,0.5)) to separate from the background.
4.  **Glass Layer:** Used for the Bottom Navigation. A 95% opacity hex (#111111F2) combined with a 20px backdrop blur allows event imagery to peek through as the user scrolls, maintaining a sense of place.

## Shapes
The shape language is "Hyper-Rounded," reflecting a modern, friendly social vibe.

- **Standard Elements:** Inputs and small components use a 12px radius.
- **Container Elements:** Cards and major sections use a 16px radius.
- **Interactive Elements:** Primary buttons and chips are strictly pill-shaped (999px) to differentiate them as touchable, kinetic objects.
- **Overlays:** Modals use a more pronounced 24px top-corner radius to feel soft and non-intrusive.

## Components

### Buttons
- **Primary:** 56px height, pill-shaped. Background is the Brand Gradient. Text is `#111111` (Bold) for maximum legibility against the vibrant background.
- **Secondary:** 56px height, pill-shaped. Transparent background with a 1px `#2A2A2A` border. Text is `#F5F0EB`.
- **Tertiary/Ghost:** 48px height, no border, text-only for less critical actions.

### Input Fields
- **Container:** 52px height, #222222 background, 12px radius, 1px #2A2A2A border.
- **Text:** Primary text color for input, Secondary for placeholders.
- **Focus State:** Border changes to the Primary Orange (#FF6B35).

### Cards
- **Structure:** #1A1A1A background, 16px radius, 1px #2A2A2A border.
- **Imagery:** Aspect ratio of 4:5 or 1:1 for event photos. Images should have a subtle dark overlay at the bottom to ensure white text remains readable.

### Navigation
- **Bottom Bar:** 72px height, glassmorphic effect. Icons use `#A09890` for inactive and the Brand Gradient for active.
- **Center Tab:** A floating 64px circle with the Brand Gradient, raised 8px above the nav bar line to emphasize the "Create/Join" action.

### Chips & Tags
- Pill-shaped, 32px height. Used for event categories (e.g., "Music," "Art"). Use #222222 background with #F5F0EB text.