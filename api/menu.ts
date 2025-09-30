// api/menu.ts - Public Menu API
// Fetches hierarchical navigation from navigation_items table
// Returns nested JSON with columns, groups, and links
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceSupabase } from './_services/supabase.js';

interface NavigationItem {
  id: string;
  parent_id: string | null;
  type: 'column' | 'group' | 'link';
  label: string;
  href: string | null;
  order: number;
  icon: string | null;
  badge_text: string | null;
  hidden_on: string[];
  external: boolean;
  open_new_tab: boolean;
  tracking_tag: string | null;
}

interface PublicMenuItem {
  type: 'column' | 'group' | 'link';
  label: string;
  href?: string;
  icon?: string;
  badge_text?: string;
  external?: boolean;
  open_new_tab?: boolean;
  hidden_on?: string[];
  children?: PublicMenuItem[];
}

interface MenuResponse {
  items: PublicMenuItem[];
  generated_at: string;
}

// In-memory cache for menu data
let cachedMenu: MenuResponse | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 3600 * 1000; // 1 hour

/**
 * Build hierarchical menu structure from flat array
 */
function buildMenuTree(items: NavigationItem[]): PublicMenuItem[] {
  // Create lookup map
  const itemMap = new Map<string, NavigationItem>();
  const childrenMap = new Map<string, NavigationItem[]>();

  items.forEach(item => {
    itemMap.set(item.id, item);
    if (!childrenMap.has(item.parent_id || 'root')) {
      childrenMap.set(item.parent_id || 'root', []);
    }
    childrenMap.get(item.parent_id || 'root')!.push(item);
  });

  // Helper to transform item to public format
  const transformItem = (item: NavigationItem): PublicMenuItem => {
    const publicItem: PublicMenuItem = {
      type: item.type,
      label: item.label,
    };

    // Only add fields that are present
    if (item.href) publicItem.href = item.href;
    if (item.icon) publicItem.icon = item.icon;
    if (item.badge_text) publicItem.badge_text = item.badge_text;
    if (item.external) publicItem.external = item.external;
    if (item.open_new_tab) publicItem.open_new_tab = item.open_new_tab;
    if (item.hidden_on && item.hidden_on.length > 0) {
      publicItem.hidden_on = item.hidden_on;
    }

    // Recursively add children
    const children = childrenMap.get(item.id);
    if (children && children.length > 0) {
      // Sort children by order
      const sortedChildren = children.sort((a, b) => a.order - b.order);
      publicItem.children = sortedChildren.map(transformItem);
    }

    return publicItem;
  };

  // Get root items (columns with parent_id = null)
  const rootItems = childrenMap.get('root') || [];
  const sortedRoots = rootItems.sort((a, b) => a.order - b.order);

  return sortedRoots.map(transformItem);
}

/**
 * Fetch menu from Supabase
 */
async function fetchMenuFromDatabase(): Promise<MenuResponse> {
  const supa = getServiceSupabase();

  if (!supa) {
    throw new Error('Supabase not configured');
  }

  // Query all active navigation items
  const { data, error } = await supa
    .from('navigation_items')
    .select('id, parent_id, type, label, href, "order", icon, badge_text, hidden_on, external, open_new_tab, tracking_tag')
    .eq('is_active', true)
    .order('order', { ascending: true });

  if (error) {
    console.error('[menu] Supabase query error:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  const items = (data || []) as NavigationItem[];
  const menuTree = buildMenuTree(items);

  return {
    items: menuTree,
    generated_at: new Date().toISOString(),
  };
}

/**
 * Get menu with caching
 */
async function getMenu(): Promise<MenuResponse> {
  const now = Date.now();

  // Check if cache is valid
  if (cachedMenu && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedMenu;
  }

  // Fetch fresh data
  const menu = await fetchMenuFromDatabase();

  // Update cache
  cachedMenu = menu;
  cacheTimestamp = now;

  return menu;
}

/**
 * Clear the in-memory cache (called by webhook)
 */
export function clearMenuCache(): void {
  cachedMenu = null;
  cacheTimestamp = 0;
}

/**
 * GET /api/menu - Public menu endpoint
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const menu = await getMenu();

    // Set cache headers for CDN
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');

    return res.status(200).json(menu);
  } catch (error: any) {
    console.error('[menu] Handler error:', error);

    // Return appropriate error
    const statusCode = error.message.includes('not configured') ? 503 : 500;
    return res.status(statusCode).json({
      error: error.message || 'Internal server error',
      generated_at: new Date().toISOString(),
    });
  }
}