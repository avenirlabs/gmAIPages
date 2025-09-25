# UI Configuration

This document describes the configurable UI settings for the Gifts Guru application.

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

## Future Enhancements

The aspect ratio system is designed to be extensible. Future options could include:

- `'landscape'` (16:9 or 3:2) for wide products
- `'tall'` (3:4) for very vertical products
- Dynamic aspect ratios based on product category
- Admin panel configuration for real-time switching