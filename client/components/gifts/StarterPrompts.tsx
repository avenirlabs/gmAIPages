import { cn } from "@/lib/utils";

interface Props {
  prompts: string[];
  onSelect: (prompt: string) => void;
  className?: string;
}

export function StarterPrompts({ prompts, onSelect, className }: Props) {
  if (!prompts?.length) return null;

  return (
    <>
      {/* Mobile chip rail */}
      <div className={cn("md:hidden chip-rail", className)}>
        {prompts.map((p) => (
          <button
            key={p}
            onClick={() => onSelect(p)}
            className="rounded-full border border-neutral-300 bg-white px-4 py-1.5 text-sm font-medium text-brand-primary-500 shadow-sm transition hover:border-brand-primary-300 hover:bg-brand-primary-50 flex-shrink-0"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Desktop flex wrap */}
      <div className={cn("hidden md:flex flex-wrap items-center gap-2", className)}>
        {prompts.map((p) => (
          <button
            key={p}
            onClick={() => onSelect(p)}
            className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-brand-primary-500 shadow-sm transition hover:border-brand-primary-300 hover:bg-brand-primary-50"
          >
            {p}
          </button>
        ))}
      </div>
    </>
  );
}
