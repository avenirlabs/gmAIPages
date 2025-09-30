# Admin Menu Schema Documentation

This document describes the database schema for the admin menu system, including field definitions, hierarchy rules, and usage patterns.

## Table Overview

The admin menu system consists of two main tables:
- `public.navigation_items` - Main menu structure with hierarchical organization
- `public.admin_users` - Email-based admin authentication

## Field Glossary

### navigation_items Table

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | uuid | Primary key, auto-generated | NOT NULL, PRIMARY KEY |
| `parent_id` | uuid | Reference to parent menu item | FOREIGN KEY → navigation_items(id) |
| `type` | menu_item_type | Item type: 'column', 'group', or 'link' | NOT NULL, ENUM |
| `label` | text | Display text for menu item | NOT NULL |
| `href` | text | URL for navigation (links only) | NULL allowed, validated |
| `order` | int | Sort order within parent | NOT NULL, DEFAULT 0 |
| `icon` | text | Icon identifier (links only) | NULL allowed |
| `badge_text` | text | Badge/notification text (links only) | NULL allowed |
| `hidden_on` | text[] | Hide on platforms: ['mobile', 'desktop'] | DEFAULT '{}' |
| `external` | boolean | External link flag (links only) | DEFAULT false |
| `open_new_tab` | boolean | Open in new tab (links only) | DEFAULT false |
| `tracking_tag` | text | Analytics tracking identifier | NULL allowed |
| `is_active` | boolean | Enable/disable item | DEFAULT true |
| `updated_by` | uuid | Last editor's user ID | NULL allowed |
| `updated_at` | timestamptz | Last modification timestamp | AUTO-UPDATED |

### admin_users Table

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `email` | text | Admin user email address | PRIMARY KEY |

## Hierarchy Rules

The menu system enforces a strict three-level hierarchy:

### Type Relationships

1. **Column** (`type='column'`)
   - **Parent**: Must be `NULL` (top-level items)
   - **Children**: Can contain `group` or `link` items
   - **Purpose**: Major navigation sections (e.g., "Products", "Support")

2. **Group** (`type='group'`)
   - **Parent**: Must be a `column` type
   - **Children**: Can contain `link` items only
   - **Purpose**: Sub-categories within columns (e.g., "Electronics", "Clothing")

3. **Link** (`type='link'`)
   - **Parent**: Must be `column` or `group` type
   - **Children**: Cannot have children
   - **Purpose**: Actual navigation links with URLs

### Field Access Rules

Only `type='link'` items may have:
- Non-null `href`
- Non-null `icon`
- Non-null `badge_text`
- `external = true`
- `open_new_tab = true`

## Security Constraints

### URL Validation
- Prevents `javascript:` URLs
- Prevents `data:` URLs
- Allows relative and absolute HTTP/HTTPS URLs

### Platform Visibility
- `hidden_on` array must contain only: `'mobile'` and/or `'desktop'`
- Empty array means visible on all platforms

## RLS Policy Summary

### Public Access
- **SELECT**: Anonymous users can view only `is_active = true` items
- **INSERT/UPDATE/DELETE**: Denied for anonymous users

### Admin Access
- **All Operations**: Allowed only when `auth.jwt()->>'email'` exists in `admin_users`
- **Helper Function**: `public.is_admin()` validates JWT email against admin table

### Policy Details

| Policy Name | Table | Operation | Condition |
|-------------|-------|-----------|-----------|
| `select_public_menu` | navigation_items | SELECT | `is_active = true` (public) |
| `insert_admin` | navigation_items | INSERT | `public.is_admin()` |
| `update_admin` | navigation_items | UPDATE | `public.is_admin()` |
| `delete_admin` | navigation_items | DELETE | `public.is_admin()` |
| `select_admin_users` | admin_users | SELECT | `public.is_admin()` |
| `insert_admin_users` | admin_users | INSERT | `public.is_admin()` |
| `update_admin_users` | admin_users | UPDATE | `public.is_admin()` |
| `delete_admin_users` | admin_users | DELETE | `public.is_admin()` |

## Database Indexes

### Performance Optimizations

