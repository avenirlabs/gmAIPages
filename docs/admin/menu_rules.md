# Navigation Menu Hierarchy Rules

This document provides a concise reference for the navigation_items hierarchy rules, validation constraints, and form behaviors.

## Quick Reference Table

| Type | Parent Required? | Valid Parent Types | Can Be Root? | Link Fields? |
|------|-----------------|-------------------|--------------|--------------|
| **Column** | ❌ No | None (always root) | ✅ Yes (always) | ❌ No |
| **Group** | ✅ Yes | Column only | ❌ No | ❌ No |
| **Link** | ❌ No | Column, Group, or none | ✅ Yes (optional) | ✅ Yes |

## Detailed Rules

### Column Type

**Purpose**: Top-level navigation sections (major categories)

**Parent Rules**:
- `parent_id` **MUST** be `NULL`
- Cannot have a parent (always root-level)
- Enforced by trigger validation

**Children**:
- Can have **Groups** as children
- Can have **Links** as children

**Link Fields**:
- `href`, `icon`, `badge_text`: Must be NULL
- `external`, `open_new_tab`: Must be FALSE
- Enforced by database constraint

**Examples**:
- "Products"
- "Support"
- "About"
- "Contact"

---

### Group Type

**Purpose**: Sub-categories within columns

**Parent Rules**:
- `parent_id` **REQUIRED**
- Parent **MUST** be a Column
- Cannot be root-level
- Enforced by trigger validation

**Children**:
- Can have **Links** as children only
- Cannot have Groups as children

**Link Fields**:
- `href`, `icon`, `badge_text`: Must be NULL
- `external`, `open_new_tab`: Must be FALSE
- Enforced by database constraint

**Examples**:
- "Electronics" (under Products column)
- "Clothing" (under Products column)
- "Documentation" (under Support column)

---

### Link Type

**Purpose**: Actual navigable items with URLs

**Parent Rules**:
- `parent_id` **OPTIONAL**
- Can be `NULL` for root-level (top nav)
- If set, parent **MUST** be Column or Group
- Enforced by trigger validation

**Children**:
- **Cannot have children** (leaf nodes only)

**Link Fields** (all optional except href):
- `href`: **REQUIRED**, non-empty
- `icon`: Optional icon identifier
- `badge_text`: Optional badge label
- `external`: Boolean flag for external URLs
- `open_new_tab`: Boolean flag for target="_blank"
- `tracking_tag`: Internal analytics identifier

**URL Validation**:
- No `javascript:` URLs (security)
- No `data:` URLs (security)
- Enforced by constraint and client validation

**Examples**:
- Root-level: "Home" → `/`
- Under Column: "All Products" → `/products`
- Under Group: "Smartphones" → `/products/smartphones`

---

## Hierarchy Patterns

### Pattern 1: Flat Navigation (Root Links Only)

```
Link: Home (/)
Link: Products (/products)
Link: About (/about)
Link: Contact (/contact)
```

**Use Case**: Simple websites with few pages

---

### Pattern 2: Columnar Navigation

```
Column: Products
├── Link: All Products (/products)
├── Link: New Arrivals (/products/new)
└── Link: Sale (/products/sale)

Column: Support
├── Link: Help Center (/help)
└── Link: Contact (/contact)
```

**Use Case**: Multiple sections with direct links

---

### Pattern 3: Nested Navigation (Full Hierarchy)

```
Column: Products
├── Group: Electronics
│   ├── Link: Smartphones (/products/smartphones)
│   ├── Link: Laptops (/products/laptops)
│   └── Link: Headphones (/products/headphones)
├── Group: Clothing
│   ├── Link: Shirts (/products/shirts)
│   └── Link: Pants (/products/pants)
└── Link: All Products (/products)

Column: Support
├── Link: Help Center (https://help.example.com) [external]
└── Link: Contact (/contact)

Link: Home (/) [root-level]
```

**Use Case**: Complex sites with categorized navigation

---

## Admin Form Behavior

### Column Form

**Parent Selector**:
- Shows: Info message "Columns are top-level items (no parent)"
- Field: Disabled/hidden
- Value: Always `NULL`

**Link Fields**:
- Hidden (not applicable)

---

### Group Form

**Parent Selector**:
- Shows: Dropdown with Column items only
- Options: All active Columns
- Required: Yes
- Help text: "Groups must have a Column parent (required)"

**Link Fields**:
- Hidden (not applicable)

---

### Link Form

**Parent Selector**:
- Shows: Dropdown with special "No parent (top nav)" option
- Options:
  1. **"No parent (top nav)"** (value: `''` → `null`)
  2. All active Columns
  3. All active Groups
- Required: No (can be root-level)
- Help text: "Links can be root-level (top nav) or nested under Column/Group"

