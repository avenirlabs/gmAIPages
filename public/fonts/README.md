# Font Files Directory

This directory is reserved for self-hosted font files to optimize loading performance with `font-display: swap`.

## TODO: Add Custom Fonts

Currently using system font stack. When ready to add custom fonts:

1. **Recommended fonts**: Inter, System UI, or similar clean sans-serif
2. **File format**: WOFF2 for optimal compression and browser support
3. **Variable fonts**: Preferred for weight flexibility (300-800)
4. **Naming convention**: `AppFont-Variable.woff2` or similar

## Implementation Status

- ✅ Font-display: swap configured for performance
- ✅ System font fallback stack optimized
- ⏳ Custom font files (add when ready)
- ✅ CSS variables configured in globals.css

## Performance Notes

- `font-display: swap` ensures text remains visible during font load
- System fonts provide excellent fallback with zero load time
- WOFF2 format provides ~30% better compression than WOFF