# UI Configuration & Design System

This document describes the UI configuration settings and design system for the Gifts Guru application, including brand tokens, layout primitives, and configurable options.

## Design System Overview

The application uses a comprehensive design token system aligned with the giftsmate.net brand, providing consistent colors, typography, spacing, and visual hierarchy throughout the application.

### Brand Colors

The design system uses CSS custom properties for consistent brand alignment:

- **Primary Brand Blue**: `#155ca5` - Main giftsmate.net brand color
- **Secondary Dark**: `#222529` - Text and content color from giftsmate.net
- **Accent Light Blue**: `#DBEBFF` - Light accent color for backgrounds and highlights

### Typography System

- **Font Stack**: Optimized system fonts with custom font support planned
- **Scale**: Harmonious typography scale (1.25 ratio) from 12px to 72px
- **Font Weights**: 300-800 range with semantic naming (light, normal, medium, semibold, bold, extrabold)
- **Line Heights**: Semantic values (tight, snug, normal, relaxed, loose)

### Layout Primitives

Two key layout components provide consistent structure:

#### `Page` Component
- Provides page-level structure with header-main-footer grid
- Variants: `default`, `full-width`, `narrow`
- Handles responsive containers and background styling

#### `Section` Component
- Consistent vertical rhythm and spacing
- Sizes: `sm`, `md`, `lg`, `xl` (32px-96px vertical padding)
- Variants: `default`, `hero`, `content`, `feature`
- Semantic HTML support with customizable element types

## Product Card Image Aspect Ratios

Product cards throughout the application use configurable aspect ratios to ensure consistent visual presentation across different screen sizes and use cases.

### Configuration

The image aspect ratio is controlled by the `CARD_IMAGE_ASPECT` setting in `client/config/ui.ts`:

```typescript
export const CARD_IMAGE_ASPECT: 'square' | 'portrait45' =
  (import.meta.env.VITE_CARD_IMAGE_ASPECT as 'square' | 'portrait45') || 'square';
```

### Available Options

#### Square (Default: `'square'`)
- **Aspect Ratio**: 1:1
- **Tailwind Class**: `aspect-square`
- **Use Case**: Ideal for showcasing products with equal visual weight, creating clean grid layouts
- **Best For**: Tech products, accessories, items where the entire product should be visible

#### Portrait 4:5 (`'portrait45'`)
- **Aspect Ratio**: 4:5 (0.8)
- **Tailwind Class**: `aspect-[4/5]`
- **Use Case**: Follows common marketplace and e-commerce conventions (Amazon, eBay style)
- **Best For**: Fashion items, books, tall products, when you want more vertical space for product details

### How to Switch Aspect Ratios

#### Method 1: Environment Variable
Set the environment variable in your `.env` file:

```bash
# For square images (default)
VITE_CARD_IMAGE_ASPECT=square

# For portrait images
VITE_CARD_IMAGE_ASPECT=portrait45
```

#### Method 2: Direct Configuration
Edit `client/config/ui.ts` and change the default value:

```typescript
export const CARD_IMAGE_ASPECT: 'square' | 'portrait45' = 'portrait45'; // Changed from 'square'
```

### Implementation Details

The aspect ratio system uses CSS container cropping with `object-cover` to ensure:
- **No layout shift**: Images maintain consistent container dimensions
- **Center cropping**: Important parts of product images remain visible
- **Responsive behavior**: Aspect ratios scale properly across all device sizes
- **Performance**: No client-side image processing required

### Affected Components

The following components automatically adapt to the configured aspect ratio:

1. **ProductCard**: Main gift search result cards
   - Location: `client/components/gifts/ProductCard.tsx`
   - Usage: Chat interface product results

2. **FeaturedGrid**: Homepage and category featured products
   - Location: `client/components/woocommerce/FeaturedGrid.tsx`
   - Usage: Featured products sections

### Design Considerations

#### For Designers and Content Managers

