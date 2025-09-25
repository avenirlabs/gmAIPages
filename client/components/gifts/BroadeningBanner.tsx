import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onRevertToStrict: () => void;
  onDismiss?: () => void;
}

/**
 * Banner shown when search results were broadened due to zero hits with strict filtering
 */
export function BroadeningBanner({ onRevertToStrict, onDismiss }: Props) {
  return (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-medium text-amber-800">
                Search broadened
              </h4>
              <p className="text-sm text-amber-700 mt-1">
                We broadened your search to show close matches. Your filters returned no exact results, so we're showing similar items instead.
              </p>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-amber-500 hover:text-amber-700 p-1"
                aria-label="Dismiss banner"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              onClick={onRevertToStrict}
              variant="outline"
              size="sm"
              className="h-7 px-3 text-xs border-amber-300 text-amber-700 hover:bg-amber-100 hover:border-amber-400"
            >
              Revert to strict search
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}