import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  queryText: string;
  suggestions?: string[];
  onSuggestionClick: (suggestion: string) => void;
  onTryBroaderSearch?: () => void;
}

const DEFAULT_SUGGESTIONS = [
  "gifts for sister",
  "birthday gifts under ₹1000",
  "anniversary gifts",
  "cooking gifts",
  "tech gifts",
  "eco-friendly gifts"
];

export function EmptyState({
  queryText,
  suggestions = DEFAULT_SUGGESTIONS,
  onSuggestionClick,
  onTryBroaderSearch
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Icon */}
      <div className="w-16 h-16 mb-6 rounded-full bg-muted flex items-center justify-center">
        <svg
          className="w-8 h-8 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-[#222529] mb-2">
        No perfect matches… let's adjust it.
      </h3>

      {/* Description */}
      <p className="text-muted-foreground mb-8 max-w-md">
        Couldn't find gifts matching "{queryText}". Try one of these suggestions or broaden your search.
      </p>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <Button
          variant="default"
          onClick={onTryBroaderSearch}
          className="rounded-full px-6"
        >
          Try a broader search
        </Button>
      </div>

      {/* Suggestions */}
      <div className="w-full max-w-2xl">
        <p className="text-sm font-medium text-[#222529] mb-4">
          Or try one of these popular searches:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {suggestions.slice(0, 6).map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => onSuggestionClick(suggestion)}
              className="justify-start text-left h-auto py-3 px-4 rounded-lg border-2 hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-muted-foreground flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span className="text-sm">{suggestion}</span>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Help text */}
      <div className="mt-8 text-xs text-muted-foreground max-w-md">
        <p>
          <strong>Tip:</strong> Try being more specific about the recipient, occasion, or budget.
          For example: "gifts for mom who loves gardening under ₹500"
        </p>
      </div>
    </div>
  );
}