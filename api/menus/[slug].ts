// api/menus/[slug].ts
// Header Adapter API: Returns NavItem[] shape for SiteHeader component
// Queries navigation_items table (new schema) instead of legacy menus tables

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceSupabase } from '../_services/supabase.js';

// NavItem types expected by SiteHeader component
type NavItemLink = {
  type: 'link';
  label: string;
  to: string;
};

type NavItemMega = {
  type: 'mega';
  label: string;
  columns: Array<{
    heading: string;
    links: Array<{
      label: string;
      to: string;
      badge?: string;
    }>;
  }>;
  promo?: {
    title: string;
    text: string;
    to: string;
  };
};

type NavItem = NavItemLink | NavItemMega;

interface NavigationItem {
  id: string;
  parent_id: string | null;
  type: 'column' | 'group' | 'link';
  label: string;
  href: string | null;
  order: number;
  badge_text: string | null;
  icon: string | null;
}

interface MenuResponse {
  items: NavItem[];
  generated_at: string;
}

/**
 * Build NavItem[] from navigation_items data
 */
function buildNavItems(items: NavigationItem[]): NavItem[] {
  const result: NavItem[] = [];

  // Group items by parent_id for easy lookup
  const byParent = new Map<string | null, NavigationItem[]>();
  items.forEach((item) => {
    const key = item.parent_id || 'root';
    if (!byParent.has(key)) {
      byParent.set(key, []);
    }
    byParent.get(key)!.push(item);
  });

  // Sort helper
  const sortByOrder = (a: NavigationItem, b: NavigationItem) => a.order - b.order;

  // Get root items (parent_id is null)
  const rootItems = (byParent.get('root') || []).sort(sortByOrder);

  // 1. Collect root-level links (type=link, parent_id=null)
  const rootLinks = rootItems.filter((item) => item.type === 'link');
  rootLinks.forEach((link) => {
    result.push({
      type: 'link',
      label: link.label,
      to: link.href || '#',
    });
  });

  // 2. Collect columns (type=column, parent_id=null)
  const columns = rootItems.filter((item) => item.type === 'column');

  // 3. If we have columns, build a mega menu item
  if (columns.length > 0) {
    const megaColumns = columns.sort(sortByOrder).map((column) => {
      const columnLinks: Array<{ label: string; to: string; badge?: string }> = [];

      // Get direct links under this column
      const directLinks = (byParent.get(column.id) || [])
        .filter((item) => item.type === 'link')
        .sort(sortByOrder);

      directLinks.forEach((link) => {
        const linkItem: { label: string; to: string; badge?: string } = {
          label: link.label,
          to: link.href || '#',
        };
        if (link.badge_text) {
          linkItem.badge = link.badge_text;
        }
        columnLinks.push(linkItem);
      });

      // Get groups under this column
      const groups = (byParent.get(column.id) || [])
        .filter((item) => item.type === 'group')
        .sort(sortByOrder);

      // For each group, get its links
      groups.forEach((group) => {
        const groupLinks = (byParent.get(group.id) || [])
          .filter((item) => item.type === 'link')
          .sort(sortByOrder);

        groupLinks.forEach((link) => {
          const linkItem: { label: string; to: string; badge?: string } = {
            label: link.label,
            to: link.href || '#',
          };
          if (link.badge_text) {
            linkItem.badge = link.badge_text;
          }
          columnLinks.push(linkItem);
        });
      });

      return {
        heading: column.label,
        links: columnLinks,
      };
    });

    // Add mega menu item
    const megaLabel = process.env.MENU_MEGA_LABEL || 'Shop';
    result.push({
      type: 'mega',
      label: megaLabel,
      columns: megaColumns,
    });
  }

  return result;
}

/**
 * GET /api/menus/[slug] - Returns NavItem[] for header
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const slug = String(req.query.slug || 'main');
  const supa = getServiceSupabase();

  if (!supa) {
    // Return fallback menu if Supabase not configured
    return res.status(200).json({
      items: [
        { type: 'link', label: 'Home', to: '/' },
        {
          type: 'mega',
          label: 'Shop',
          columns: [
            {
              heading: 'Gifts',
              links: [
                { label: 'For Dad', to: '/gifts/dad' },
                { label: 'For Mom', to: '/gifts/mom' },
              ],
            },
          ],
        },
      ],
      generated_at: new Date().toISOString(),
    });
  }

  try {
    // Query navigation_items table
    const { data, error } = await supa
      .from('navigation_items')
      .select('id, parent_id, type, label, href, "order", badge_text, icon')
      .eq('is_active', true)
      .order('order', { ascending: true });

    if (error) {
      console.error('[menus:get] Supabase query error:', error);
      return res.status(500).json({
        error: 'Database error',
        generated_at: new Date().toISOString(),
      });
    }

    const items = (data || []) as NavigationItem[];
    const navItems = buildNavItems(items);

    const response: MenuResponse = {
      items: navItems,
      generated_at: new Date().toISOString(),
    };

    // Set cache headers for CDN
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');

    return res.status(200).json(response);
  } catch (error: any) {
    console.error('[menus:get] Handler error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error',
      generated_at: new Date().toISOString(),
    });
  }
}