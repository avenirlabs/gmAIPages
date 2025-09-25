import { cn } from "@/lib/utils";
import type { FacetCounts, GiftFilters } from "@shared/api";
import { chipToFilter } from "@/utils/chipMapping";

interface Props {
  chips: string[];
  facets: FacetCounts;
  selectedFilters: GiftFilters;
  onToggle: (chip: string) => void;
  className?: string;
}

/**
 * Component that displays refine chips with live facet counts
 * Disables chips with zero counts and shows active state
 */
export function FacetChips({ chips, facets, selectedFilters, onToggle, className }: Props) {
  if (!chips?.length) return null;

  // Process chips to determine states and counts
  const processedChips = chips.map((chip) => {
    const mapping = chipToFilter(chip);
    const isActive = mapping ? isChipActive(chip, selectedFilters) : false;
    const count = mapping ? getFacetCount(mapping, facets) : null;
    const isDisabled = count === 0;

    return {
      chip,
      mapping,
      isActive,
      count,
      isDisabled: isDisabled && mapping !== null, // Only disable if it's a mappable chip with 0 count
    };
  });

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {processedChips.map(({ chip, isActive, count, isDisabled }) => (
        <button
          key={chip}
          onClick={() => !isDisabled && onToggle(chip)}
          disabled={isDisabled}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium shadow-sm transition",
            isDisabled
              ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
              : isActive
              ? "border-[#155ca5] bg-[#155ca5] text-white ring-1 ring-[#155ca5]/30 hover:bg-[#134a93]"
              : "border-transparent bg-[#DBEBFF] text-[#155ca5] ring-1 ring-[#155ca5]/20 hover:bg-[#cfe3ff]"
          )}
          title={isDisabled ? "No results available for this filter" : undefined}
        >
          {chip}
          {count !== null && count > 0 && (
            <span className={cn(
              "ml-1 text-xs",
              isActive ? "text-white/80" : "text-[#155ca5]/70"
            )}>
              ({count.toLocaleString()})
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/**
 * Check if a chip represents an active filter
 */
function isChipActive(chipLabel: string, filters: GiftFilters): boolean {
  const mapping = chipToFilter(chipLabel);
  if (!mapping) return false;

  const filterArray = filters[mapping.key] as string[] | undefined;
  return Boolean(filterArray?.includes(mapping.value));
}

/**
 * Get the facet count for a chip's filter mapping
 */
function getFacetCount(
  mapping: { key: keyof GiftFilters; value: string },
  facets: FacetCounts
): number | null {
  switch (mapping.key) {
    case 'relationships':
      return facets.relationship?.[mapping.value] ?? null;
    case 'occasions':
      return facets.occasion?.[mapping.value] ?? null;
    case 'categories':
      return facets.categories?.[mapping.value] ?? null;
    case 'priceBuckets':
      return facets.price_bucket?.[mapping.value] ?? null;
    default:
      return null;
  }
}