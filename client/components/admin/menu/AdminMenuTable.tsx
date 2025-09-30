// client/components/admin/menu/AdminMenuTable.tsx
import { NavigationItem } from "@/types/menu";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, ExternalLink, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AdminMenuTableProps {
  items: NavigationItem[];
  parentMap: Map<string, string>;
  onEdit: (item: NavigationItem) => void;
  onDelete: (item: NavigationItem) => void;
  loading?: boolean;
}

export function AdminMenuTable({
  items,
  parentMap,
  onEdit,
  onDelete,
  loading,
}: AdminMenuTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading menu items...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground mb-4">No menu items found</p>
        <p className="text-sm text-muted-foreground">
          Click "New Item" to create your first menu item
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Type</TableHead>
            <TableHead>Label</TableHead>
            <TableHead>Parent</TableHead>
            <TableHead className="w-[80px]">Order</TableHead>
            <TableHead>Hidden On</TableHead>
            <TableHead>Link Details</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="w-[120px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              {/* Type */}
              <TableCell>
                <Badge
                  variant={
                    item.type === 'column'
                      ? 'default'
                      : item.type === 'group'
                      ? 'secondary'
                      : 'outline'
                  }
                  className="font-mono text-xs"
                >
                  {item.type}
                </Badge>
              </TableCell>

              {/* Label */}
              <TableCell className="font-medium">{item.label}</TableCell>

              {/* Parent */}
              <TableCell>
                {item.parent_id ? (
                  <span className="text-sm text-muted-foreground">
                    {parentMap.get(item.parent_id) || 'Unknown'}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground italic">—</span>
                )}
              </TableCell>

              {/* Order */}
              <TableCell className="text-center font-mono text-sm">
                {item.order}
              </TableCell>

              {/* Hidden On */}
              <TableCell>
                {item.hidden_on.length > 0 ? (
                  <div className="flex gap-1">
                    {item.hidden_on.map((platform) => (
                      <Badge key={platform} variant="outline" className="text-xs">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground italic">visible</span>
                )}
              </TableCell>

              {/* Link Details */}
              <TableCell>
                {item.type === 'link' && item.href ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline max-w-[200px] truncate"
                        title={item.href}
                      >
                        {item.href}
                      </a>
                      {item.external && (
                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {item.icon && (
                        <Badge variant="secondary" className="text-xs">
                          🎨 {item.icon}
                        </Badge>
                      )}
                      {item.badge_text && (
                        <Badge variant="secondary" className="text-xs">
                          🏷️ {item.badge_text}
                        </Badge>
                      )}
                      {item.open_new_tab && (
                        <Badge variant="outline" className="text-xs">
                          ↗ new tab
                        </Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground italic">—</span>
                )}
              </TableCell>

              {/* Status */}
              <TableCell>
                <div className="flex items-center gap-1">
                  {item.is_active ? (
                    <Eye className="w-4 h-4 text-green-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">
                    {item.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </TableCell>

              {/* Actions */}
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(item)}
                    title="Edit item"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(item)}
                    title="Delete item"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}