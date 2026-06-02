---
name: Luminous Performance
colors:
  surface: '#0e1322'
  surface-dim: '#0e1322'
  surface-bright: '#343949'
  surface-container-lowest: '#090e1c'
  surface-container-low: '#161b2a'
  surface-container: '#1a1f2e'
  surface-container-high: '#252939'
  surface-container-highest: '#2f3444'
  on-surface: '#dee2f7'
  on-surface-variant: '#c5c9ac'
  inverse-surface: '#dee2f7'
  inverse-on-surface: '#2b3040'
  outline: '#8f9378'
  outline-variant: '#444932'
  surface-tint: '#b0d500'
  primary: '#ffffff'
  on-primary: '#2a3400'
  primary-container: '#caf300'
  on-primary-container: '#596c00'
  inverse-primary: '#536600'
  secondary: '#c3c6d7'
  on-secondary: '#2c303d'
  secondary-container: '#454957'
  on-secondary-container: '#b5b8c9'
  tertiary: '#ffffff'
  on-tertiary: '#003354'
  tertiary-container: '#cee5ff'
  on-tertiary-container: '#0069a5'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#caf300'
  primary-fixed-dim: '#b0d500'
  on-primary-fixed: '#171e00'
  on-primary-fixed-variant: '#3e4c00'
  secondary-fixed: '#dfe2f3'
  secondary-fixed-dim: '#c3c6d7'
  on-secondary-fixed: '#171b28'
  on-secondary-fixed-variant: '#434654'
  tertiary-fixed: '#cee5ff'
  tertiary-fixed-dim: '#97cbff'
  on-tertiary-fixed: '#001d33'
  on-tertiary-fixed-variant: '#004a77'
  background: '#0e1322'
  on-background: '#dee2f7'
  surface-variant: '#2f3444'
typography:
  display-lg:
    fontFamily: Lexend
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Lexend
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Lexend
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Lexend
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-display:
    fontFamily: Lexend
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 24px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  grid-margin: 20px
  grid-gutter: 16px
---

## Brand & Style

The design system is engineered for high-performance fitness and nutritional management. The brand personality is energetic, precise, and authoritative, bridging the gap between professional athletic gear and cutting-edge artificial intelligence. It seeks to evoke a sense of "charged focus"—a state of being motivated yet disciplined.

The aesthetic follows a **Modern Corporate** foundation infused with **Glassmorphism** and **High-Contrast** accents. By utilizing deep, dark backgrounds with vibrant, fluorescent highlights, the UI mimics the high-visibility gear found in endurance sports while maintaining the sophisticated, tech-forward polish of an AI-driven platform. The interface feels lightweight and data-rich without becoming overwhelming.

## Colors

The palette is anchored by a dark-mode-first approach to reduce eye strain during frequent daily logging and to allow high-energy colors to pop.

- **Primary (Electric Lime):** Used for primary actions, success states, and progress indicators. It represents energy and kinetic movement.
- **Secondary (Midnight Navy):** The core foundation of the app, providing a deep, premium canvas that recedes into the background.
- **Tertiary (Sky Blue):** Utilized for hydration metrics, calm data points, and informational non-critical highlights.
- **Accent (Soft Coral):** Reserved for calorie-burning metrics, high-intensity alerts, and critical goal-missing indicators.
- **Neutral Surface:** A slightly lighter navy used for containers and cards to create depth against the background.

## Typography

This design system utilizes **Lexend** for headlines and data visualizations due to its athletic, open character and superior readability in numerical contexts. For functional UI elements and long-form text, **Inter** provides a systematic, neutral counterpoint that ensures clarity.

Heavy weights are used for performance metrics to give them a "physically present" feel. Data labels always use high-contrast Inter in uppercase to distinguish them from user-generated content or narrative text.

## Layout & Spacing

The layout utilizes a **fluid 12-column grid** for desktop and a **4-column grid** for mobile. A strict **8px spatial system** governs all padding and margins to ensure a tight, mathematical rhythm.

- **Mobile:** 20px side margins with 16px gutters. Elements are largely stacked, but macro metrics often live in 2-column horizontal pairs.
- **Desktop/Tablet:** Content is constrained to a max-width of 1280px. Dashboards utilize a "Bento Box" style arrangement, where widgets of varying sizes snap to the grid.
- **Density:** High information density is encouraged for data screens, using the 8px base to maintain clear separation without wasting screen real estate.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Glassmorphism**. Shadows are avoided in favor of light-based depth.

1. **Floor (Midnight Navy):** The absolute background.
2. **Surface (Neutral Navy):** Standard cards and container areas.
3. **Elevated (Glass):** AI widgets and floating action buttons. These use a 12% white opacity fill with a 20px backdrop blur and a 1px subtle border (20% white).
4. **Glows:** Primary elements (like active progress rings) emit a soft, 15px outer glow of their own color (Electric Lime or Sky Blue) to simulate light emission from a high-tech screen.

## Shapes

The shape language is "Softly Technical." We avoid sharp corners to maintain an approachable feel for health and wellness, but we also avoid overly "bubbly" shapes to keep the professional athletic edge.

- **Standard Containers:** 0.5rem (8px) radius.
- **Large Cards/Modals:** 1rem (16px) radius.
- **Pill Elements:** Used specifically for interactive chips, tag categories, and the AI chat input field to denote "interactivity."

## Components

### Meal Planner Cards

Cards should feature a 1px inner border. Macros (P/C/F) are displayed as a horizontal bar chart at the bottom of the card, using Electric Lime for protein, Sky Blue for carbs, and Soft Coral for fats.

### Progress Rings

The primary tracking mechanism for calories and hydration. Rings use a thick 8pt stroke with rounded caps. The "track" (empty state) is a 10% opacity version of the accent color. The active stroke features a slight linear gradient (e.g., Electric Lime to a slightly darker shade).

### AI Assistant Interface

The AI chat uses glassmorphic bubbles. User messages are outlined; AI responses have a subtle 5% Electric Lime tint and a glow-effect "Sparkle" icon. Widgets generated by the AI (like suggested workouts) float with a higher backdrop blur.

### Form Inputs

Form fields use the Neutral Surface color with no background, just a 1px bottom border that turns Electric Lime on focus. Error states use Soft Coral with a small "shake" animation.

### Buttons

- **Primary:** Solid Electric Lime with black text for maximum "clickability."
- **Secondary:** Ghost style with a 1px white border and white text.
- **AI Action:** Gradient fill (Sky Blue to Electric Lime) with a subtle pulse animation.
