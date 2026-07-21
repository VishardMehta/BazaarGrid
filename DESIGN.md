---
name: Modern Agrarian
colors:
  surface: '#faf9f5'
  surface-dim: '#dbdad6'
  surface-bright: '#faf9f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f4f0'
  surface-container: '#efeeea'
  surface-container-high: '#e9e8e4'
  surface-container-highest: '#e3e2df'
  on-surface: '#1b1c1a'
  on-surface-variant: '#56423e'
  inverse-surface: '#2f312e'
  inverse-on-surface: '#f2f1ed'
  outline: '#89726d'
  outline-variant: '#ddc0bb'
  surface-tint: '#a03f30'
  primary: '#9d3d2e'
  on-primary: '#ffffff'
  primary-container: '#bd5444'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb4a7'
  secondary: '#48654e'
  on-secondary: '#ffffff'
  secondary-container: '#c7e8cb'
  on-secondary-container: '#4c6952'
  tertiary: '#7c5800'
  on-tertiary: '#ffffff'
  tertiary-container: '#9b6f01'
  on-tertiary-container: '#080400'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad4'
  primary-fixed-dim: '#ffb4a7'
  on-primary-fixed: '#400200'
  on-primary-fixed-variant: '#80281b'
  secondary-fixed: '#caebce'
  secondary-fixed-dim: '#aecfb3'
  on-secondary-fixed: '#04210f'
  on-secondary-fixed-variant: '#304d38'
  tertiary-fixed: '#ffdea7'
  tertiary-fixed-dim: '#f4be55'
  on-tertiary-fixed: '#271900'
  on-tertiary-fixed-variant: '#5e4200'
  background: '#faf9f5'
  on-background: '#1b1c1a'
  surface-variant: '#e3e2df'
typography:
  display-lg:
    fontFamily: Newsreader
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Newsreader
    fontSize: 32px
    fontWeight: '500'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Newsreader
    fontSize: 28px
    fontWeight: '500'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Newsreader
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Work Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Work Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
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
  md: 24px
  lg: 48px
  xl: 80px
  container-margin: 32px
  gutter: 24px
---

## Brand & Style

This design system embodies the "Modern Agrarian" aesthetic—a sophisticated intersection of heritage craftsmanship and contemporary digital precision. It is designed to evoke a sense of deep-rooted trust, premium quality, and environmental stewardship. The target audience values transparency, artisanal quality, and the tangible connection between source and consumer.

The visual style is **Corporate Modern with Tactile influences**. It avoids the sterility of typical e-commerce by using organic color palettes and humanist typography, while maintaining a high-end, reliable feel through generous whitespace and structured layouts. The emotional response should be one of calm, confidence, and authenticity. 
- **Authenticity:** UI elements should feel grounded and "heavy," avoiding flimsy or overly neon aesthetics.
- **Sophistication:** High-contrast text and refined serif headings signal a premium, curated experience.
- **Transparency:** Clear data visualization and prominent trust markers reinforce the "Verified Producer" narrative.

## Colors

The palette is derived from the natural landscape—clay, forest, sun, and cream.

