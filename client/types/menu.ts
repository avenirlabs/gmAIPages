// client/types/menu.ts
// TypeScript types for navigation_items table and admin menu editor

export type MenuItemType = 'column' | 'group' | 'link';

export interface NavigationItem {
  id: string;
  parent_id: string | null;
  type: MenuItemType;
  label: string;
  href: string | null;
  order: number;
  icon: string | null;
  badge_text: string | null;
  hidden_on: string[];
  external: boolean;
  open_new_tab: boolean;
  tracking_tag: string | null;
  is_active: boolean;
  updated_by: string | null;
  updated_at: string;
}

export interface NavigationItemFormData {
  type: MenuItemType;
  label: string;
  parent_id: string | null;
  order: number;
  hidden_on: string[];
  is_active: boolean;
  // Link-only fields
  href?: string | null;
  external?: boolean;
  open_new_tab?: boolean;
  icon?: string | null;
  badge_text?: string | null;
  tracking_tag?: string | null;
}

export interface ParentOption {
  id: string;
  type: MenuItemType;
  label: string;
}