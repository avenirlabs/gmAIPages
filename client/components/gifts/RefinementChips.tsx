import { cn } from "@/lib/utils";

interface Props {
  chips: string[];
  onSelect: (chip: string) => void;
  className?: string;
  activeChips?: Set<string>;
}

export function RefinementChips({ chips, onSelect, className, activeChips }: Props) {
  if (!chips?.length) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {chips.map((c) => {
        const isActive = activeChips?.has(c);
        return (
          <button
            key={c}
            onClick={() => onSelect(c)}
            className={cn(
             "rounded-full border px-3 py-1 text-xs font-medium shadow-sm transition",
  isActive
    ? "border-[#155ca5] bg-[#155ca5] text-white ring-1 ring-[#155ca5]/30 hover:bg-[#134a93]"
    : "border-transparent bg-[#DBEBFF] text-[#155ca5] ring-1 ring-[#155ca5]/20 hover:bg-[#cfe3ff]"
)}
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}
