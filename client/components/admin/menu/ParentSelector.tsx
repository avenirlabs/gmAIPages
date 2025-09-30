// client/components/admin/menu/ParentSelector.tsx
import { useEffect, useState } from "react";
import { MenuItemType, ParentOption } from "@/types/menu";
import { supabase } from "@/lib/supabaseClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ParentSelectorProps {
  currentType: MenuItemType;
  value: string | null;
  onChange: (value: string | null) => void;
  currentItemId?: string; // Exclude self when editing
  disabled?: boolean;
}

export function ParentSelector({
  currentType,
  value,
  onChange,
  currentItemId,
  disabled,
}: ParentSelectorProps) {
  const [options, setOptions] = useState<ParentOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadParentOptions();
  }, [currentType, currentItemId]);

  const loadParentOptions = async () => {
    setLoading(true);
    try {
      let validTypes: MenuItemType[] = [];

      // Determine valid parent types based on current type
      if (currentType === 'group') {
        validTypes = ['column'];
      } else if (currentType === 'link') {
        validTypes = ['column', 'group'];
      }

      if (validTypes.length === 0) {
        setOptions([]);
        return;
      }

      // Query Supabase for valid parents
      let query = supabase
        .from('navigation_items')
        .select('id, type, label')
        .in('type', validTypes)
        .eq('is_active', true)
        .order('order', { ascending: true });

      // Exclude current item when editing
      if (currentItemId) {
        query = query.neq('id', currentItemId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading parent options:', error);
        return;
      }

      setOptions((data as ParentOption[]) || []);
    } finally {
      setLoading(false);
    }
  };

  // Column type cannot have parent
  if (currentType === 'column') {
    return (
      <div className="text-sm text-muted-foreground italic">
        Columns are top-level items (no parent)
      </div>
    );
  }

  const isDisabled = disabled || loading || options.length === 0;

  return (
    <div className="space-y-2">
      <Select
        value={value || ''}
        onValueChange={(val) => onChange(val || null)}
        disabled={isDisabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={loading ? "Loading..." : "Select parent"} />
        </SelectTrigger>
        <SelectContent>
          {options.length === 0 && !loading && (
            <SelectItem value="none" disabled>
              No valid parents found
            </SelectItem>
          )}
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              <span className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">
                  {option.type}
                </span>
                <span>{option.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {currentType === 'group' && (
        <p className="text-xs text-muted-foreground">
          Groups must have a Column parent
        </p>
      )}
      {currentType === 'link' && (
        <p className="text-xs text-muted-foreground">
          Links must have a Column or Group parent
        </p>
      )}
    </div>
  );
}