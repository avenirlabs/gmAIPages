-- Migration: Allow root-level links
-- Date: 2025-09-30
-- Description: Updates navigation_items validation to allow links at root level
--              Replaces invalid CHECK constraints with proper trigger validation

-- ============================================================================
-- 1. Drop invalid CHECK constraint (if exists)
-- ============================================================================
-- Note: The original constraint attempted to validate parent type in a CHECK,
-- which doesn't work because it can't reference other rows reliably.

ALTER TABLE public.navigation_items DROP CONSTRAINT IF EXISTS chk_parent_type_for_group;
ALTER TABLE public.navigation_items DROP CONSTRAINT IF EXISTS chk_parent_type_for_link;

-- ============================================================================
-- 2. Update trigger function with new validation rules
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_navigation_hierarchy()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Rule 1: Columns must have no parent (root-level only)
    IF NEW.type = 'column' AND NEW.parent_id IS NOT NULL THEN
        RAISE EXCEPTION 'Columns must be root-level items (no parent)';
    END IF;

    -- Rule 2: Groups must have a parent, and it must be a Column
    IF NEW.type = 'group' THEN
        IF NEW.parent_id IS NULL THEN
            RAISE EXCEPTION 'Groups must have a parent Column';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM public.navigation_items
            WHERE id = NEW.parent_id AND type = 'column'
        ) THEN
            RAISE EXCEPTION 'Groups must have a parent of type Column';
        END IF;
    END IF;

    -- Rule 3: Links can have no parent (root-level) OR parent can be Column or Group
    IF NEW.type = 'link' AND NEW.parent_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.navigation_items
            WHERE id = NEW.parent_id AND type IN ('column', 'group')
        ) THEN
            RAISE EXCEPTION 'Links must have a parent of type Column or Group (or no parent for root-level)';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Ensure trigger is attached (it should already exist from previous migration)
DROP TRIGGER IF EXISTS validate_navigation_hierarchy_trigger ON public.navigation_items;

CREATE TRIGGER validate_navigation_hierarchy_trigger
    BEFORE INSERT OR UPDATE ON public.navigation_items
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_navigation_hierarchy();

-- ============================================================================
-- 3. Update comments for clarity
-- ============================================================================

COMMENT ON COLUMN public.navigation_items.parent_id IS
'Parent item ID. NULL for root-level items (all Columns, optional for Links).
Groups must have a Column parent. Links can be root-level or under Column/Group.';

COMMENT ON FUNCTION public.validate_navigation_hierarchy() IS
'Validates navigation hierarchy rules:
- Columns: must be root (parent_id = NULL)
- Groups: must have Column parent (parent_id required, type=column)
- Links: can be root OR under Column/Group (parent_id optional, type in [column,group] if set)';

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Example root-level link:
-- INSERT INTO public.navigation_items(type, label, href, "order")
-- VALUES ('link', 'Home', '/', 0);