import { cn } from "@/lib/utils";

interface Props {
  chips: string[];
  onSelect: (chip: string) => void;
  className?: string;
}

export function RefinementChips({ chips, onSelect, className }: Props) {
  if (!chips?.length) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {chips.map((c) => (
        <button
          key={c}
          onClick={() => onSelect(c)}
          className="rounded-full border border-transparent bg-[#DBEBFF] px-3 py-1 text-xs font-medium text-[#155ca5] shadow-sm ring-1 ring-[#155ca5]/20 transition hover:bg-[#cfe3ff]"
        >
          {c}
        </button>
      ))}
    </div>
  );
}
