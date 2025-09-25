import { useState, useCallback } from 'react';
import type { GiftFilters } from '@shared/api';

export interface UseGiftFiltersReturn {
  selectedFilters: GiftFilters;
  toggleValue: (key: keyof GiftFilters, value: string) => void;
  clearAll: () => void;
  setSoft: (soft: boolean) => void;
  hasFilters: boolean;
}

/**
 * Hook for managing gift filter state
 * Handles toggling filter values and managing soft/strict modes
 */
export function useGiftFilters(initialFilters: GiftFilters = {}): UseGiftFiltersReturn {
  const [selectedFilters, setSelectedFilters] = useState<GiftFilters>(initialFilters);

  const toggleValue = useCallback((key: keyof GiftFilters, value: string) => {
    setSelectedFilters(prev => {
      const currentArray = prev[key] as string[] | undefined;
      const newArray = currentArray?.includes(value)
        ? currentArray.filter(v => v !== value)
        : [...(currentArray || []), value];

      return {
        ...prev,
        [key]: newArray.length > 0 ? newArray : undefined
      };
    });
  }, []);

  const clearAll = useCallback(() => {
    setSelectedFilters({});
  }, []);

  const setSoft = useCallback((soft: boolean) => {
    setSelectedFilters(prev => ({
      ...prev,
      soft
    }));
  }, []);

  const hasFilters = Boolean(
    selectedFilters.relationships?.length ||
    selectedFilters.occasions?.length ||
    selectedFilters.categories?.length ||
    selectedFilters.priceBuckets?.length ||
    selectedFilters.priceRange
  );

  return {
    selectedFilters,
    toggleValue,
    clearAll,
    setSoft,
    hasFilters
  };
}