**Link Fields**:
- Visible: Yes
- href: **Required**
- All others: Optional

---

## Validation Matrix

### Client-Side Validation

| Rule | Column | Group | Link |
|------|--------|-------|------|
| Label required | ✅ | ✅ | ✅ |
| Parent required | ❌ | ✅ | ❌ |
| Parent must be Column | N/A | ✅ | ❌* |
| href required | ❌ | ❌ | ✅ |
| No `javascript:` URLs | N/A | N/A | ✅ |
| No `data:` URLs | N/A | N/A | ✅ |
| Order must be numeric | ✅ | ✅ | ✅ |

*If parent is set, must be Column or Group

### Database Trigger Validation

```sql
-- Columns: parent_id must be NULL
IF NEW.type = 'column' AND NEW.parent_id IS NOT NULL THEN
    RAISE EXCEPTION 'Columns must be root-level items (no parent)';
END IF;

-- Groups: parent_id required and must be Column
IF NEW.type = 'group' THEN
    IF NEW.parent_id IS NULL THEN
        RAISE EXCEPTION 'Groups must have a parent Column';
    END IF;
    -- Check parent is Column type
END IF;

-- Links: if parent_id set, must be Column or Group
IF NEW.type = 'link' AND NEW.parent_id IS NOT NULL THEN
    -- Check parent is Column or Group type
END IF;
```

### Database Constraint Validation

```sql
-- Link-only fields must be NULL for non-link types
ALTER TABLE navigation_items ADD CONSTRAINT chk_link_fields
CHECK (
    (type = 'link') OR
    (href IS NULL AND icon IS NULL AND badge_text IS NULL
     AND external = false AND open_new_tab = false)
);

-- href safety (no javascript: or data: URLs)
ALTER TABLE navigation_items ADD CONSTRAINT chk_href_safe
CHECK (
    href IS NULL OR
    (href NOT ILIKE 'javascript:%' AND href NOT ILIKE 'data:%')
);
```

---

## Error Messages

### Validation Errors

| Scenario | Error Message |
|----------|---------------|
| Empty label | "Label is required" |
| Group without parent | "Groups must be under a Column" |
| Link with invalid href | "URL is required for links" |
| `javascript:` URL | "javascript: and data: URLs are not allowed for security" |
| Invalid order | "Order must be a number" |

### Database Trigger Errors

| Scenario | Error Message |
|----------|---------------|
| Column with parent | "Columns must be root-level items (no parent)" |
| Group without parent | "Groups must have a parent Column" |
| Group with non-Column parent | "Groups must have a parent of type Column" |
| Link with invalid parent | "Links must have a parent of type Column or Group (or no parent for root-level)" |

---

## Common Scenarios

### Creating a Root-Level Link

1. Click "New Item"
2. Type: Select **Link**
3. Label: Enter label (e.g., "Home")
4. Parent: Select **"No parent (top nav)"**
5. href: Enter URL (e.g., `/`)
6. Save

**Result**: Link appears at root level (parent_id = NULL)

---

### Creating a Nested Link

1. Click "New Item"
2. Type: Select **Link**
3. Label: Enter label (e.g., "Smartphones")
4. Parent: Select a Column or Group (e.g., "Electronics")
5. href: Enter URL (e.g., `/products/smartphones`)
6. Save

**Result**: Link appears under selected parent

---

### Moving a Link to Root Level

1. Find and edit the link
2. Parent: Select **"No parent (top nav)"**
3. Save

**Result**: Link becomes root-level (parent_id changes to NULL)

---

### Moving a Root Link Under a Parent

1. Find and edit the root-level link
2. Parent: Select a Column or Group
3. Save

**Result**: Link moves under selected parent

---

## Migration Notes

### Upgrading from v1

If you have existing menu items created before this update:

**No Action Needed**:
- Existing Columns: Already root-level (parent_id = NULL) ✅
- Existing Groups: Already under Columns ✅
- Existing Links: Already under Columns/Groups ✅

**New Capability**:
- You can now create Links at root level
- Existing Links can be moved to root level

**SQL to Check Hierarchy**:
```sql
-- Count items by type and parent status
SELECT
    type,
    CASE WHEN parent_id IS NULL THEN 'root' ELSE 'nested' END as level,
    COUNT(*) as count
FROM public.navigation_items
GROUP BY type, level
ORDER BY type, level;
```

---

## Related Documentation

- [Menu Editor Guide](./menu_editor.md) - Complete UI usage guide
- [Menu Schema](./menu_schema.md) - Database schema reference
- [Menu API](./menu_api.md) - Public API documentation

---

## Changelog

**2025-09-30**: Updated for root-level links (Task #MM-005)
- Links can now have `parent_id = NULL` for root-level placement
- Replaced invalid CHECK constraints with trigger validation
- Updated admin form to show "No parent (top nav)" option for links