When choosing product images, keep the following in mind:

- **Subject Positioning**: Keep the main product centered in the image
- **Background**: Use clean, consistent backgrounds that work with cropping
- **Orientation Flexibility**: Images should look good in both square and portrait orientations
- **Quality**: Use high-resolution images that maintain clarity when scaled down

#### Grid Layout Impact

**Square (1:1)**:
- More products visible per row on large screens
- Consistent height across all cards
- Clean, modern aesthetic
- Works well for products with similar shapes

**Portrait 4:5**:
- Fewer products per row, but larger individual product visibility
- More vertical space for product details
- Familiar to users from major e-commerce sites
- Better for products with vertical orientation (books, bottles, apparel)

### Browser Support

The aspect ratio utilities are supported in all modern browsers:
- Chrome/Edge 88+
- Firefox 89+
- Safari 15+

For older browsers, the aspect ratio degrades gracefully to the container's natural height.

### Performance Impact

- **Zero runtime overhead**: Aspect ratios are applied via CSS classes at build time
- **No JavaScript calculations**: Pure CSS solution using Tailwind utilities
- **No CLS (Cumulative Layout Shift)**: Consistent container sizes prevent layout jumps
- **Optimized rendering**: Browsers can pre-allocate space before image loading

## Design Token Implementation

### CSS Custom Properties

The design system is implemented using CSS custom properties in `client/styles/globals.css`:

```css
:root {
  /* Brand Colors */
  --brand-primary-500: 211 77% 36%;        /* #155ca5 */
  --brand-secondary-700: 219 14% 28%;      /* #222529 */
  --brand-accent-200: 219 78% 85%;         /* #DBEBFF */

  /* Typography Scale */
  --text-base: 1rem;       /* 16px */
  --text-lg: 1.125rem;     /* 18px */
  --text-xl: 1.25rem;      /* 20px */

  /* Font Families */
  --font-body: 'AppFont', 'Inter', system-ui, sans-serif;
  --font-heading: 'AppFont', 'Inter', system-ui, sans-serif;

  /* Spacing Scale (4px grid) */
  --space-4: 1rem;         /* 16px */
  --space-8: 2rem;         /* 32px */
  --space-12: 3rem;        /* 48px */

  /* Border Radius */
  --radius-lg: 0.5rem;     /* 8px - default */
}
```

### Tailwind Integration

Custom properties are mapped to Tailwind theme in `tailwind.config.ts`:

```typescript
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: {
            500: "hsl(var(--brand-primary-500))",
            DEFAULT: "hsl(var(--brand-primary-500))",
          }
        }
      },
      fontFamily: {
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
      }
    }
  }
}
```

### Layout Primitive Usage

#### Basic Page Structure

```tsx
import { Page, Section } from "@/components/layout";

export function MyPage() {
  return (
    <Page>
      <SiteHeader />
      <main className="flex flex-col">
        <Section variant="hero" size="lg">
          <h1>Page Title</h1>
          <p>Page description</p>
        </Section>
        <Section variant="content" size="md">
          {/* Content here */}
        </Section>
      </main>
      <SiteFooter />
    </Page>
  );
}
```

### Font Performance

Self-hosted fonts are configured with performance optimization:

```css
@font-face {
  font-family: 'AppFont';
  font-display: swap; /* Prevents invisible text during font load */
  /* TODO: Add actual font files when ready */
}
```

**Benefits**:
- `font-display: swap` ensures text remains visible during font load
- System font fallbacks provide zero-latency text rendering
- Future-ready for custom font implementation

## Future Enhancements

### Design System Extensions
- Dark mode theme variants
- Additional brand color scales
- Component-specific design tokens
- Animation and transition tokens

### Aspect Ratio System
- `'landscape'` (16:9 or 3:2) for wide products
- `'tall'` (3:4) for very vertical products
- Dynamic aspect ratios based on product category
- Admin panel configuration for real-time switching