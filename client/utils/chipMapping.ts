import type { GiftFilters } from '@shared/api';

/**
 * Maps human-readable chip labels to canonical filter values
 */
export const CHIP_TO_FILTER_MAP: Record<string, { key: keyof GiftFilters; value: string }> = {
  // Relationships
  'For Dad': { key: 'relationships', value: 'dad' },
  'For Mom': { key: 'relationships', value: 'mom' },
  'For Him': { key: 'relationships', value: 'him' },
  'For Her': { key: 'relationships', value: 'her' },
  'Sister': { key: 'relationships', value: 'sister' },
  'Brother': { key: 'relationships', value: 'brother' },
  'Wife': { key: 'relationships', value: 'wife' },
  'Husband': { key: 'relationships', value: 'husband' },
  'Girlfriend': { key: 'relationships', value: 'girlfriend' },
  'Boyfriend': { key: 'relationships', value: 'boyfriend' },

  // Occasions
  'Birthday': { key: 'occasions', value: 'birthday' },
  'Anniversary': { key: 'occasions', value: 'anniversary' },
  'Diwali': { key: 'occasions', value: 'diwali' },
  'Christmas': { key: 'occasions', value: 'christmas' },
  'Valentine': { key: 'occasions', value: 'valentine' },
  'Wedding': { key: 'occasions', value: 'wedding' },
  'Engagement': { key: 'occasions', value: 'engagement' },

  // Price buckets
  'Under ₹500': { key: 'priceBuckets', value: 'under-499' },
  'Under ₹1000': { key: 'priceBuckets', value: '500-999' },
  '₹500–₹1000': { key: 'priceBuckets', value: '500-999' },
  '₹1000–₹2000': { key: 'priceBuckets', value: '1000-1999' },
  '₹2000–₹5000': { key: 'priceBuckets', value: '2000-4999' },
  'Above ₹5000': { key: 'priceBuckets', value: '5000-plus' },

  // Categories/Interests (mapped as categories for now)
  'Tech': { key: 'categories', value: 'tech' },
  'Cooking': { key: 'categories', value: 'cooking' },
  'Gym': { key: 'categories', value: 'gym' },
  'Makeup': { key: 'categories', value: 'makeup' },
  'Beauty': { key: 'categories', value: 'beauty' },
  'Skincare': { key: 'categories', value: 'skincare' },
  'Eco-friendly': { key: 'categories', value: 'eco' },
  'Sustainable': { key: 'categories', value: 'sustainable' },
};

/**
 * Maps a chip label to its corresponding filter key and value
 */
export function chipToFilter(chipLabel: string): { key: keyof GiftFilters; value: string } | null {
  return CHIP_TO_FILTER_MAP[chipLabel] || null;
}

/**
 * Maps a filter key/value back to its chip label
 */
export function filterToChip(key: keyof GiftFilters, value: string): string | null {
  const entry = Object.entries(CHIP_TO_FILTER_MAP).find(
    ([, mapping]) => mapping.key === key && mapping.value === value
  );
  return entry?.[0] || null;
}

/**
 * Gets all available chips for a given filter key
 */
export function getChipsForFilterKey(key: keyof GiftFilters): string[] {
  return Object.entries(CHIP_TO_FILTER_MAP)
    .filter(([, mapping]) => mapping.key === key)
    .map(([chip]) => chip);
}

/**
 * Checks if a chip represents an active filter
 */
export function isChipActive(chipLabel: string, filters: GiftFilters): boolean {
  const mapping = chipToFilter(chipLabel);
  if (!mapping) return false;

  const filterArray = filters[mapping.key] as string[] | undefined;
  return Boolean(filterArray?.includes(mapping.value));
}