```sql
-- Parent-child relationship queries
CREATE INDEX idx_navigation_items_parent_id ON navigation_items(parent_id);

-- Ordered listing within parent groups
CREATE INDEX idx_navigation_items_order_parent ON navigation_items("order", parent_id);

-- Type-based filtering with parent relationships
CREATE INDEX idx_navigation_items_type_parent ON navigation_items(type, parent_id);
```

## Example Queries

### Fetch Complete Menu Tree
```sql
-- Get all active navigation items ordered hierarchically
WITH RECURSIVE menu_tree AS (
  -- Root level (columns)
  SELECT id, parent_id, type, label, href, "order", 0 as level
  FROM public.navigation_items_public
  WHERE parent_id IS NULL

  UNION ALL

  -- Recursive children
  SELECT n.id, n.parent_id, n.type, n.label, n.href, n."order", mt.level + 1
  FROM public.navigation_items_public n
  JOIN menu_tree mt ON n.parent_id = mt.id
)
SELECT * FROM menu_tree
ORDER BY level, "order", label;
```

### Get Children of Specific Parent
```sql
-- Example: Get all groups under a column
SELECT id, label, type, "order"
FROM public.navigation_items_public
WHERE parent_id = '<column-uuid>'
  AND type = 'group'
ORDER BY "order", label;
```

### Find Navigation Path
```sql
-- Get breadcrumb path for a specific item
WITH RECURSIVE nav_path AS (
  -- Start with target item
  SELECT id, parent_id, label, href, 0 as depth
  FROM public.navigation_items_public
  WHERE id = '<target-item-uuid>'

  UNION ALL

  -- Walk up to parents
  SELECT n.id, n.parent_id, n.label, n.href, np.depth + 1
  FROM public.navigation_items_public n
  JOIN nav_path np ON n.id = np.parent_id
)
SELECT * FROM nav_path
ORDER BY depth DESC;
```

### Admin Operations
```sql
-- Add new admin user (requires existing admin)
INSERT INTO public.admin_users(email)
VALUES ('new-admin@example.com');

-- Create top-level column
INSERT INTO public.navigation_items(type, label, "order")
VALUES ('column', 'Products', 10);

-- Add group under column
INSERT INTO public.navigation_items(parent_id, type, label, "order")
VALUES ('<column-uuid>', 'group', 'Electronics', 1);

-- Add link under group
INSERT INTO public.navigation_items(
  parent_id, type, label, href, icon, "order"
)
VALUES (
  '<group-uuid>',
  'link',
  'Smartphones',
  '/products/smartphones',
  'smartphone',
  1
);
```

## Common Patterns

### Mobile-Only Links
```sql
-- Create link visible only on mobile
INSERT INTO public.navigation_items(
  parent_id, type, label, href, hidden_on
)
VALUES (
  '<parent-uuid>',
  'link',
  'Mobile App',
  '/mobile-app',
  ARRAY['desktop']::text[]
);
```

### External Links
```sql
-- Create external link that opens in new tab
INSERT INTO public.navigation_items(
  parent_id, type, label, href, external, open_new_tab
)
VALUES (
  '<parent-uuid>',
  'link',
  'Support Portal',
  'https://support.example.com',
  true,
  true
);
```

### Temporary Disabling
```sql
-- Temporarily hide navigation item
UPDATE public.navigation_items
SET is_active = false
WHERE id = '<item-uuid>';
```

## Migration Notes

### Initial Setup
1. Run the migration: `sql/migrations/2025-09-30_admin_menu.sql`
2. Add first admin: `INSERT INTO admin_users(email) VALUES ('<your-email>');`
3. Verify RLS: Test access with and without admin JWT
4. Create initial menu structure using admin account

### Data Validation
All constraints are enforced at the database level:
- Hierarchy validation via triggers
- Type-specific field restrictions via check constraints
- URL safety via pattern matching
- Platform visibility via array validation

## Troubleshooting

### Common Errors

**"Groups must have a parent of type column"**
- Ensure `parent_id` points to an item with `type='column'`

**"Links must have a parent of type column or group"**
- Verify parent exists and has correct type

**"check_href_safe" constraint violation**
- Remove `javascript:` or `data:` from href field

**RLS Policy Violations**
- Verify admin email exists in `admin_users` table
- Check JWT contains correct email claim