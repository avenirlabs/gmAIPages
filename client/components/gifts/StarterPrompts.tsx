import { cn } from "@/lib/utils";

interface Props {
  prompts: string[];
  onSelect: (prompt: string) => void;
  className?: string;
}

export function StarterPrompts({ prompts, onSelect, className }: Props) {
  if (!prompts?.length) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {prompts.map((p) => (
        <button
          key={p}
          onClick={() => onSelect(p)}
  className="inline-flex items-center gap-2 rounded-full border border-transparent bg-white px-4 py-1.5 text-sm font-semibold capitalize text-[#155ca5] shadow-sm ring-1 ring-[#155ca5]/20 transition hover:bg-[#DBEBFF] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#155ca5]/50"
        >
          {p}
        </button>
      ))}
    </div>
  );
}