- **Primary (Terracotta - #C05746):** Used for primary actions, critical brand moments, and accenting organic shapes. It represents the earth and human craft.
- **Secondary (Deep Green - #3D5A44):** Used for "Verified" statuses, headers, and secondary buttons. It grounds the UI and provides a sense of growth and stability.
- **Tertiary (Turmeric Yellow - #E9B44C):** Reserved for highlights, ratings, and promotional callouts. It adds a warmth and "glow" to the interface.
- **Neutral (Cream - #FDFCF8):** The base of the design. This off-white background reduces eye strain and provides a more premium, editorial feel than pure white.
- **Semantic Text:** Use near-blacks and charcoal greens for text to maintain high contrast while remaining softer than harsh hex #000000.

## Typography

This design system utilizes a high-contrast pairing of a humanist serif and a grounded sans-serif.

- **Newsreader (Headings):** Used for all editorial titles and product names. It has a literary, authoritative quality that communicates heritage. Use medium to semi-bold weights to ensure presence against textured backgrounds.
- **Work Sans (Body/UI):** Used for all functional text, descriptions, and data. It is highly legible and provides a sturdy, reliable contrast to the more decorative Newsreader.
- **Scale & Rhythm:** Emphasis is placed on vertical rhythm. Body text is slightly larger than industry standard (18px for large body) to prioritize readability for a premium audience.

## Layout & Spacing

The layout philosophy follows a **Fixed-Fluid hybrid grid**. 
- **Desktop:** 12-column grid with a maximum container width of 1280px. 24px gutters and 48px margins.
- **Tablet:** 8-column grid with 24px gutters and 32px margins.
- **Mobile:** 4-column grid with 16px gutters and 16px margins.

**Spacing Rhythm:** 
Generous whitespace is mandatory to maintain a premium feel. Use the `lg` (48px) and `xl` (80px) units to separate major content sections. Elements within a component (like a card) should use `md` (24px) padding to ensure the UI feels airy and un-cluttered.

## Elevation & Depth

To maintain a grounded, earthy feel, this design system avoids floating elements or heavy drop shadows. Instead, it uses **Tonal Layers** and **Tinted Ambient Shadows**.

- **Surface Tiers:** The primary background is the Cream (#FDFCF8). Secondary surfaces (cards, containers) use a subtle 1px stroke in a lightened version of the Deep Green or a slightly darker cream to create depth without "lifting" off the page.
- **Shadows:** When elevation is required (e.g., hover states on cards), use a "Deep Green Shadow"—a low-opacity (8-12%) shadow tinted with the secondary color. This feels more organic than grey/black shadows.
- **Textures:** Subtle, nearly-invisible grain or paper textures can be applied to the Primary and Secondary surfaces to reinforce the tactile brand narrative.

## Shapes

The shape language is defined by **Softened Geometries**.

- **Standard Radius:** 0.5rem (8px) for small interactive elements like buttons or input fields.
- **Large Radius (rounded-lg):** 1rem (16px) for standard product and information cards.
- **Extra Large Radius (rounded-xl):** 1.5rem (24px) for major container sections and hero images.

The combination of the sturdy Work Sans and these rounded corners creates a "Friendly Professional" look that feels approachable yet high-end.

## Screen references

Exact Stitch screen exports (screenshots + static HTML) live in
[`design/screens/`](design/screens/) — see its [README](design/screens/README.md)
for the screen → feature map. They are layout references only; the YAML tokens at
the top of this file remain the source of truth for colour, type and spacing.

## Components

### Buttons
- **Primary:** Terracotta fill with Cream text. 8px corner radius. High-contrast and bold.
- **Secondary:** Deep Green outline (2px) with Deep Green text. 
- **Hover States:** Subtle shift in background saturation and a gentle 4px "Tinted Shadow" to indicate interactivity.

### Cards
- **Product Cards:** 16px rounded corners, 1px subtle stroke (#E6E4DD), and 24px internal padding. 
- **Hover:** The stroke color shifts to Terracotta and a slight ambient shadow appears.

### Trust Badges
- **Verified Producer:** A Deep Green circular or pill-shaped badge with a humanist checkmark icon. 
- **QR-Traceable:** A high-contrast black/white or Deep Green/Cream badge, clearly defined with a thin border.
- **Placement:** Always placed in the top-right of product images or immediately adjacent to producer names.

### Form Fields
- Labels should use `label-md` in Deep Green.
- Input fields use a 1px border in a muted green-grey. Focused states use a 2px Terracotta border.

### Chips & Tags
- Used for categories (e.g., "Organic," "Local"). Use low-saturation versions of the brand colors with dark text to ensure readability without competing with Primary buttons.