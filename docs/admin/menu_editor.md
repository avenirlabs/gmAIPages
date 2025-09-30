# Admin Menu Editor Guide

This guide explains how to use the Admin Menu Editor to manage navigation menu items with full CRUD functionality, type-aware validation, and hierarchy guardrails.

## Table of Contents

1. [Accessing the Editor](#accessing-the-editor)
2. [UI Overview](#ui-overview)
3. [Creating Menu Items](#creating-menu-items)
4. [Editing Menu Items](#editing-menu-items)
5. [Deleting Menu Items](#deleting-menu-items)
6. [Field Reference](#field-reference)
7. [Hierarchy Rules](#hierarchy-rules)
8. [Validation Rules](#validation-rules)
9. [Common Workflows](#common-workflows)
10. [Troubleshooting](#troubleshooting)

---

## Accessing the Editor

### From Admin Dashboard

1. Navigate to `/admin` and log in with your Supabase credentials
2. Click the **"Menu (New)"** tab in the header
3. Click **"Open Menu Editor"** button
4. You'll be redirected to `/admin/menu`

### Direct Access

Navigate directly to: `https://your-domain.com/admin/menu`

**Note**: You must be logged in to Supabase and have your email in the `admin_users` table to create, edit, or delete items.

---

## UI Overview

### Header Section

- **Title**: "Menu Administration"
- **Description**: Brief explanation of the page purpose
- **Back to Admin**: Button to return to main admin dashboard

### Controls Row

**Type Filter Chips**:
- **All**: Show all menu items (default)
- **Columns**: Show only top-level columns
- **Groups**: Show only sub-category groups
- **Links**: Show only navigation links

**New Item Button**: Opens the create dialog

**Search Input**: Filter items by label in real-time

**Stats Display**: Shows total items and filtered count
- Example: "Total: 45 • Showing: 12"

### Data Table

The table displays all menu items with the following columns:

| Column | Description |
|--------|-------------|
| **Type** | Color-coded badge: Column (blue), Group (gray), Link (outline) |
| **Label** | Display name of the menu item |
| **Parent** | Parent item label, or "—" for top-level items |
| **Order** | Numeric sort position (ascending) |
| **Hidden On** | Platform badges (mobile/desktop) if item is hidden |
| **Link Details** | For links: URL, external indicator, icon, badge, new tab flag |
| **Status** | Active (eye icon) or Inactive (eye-off icon) |
| **Actions** | Edit (pencil) and Delete (trash) buttons |

### Footer Help

Links to documentation:
- **Menu Schema Documentation**: Field definitions and constraints
- **Menu Editor Guide**: This document

---

## Creating Menu Items

### Step 1: Open Create Dialog

Click the **"New Item"** button in the controls row.

### Step 2: Select Item Type

Choose one of three types:

1. **Column (Top-level)**: Major navigation sections (e.g., "Products", "Support")
2. **Group (Sub-category)**: Categories within columns (e.g., "Electronics", "Clothing")
3. **Link (Navigation item)**: Actual clickable links

### Step 3: Fill in Common Fields

**Required Fields**:
- **Label**: Display text for the menu item
- **Parent**: (Required for Groups and Links, disabled for Columns)
- **Order**: Numeric position for sorting (default: 0)

**Optional Fields**:
- **Hide On Platforms**: Check mobile and/or desktop to hide item
- **Active**: Toggle to show/hide in public menu (default: ON)

### Step 4: Fill in Link-Only Fields (if type=Link)

**Required**:
- **URL (href)**: Navigation path (e.g., `/products/smartphones`)

**Optional**:
- **Icon**: Icon identifier (e.g., `smartphone`, `laptop`)
- **Badge Text**: Short label like "New", "Hot", or a number
- **External Link**: Toggle if URL points to external site
- **Open in New Tab**: Toggle to open link in new tab
- **Tracking Tag**: Internal analytics identifier (not shown to users)

### Step 5: Save

Click **"Create"** button. You'll see a success toast or error message.

**Success**: `"Item Created: Successfully created "{label}"`

**Errors**: See [Validation Rules](#validation-rules) section

---

## Editing Menu Items

### Step 1: Find the Item

Use type filters or search to locate the item you want to edit.

### Step 2: Click Edit Button

Click the **pencil icon** in the Actions column.

### Step 3: Modify Fields

The form pre-fills with current values. Make your changes.

**Note**: Changing the `type` field will:
- Update available parent options dynamically
- Show/hide link-only fields
- Clear invalid parent selections

### Step 4: Save Changes

Click **"Update"** button.

**Success**: `"Item Updated: Successfully updated "{label}"`

---

## Deleting Menu Items

### Step 1: Click Delete Button

Click the **trash icon** in the Actions column.

### Step 2: Confirm Deletion

A confirmation dialog appears:

> **Delete Menu Item?**
>
> This will remove **{label}** and all its children (if any). This action cannot be undone.

**Options**:
- **Cancel**: Close dialog without deleting
- **Delete**: Permanently remove item and children

### Step 3: Deletion Completes

**Success**: `"Item Deleted: Successfully deleted "{label}"`

**Note**: Child items are automatically deleted due to database cascade rules.

---

## Field Reference

### Common Fields (All Types)

#### Type
- **Options**: Column, Group, Link
- **Required**: Yes
- **Description**: Determines item's role in navigation hierarchy

#### Label
- **Type**: Text
- **Required**: Yes
- **Description**: Display text shown in navigation menu
- **Example**: "Products", "Electronics", "Smartphones"

#### Parent
- **Type**: Dropdown selection
- **Required**:
  - No (for Columns)
  - Yes (for Groups and Links)
- **Description**: Parent item this belongs under
- **Validation**: Type-aware filtering (see [Hierarchy Rules](#hierarchy-rules))

#### Order
- **Type**: Number
- **Required**: No (defaults to 0)
- **Description**: Sort position within parent (ascending)
- **Example**: 0, 10, 20 (use increments of 10 for easy reordering)

#### Hide On Platforms
- **Type**: Checkboxes (mobile, desktop)
- **Required**: No
- **Description**: Platforms where item should be hidden
- **Use Case**: Show mobile-only or desktop-only items

#### Active
- **Type**: Toggle switch
- **Required**: No (defaults to ON)
- **Description**: Whether item appears in public menu
- **Use Case**: Temporarily hide items without deleting

### Link-Only Fields

#### URL (href)
- **Type**: Text
- **Required**: Yes (for links)
- **Description**: Navigation path or external URL
- **Examples**:
  - Relative: `/products/smartphones`
  - External: `https://support.example.com`
- **Validation**: No `javascript:` or `data:` URLs allowed

#### Icon
- **Type**: Text
- **Required**: No
- **Description**: Icon identifier for visual display
- **Examples**: `smartphone`, `laptop`, `heart`, `star`

#### Badge Text
- **Type**: Text
- **Required**: No
- **Description**: Small label shown next to link
- **Examples**: "New", "Hot", "5", "Beta"

#### External Link
- **Type**: Toggle switch
- **Required**: No (defaults to OFF)
- **Description**: Marks link as pointing to external site
- **Use Case**: Different icon, analytics tracking

#### Open in New Tab
- **Type**: Toggle switch
- **Required**: No (defaults to OFF)
- **Description**: Adds `target="_blank"` to link
- **Use Case**: External sites, documentation

#### Tracking Tag
- **Type**: Text
- **Required**: No
- **Description**: Internal analytics identifier
- **Note**: Not visible to users, for admin/analytics use only

---

## Hierarchy Rules

The navigation system enforces a strict three-level hierarchy:

### Level 1: Columns (Top-Level)

**Rules**:
- **Parent**: Must be `null` (no parent)
- **Children**: Can have Groups or Links
- **Use Case**: Major navigation sections

**Example Columns**:
- Products
- Support
- About
- Contact

### Level 2: Groups (Sub-Categories)

**Rules**:
- **Parent**: Must be a Column
- **Children**: Can have Links only
- **Use Case**: Categories within main sections

**Example Groups** (under "Products" column):
- Electronics
- Clothing
- Home & Garden

### Level 3: Links (Navigation Items)

**Rules**:
- **Parent**: Must be a Column or Group
- **Children**: Cannot have children
- **Use Case**: Actual clickable navigation links

**Example Links** (under "Electronics" group):
- Smartphones → `/products/smartphones`
- Laptops → `/products/laptops`
- Headphones → `/products/headphones`

### Visual Hierarchy Example

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
├── Link: Help Center (https://help.example.com)
└── Link: Contact Us (/contact)
```

---

## Validation Rules

### Client-Side Validation

All validations occur before submission to prevent database errors.

#### Label Validation
- **Rule**: Must not be empty
- **Error**: "Label is required"

#### Parent Validation (Groups)
- **Rule**: Must have a Column parent
- **Error**: "Groups must have a Column parent"

#### Parent Validation (Links)
- **Rule**: Must have a Column or Group parent
- **Error**: "Links must have a Column or Group parent"

#### href Validation (Links)
- **Rule 1**: Must not be empty
- **Error**: "Link URL (href) is required for link items"
- **Rule 2**: No `javascript:` URLs
- **Rule 3**: No `data:` URLs
- **Error**: "javascript: and data: URLs are not allowed for security"

#### Order Validation
- **Rule**: Must be a valid number
- **Error**: "Order must be a number"

#### hidden_on Validation
- **Rule**: Array must only contain 'mobile' and/or 'desktop'
- **Enforcement**: Checkboxes prevent invalid values

### Server-Side Validation (Database)

Additional constraints enforced by Supabase:

- Type-specific field restrictions (trigger function)
- URL safety checks (constraint)
- Parent-child type validation (trigger function)
- Foreign key integrity (cascade delete)

### Permission Validation

**RLS (Row Level Security)**:
- Public users: Can SELECT where `is_active=true`
- Admin users: Can INSERT/UPDATE/DELETE (requires email in `admin_users`)

**Permission Error**:
```
"You're signed in but don't have permission to edit menu items.
Ask an admin to add your email to admin_users."
```

**Solution**: Contact a super admin to run:
```sql
INSERT INTO public.admin_users(email) VALUES ('your-email@example.com');
```

---

## Common Workflows

### Workflow 1: Create a Basic Menu

**Goal**: Build a simple two-column menu with links

**Steps**:

1. **Create Columns**:
   ```
   Type: Column
   Label: "Products"
   Parent: (disabled)
   Order: 10
   ```

   ```
   Type: Column
   Label: "Support"
   Parent: (disabled)
   Order: 20
   ```

2. **Create Links** under Products:
   ```
   Type: Link
   Label: "All Products"
   Parent: Products
   href: "/products"
   Order: 10
   ```

   ```
   Type: Link
   Label: "New Arrivals"
   Parent: Products
   href: "/products/new"
   Order: 20
   ```

3. **Create Links** under Support:
   ```
   Type: Link
   Label: "Help Center"
   Parent: Support
   href: "https://help.example.com"
   External: ON
   Open in New Tab: ON
   Order: 10
   ```

**Result**: Two-column menu with direct links

---

### Workflow 2: Create a Nested Menu with Groups

**Goal**: Build a menu with sub-categories

**Steps**:

1. **Create Column**:
   ```
   Type: Column
   Label: "Products"
   Order: 10
   ```

2. **Create Groups** under Column:
   ```
   Type: Group
   Label: "Electronics"
   Parent: Products
   Order: 10
   ```

   ```
   Type: Group
   Label: "Clothing"
   Parent: Products
   Order: 20
   ```

3. **Create Links** under Electronics:
   ```
   Type: Link
   Label: "Smartphones"
   Parent: Electronics
   href: "/products/smartphones"
   Icon: "smartphone"
   Order: 10
   ```

   ```
   Type: Link
   Label: "Laptops"
   Parent: Electronics
   href: "/products/laptops"
   Icon: "laptop"
   Order: 20
   ```

4. **Create Links** under Clothing:
   ```
   Type: Link
   Label: "Shirts"
   Parent: Clothing
   href: "/products/shirts"
   Order: 10
   ```

**Result**: Nested menu with grouped items

---

### Workflow 3: Temporarily Hide Items

**Goal**: Hide menu items without deleting them

**Steps**:

1. **Find the item** using search or filters
2. **Click Edit** (pencil icon)
3. **Toggle "Active" switch** to OFF
4. **Click "Update"**

**Result**: Item hidden from public menu but still in database

**Use Case**: Seasonal items, maintenance, A/B testing

---

### Workflow 4: Reorder Menu Items

**Goal**: Change the display order of items

**Steps**:

1. **Decide on numbering** (e.g., 10, 20, 30)
2. **Edit each item** and update the "Order" field
3. **Save changes**

**Tip**: Use increments of 10 to leave room for future insertions

**Example**:
```
Order 10: First Item
Order 20: Second Item
Order 25: New Item (inserted between)
Order 30: Third Item
```

---

### Workflow 5: Create Mobile-Only Item

**Goal**: Show item only on mobile devices

**Steps**:

1. **Create or edit** the menu item
2. **Check "Desktop"** in "Hide On Platforms"
3. **Leave "Mobile" unchecked**
4. **Save**

**Result**: Item visible on mobile, hidden on desktop

---

## Troubleshooting

### Problem: "You're signed in but don't have permission..."

**Cause**: Your email is not in the `admin_users` table

**Solution**:
1. Ask a super admin to add your email:
   ```sql
   INSERT INTO public.admin_users(email) VALUES ('your-email@example.com');
   ```
2. Log out and log back in
3. Try the operation again

---

### Problem: Can't select parent for Group

**Cause**: No Columns exist in the database

**Solution**:
1. Create a Column first
2. Then create the Group with that Column as parent

---

### Problem: Can't save Link without href

**Cause**: href field is required for Link type

**Solution**:
1. Enter a valid URL in the "URL (href)" field
2. Use relative paths (e.g., `/products`) or full URLs (e.g., `https://example.com`)

---

### Problem: "javascript: and data: URLs are not allowed"

**Cause**: Security validation prevents XSS attacks

**Solution**:
1. Use standard HTTP/HTTPS URLs
2. Use relative paths for internal links
3. Remove `javascript:` or `data:` schemes

**Valid Examples**:
- `/products/smartphones` ✓
- `https://external.com` ✓
- `#section` ✓

**Invalid Examples**:
- `javascript:alert('xss')` ✗
- `data:text/html,<script>alert()</script>` ✗

---

### Problem: Item not appearing in public menu

**Possible Causes**:

1. **Item is inactive**
   - Solution: Edit item, toggle "Active" to ON

2. **Item is hidden on current platform**
   - Solution: Edit item, uncheck "Mobile" or "Desktop" in "Hide On Platforms"

3. **Parent is inactive**
   - Solution: Make sure all parent items are active

4. **Cache not cleared**
   - Solution: Wait for cache to expire (1 hour) or trigger webhook revalidation

---

### Problem: Delete button doesn't work

**Cause**: RLS permission error

**Solution**: Same as "permission denied" - check admin_users table

---

### Problem: Parent selector is empty

**Cause**: No valid parent items exist

**Solution**:
1. For Groups: Create at least one Column first
2. For Links: Create at least one Column or Group first

---

## Known Limitations (v1)

This is version 1 of the menu editor. The following features are planned for future releases:

1. **No Drag & Drop**: Must manually edit "Order" numbers
2. **No Bulk Operations**: Edit/delete one item at a time
3. **No Live Preview**: Can't see rendered menu while editing
4. **No Undo**: Deletions are permanent
5. **No Import/Export**: No JSON/CSV import/export
6. **Basic Search**: Simple label substring search only
7. **No Pagination**: All items loaded at once (fine for <1000 items)

**Next**: v2 will include drag-and-drop ordering and live preview. See [roadmap](../roadmap.md) for details.

---

## Related Documentation

- [Menu Schema](./menu_schema.md) - Database schema and field definitions
- [Menu API](./menu_api.md) - Public API endpoint documentation
- [Navigation System](../navigation.md) - Overall navigation architecture
- [Task Board](../task_board.md) - Implementation details (Task #MM-004)

---

## Quick Reference Card

### Menu Hierarchy

```
Column (no parent)
├── Group (parent: Column)
│   └── Link (parent: Group)
└── Link (parent: Column)
```

### Required Fields by Type

| Type | Label | Parent | href |
|------|-------|--------|------|
| Column | ✓ | — | — |
| Group | ✓ | ✓ | — |
| Link | ✓ | ✓ | ✓ |

### Common Order Values

- Top priority: 0-9
- High priority: 10-19
- Normal: 20-89
- Low priority: 90-99
- Hidden/footer: 100+

### Platform Visibility

| hidden_on | Mobile | Desktop |
|-----------|--------|---------|
| [] | ✓ | ✓ |
| ["mobile"] | ✗ | ✓ |
| ["desktop"] | ✓ | ✗ |
| ["mobile", "desktop"] | ✗ | ✗ |

---

## Changelog

**2025-09-30**: Initial v1 release
- Full CRUD operations
- Type-aware validation
- Hierarchy guardrails
- RLS error handling