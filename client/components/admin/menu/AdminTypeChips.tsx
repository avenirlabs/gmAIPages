// client/components/admin/menu/AdminTypeChips.tsx
import { MenuItemType } from "@/types/menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminTypeChipsProps {
  selected: MenuItemType | 'all';
  onChange: (type: MenuItemType | 'all') => void;
}

const typeOptions: Array<{ value: MenuItemType | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'column', label: 'Columns' },
  { value: 'group', label: 'Groups' },
  { value: 'link', label: 'Links' },
];

export function AdminTypeChips({ selected, onChange }: AdminTypeChipsProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {typeOptions.map((option) => (
        <Button
          key={option.value}
          variant={selected === option.value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(option.value)}
          className={cn(
            "text-sm",
            selected === option.value && "shadow-sm"
          )}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}