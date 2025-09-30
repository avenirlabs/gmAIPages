-- Admin Menu Schema Migration
-- Created: 2025-09-30
-- Description: Creates navigation_items table with hierarchical menu support,
--              admin_users table, and RLS policies for secure admin management

-- ============================================================================
-- 1. Create Enum for Menu Item Types
-- ============================================================================

CREATE TYPE menu_item_type AS ENUM ('column', 'group', 'link');

-- ============================================================================
-- 2. Create Admin Users Table
-- ============================================================================

CREATE TABLE public.admin_users (
    email text PRIMARY KEY
);

-- ============================================================================
-- 3. Create Navigation Items Table
-- ============================================================================

CREATE TABLE public.navigation_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id uuid NULL REFERENCES public.navigation_items(id) ON DELETE CASCADE,
    type menu_item_type NOT NULL,
    label text NOT NULL,
    href text NULL,
    "order" int NOT NULL DEFAULT 0,
    icon text NULL,
    badge_text text NULL,
    hidden_on text[] NOT NULL DEFAULT '{}'::text[],
    external boolean NOT NULL DEFAULT false,
    open_new_tab boolean NOT NULL DEFAULT false,
    tracking_tag text NULL,
    is_active boolean NOT NULL DEFAULT true,
    updated_by uuid NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 4. Create Indexes
-- ============================================================================

CREATE INDEX idx_navigation_items_parent_id ON public.navigation_items(parent_id);
CREATE INDEX idx_navigation_items_order_parent ON public.navigation_items("order", parent_id);
CREATE INDEX idx_navigation_items_type_parent ON public.navigation_items(type, parent_id);

-- ============================================================================
-- 5. Add Check Constraints
-- ============================================================================

-- Only type='link' may have non-null href, icon, badge_text, and may set external/open_new_tab=true
ALTER TABLE public.navigation_items ADD CONSTRAINT chk_link_fields
CHECK (
    (type = 'link') OR
    (href IS NULL AND icon IS NULL AND badge_text IS NULL AND external = false AND open_new_tab = false)
);

-- type='column' must have parent_id is null
ALTER TABLE public.navigation_items ADD CONSTRAINT chk_column_no_parent
CHECK (
    (type != 'column') OR (parent_id IS NULL)
);

-- type='group' must have parent_id pointing to a row with type='column'
-- Note: This constraint is implemented via trigger below for referential integrity

-- type='link' must have parent_id pointing to a row with type in ('column','group')
-- Note: This constraint is implemented via trigger below for referential integrity

-- hidden_on must be a subset of {mobile,desktop}
ALTER TABLE public.navigation_items ADD CONSTRAINT chk_hidden_on_values
CHECK (
    hidden_on <@ ARRAY['mobile', 'desktop']::text[]
);

-- Disallow javascript: and data: URLs in href
ALTER TABLE public.navigation_items ADD CONSTRAINT chk_href_safe
CHECK (
    href IS NULL OR
    (href NOT ILIKE 'javascript:%' AND href NOT ILIKE 'data:%')
);

-- ============================================================================
-- 6. Create Helper Function for Admin Check
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE email = auth.jwt() ->> 'email'
    );
$$;

-- ============================================================================
-- 7. Create Trigger Function for Parent Type Validation
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_navigation_hierarchy()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Validate parent-child type relationships
    IF NEW.type = 'group' AND NEW.parent_id IS NOT NULL THEN
        -- group must have parent with type='column'
        IF NOT EXISTS (
            SELECT 1 FROM public.navigation_items
            WHERE id = NEW.parent_id AND type = 'column'
        ) THEN
            RAISE EXCEPTION 'Groups must have a parent of type column';
        END IF;
    END IF;

    IF NEW.type = 'link' AND NEW.parent_id IS NOT NULL THEN
        -- link must have parent with type in ('column','group')
        IF NOT EXISTS (
            SELECT 1 FROM public.navigation_items
            WHERE id = NEW.parent_id AND type IN ('column', 'group')
        ) THEN
            RAISE EXCEPTION 'Links must have a parent of type column or group';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- ============================================================================
-- 8. Create Trigger Function for Updated At
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_navigation_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- ============================================================================
-- 9. Create Triggers
-- ============================================================================

-- Trigger for hierarchy validation
CREATE TRIGGER validate_navigation_hierarchy_trigger
    BEFORE INSERT OR UPDATE ON public.navigation_items
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_navigation_hierarchy();

-- Trigger for updated_at
CREATE TRIGGER update_navigation_updated_at_trigger
    BEFORE UPDATE ON public.navigation_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_navigation_updated_at();

-- ============================================================================
-- 10. Enable Row Level Security
-- ============================================================================

ALTER TABLE public.navigation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 11. Create RLS Policies
-- ============================================================================

-- Public can select only active navigation items
CREATE POLICY select_public_menu ON public.navigation_items
    FOR SELECT
    TO public
    USING (is_active = true);

-- Admin policies for navigation_items
CREATE POLICY insert_admin ON public.navigation_items
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY update_admin ON public.navigation_items
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY delete_admin ON public.navigation_items
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- Admin policies for admin_users table
CREATE POLICY select_admin_users ON public.admin_users
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY insert_admin_users ON public.admin_users
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY update_admin_users ON public.admin_users
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY delete_admin_users ON public.admin_users
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ============================================================================
-- 12. Create Public Read-Only View
-- ============================================================================

CREATE OR REPLACE VIEW public.navigation_items_public AS
SELECT
    id,
    parent_id,
    type,
    label,
    href,
    "order",
    icon,
    badge_text,
    hidden_on,
    external,
    open_new_tab,
    tracking_tag
FROM public.navigation_items
WHERE is_active = true
ORDER BY "order", label;

-- Grant select on view to public
GRANT SELECT ON public.navigation_items_public TO public;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Example of how to add the first admin email (run manually):
-- INSERT INTO public.admin_users(email) VALUES ('<your-admin-email>');