# Navigation System

This document describes the hierarchical navigation system that supports parent-child relationships for dropdown menus and mobile accordions.

## Database Schema

The navigation system uses the `nav_links` table in Supabase with the following structure:

### Table: nav_links

```sql
-- Migration to add hierarchical navigation support
ALTER TABLE nav_links ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid() PRIMARY KEY;
ALTER TABLE nav_links ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES nav_links(id) ON DELETE SET NULL;
ALTER TABLE nav_links ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE nav_links ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;
ALTER TABLE nav_links ADD COLUMN IF NOT EXISTS is_mega BOOLEAN DEFAULT false;

-- Create index for faster parent-child queries
CREATE INDEX IF NOT EXISTS idx_nav_links_parent_id ON nav_links(parent_id);
CREATE INDEX IF NOT EXISTS idx_nav_links_sort_order ON nav_links(sort_order);
```

### Column Definitions

- `id` (uuid, primary key): Unique identifier for each navigation item
- `label` (text): Display text for the navigation item
- `href` (text, nullable): URL for the navigation item (null for parent-only items)
- `parent_id` (uuid, nullable): Foreign key to parent nav item (null for top-level items)
- `sort_order` (integer): Controls display order (ascending)
- `is_visible` (boolean): Whether item appears in navigation (default: true)
- `is_mega` (boolean): Reserved for future mega menu functionality (default: false)
- `position` (integer): Legacy field, replaced by sort_order

## Managing Navigation in Supabase

### Adding a Top-Level Item

1. Go to Supabase → Table Editor → nav_links
2. Insert new row:
   - `label`: "Products"
   - `href`: "/products"
   - `parent_id`: null
   - `sort_order`: 10
   - `is_visible`: true

### Adding Child Items

1. Create child items with parent_id pointing to the parent:
   - `label`: "Electronics"
   - `href`: "/products/electronics"
   - `parent_id`: [parent-item-id]
   - `sort_order`: 1

### Creating Parent-Only Dropdowns

For parents that don't have their own page:
- `label`: "Categories"
- `href`: null
- `parent_id`: null
- `sort_order`: 20

## API Response Format

The `/api/nav/links` endpoint returns a nested tree structure:

```typescript
interface NavLink {
  id: string;
  label: string;
  href?: string;
  children?: NavLink[];
  isMega?: boolean;
}

interface NavResponse {
  items: NavLink[];
}
```

### Example Response

```json
{
  "items": [
    {
      "id": "uuid-1",
      "label": "Home",
      "href": "/"
    },
    {
      "id": "uuid-2",
      "label": "Products",
      "href": "/products",
      "children": [
        {
          "id": "uuid-3",
          "label": "Electronics",
          "href": "/products/electronics"
        },
        {
          "id": "uuid-4",
          "label": "Home & Garden",
          "href": "/products/home-garden"
        }
      ]
    },
    {
      "id": "uuid-5",
      "label": "Categories",
      "children": [
        {
          "id": "uuid-6",
          "label": "Tech Gifts",
          "href": "/categories/tech"
        }
      ]
    }
  ]
}
```

## UI Behavior

### Desktop
- Parent items with children show dropdown on hover/click
- Clicking parent with href navigates to parent page
- Clicking child navigates to child page
- Clicking parent without href only toggles dropdown

### Mobile
- Parent items with children render as accordions
- Tap to expand/collapse child items
- Swipe navigation preserved

### Accessibility
- Proper ARIA attributes (`aria-expanded`, `aria-haspopup="menu"`)
- Keyboard navigation (Arrow keys, Tab, Escape)
- Screen reader announcements for state changes
- Focus management in dropdowns

## Backward Compatibility

The system maintains compatibility with existing flat navigation:
- If no items have `parent_id` set, renders as flat list
- Legacy `position` field maps to `sort_order`
- Existing API contracts preserved

## Future Enhancements

- `is_mega` flag reserved for mega menu layouts
- Support for icons and descriptions
- Multi-level nesting (grandchildren)
- Conditional visibility based on user roles