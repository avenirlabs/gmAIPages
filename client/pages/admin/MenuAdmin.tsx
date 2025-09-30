// client/pages/admin/MenuAdmin.tsx
import { useState, useEffect, useMemo } from "react";
import { NavigationItem, MenuItemType } from "@/types/menu";
import { supabase } from "@/lib/supabaseClient";
import { AdminTypeChips } from "@/components/admin/menu/AdminTypeChips";
import { AdminMenuTable } from "@/components/admin/menu/AdminMenuTable";
import { AdminMenuForm } from "@/components/admin/menu/AdminMenuForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, FileText } from "lucide-react";
import { Link } from "react-router-dom";

export default function MenuAdmin() {
  const { toast } = useToast();

  // State
  const [items, setItems] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<MenuItemType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form/dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NavigationItem | null>(null);

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<NavigationItem | null>(null);

  // Load items on mount
  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('navigation_items')
        .select('*')
        .order('parent_id', { ascending: true, nullsFirst: true })
        .order('order', { ascending: true });

      if (error) {
        console.error('Error loading menu items:', error);
        toast({
          variant: "destructive",
          title: "Load Failed",
          description: error.message || "Couldn't load menu items",
        });
        return;
      }

      setItems((data as NavigationItem[]) || []);
    } finally {
      setLoading(false);
    }
  };

  // Build parent map for table display
  const parentMap = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach((item) => {
      map.set(item.id, item.label);
    });
    return map;
  }, [items]);

  // Filter items based on type and search
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((item) => item.type === typeFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) =>
        item.label.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [items, typeFilter, searchQuery]);

  // Handlers
  const handleCreate = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  const handleEdit = (item: NavigationItem) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const handleDeleteClick = (item: NavigationItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      const { error } = await supabase
        .from('navigation_items')
        .delete()
        .eq('id', itemToDelete.id);

      if (error) {
        // Handle RLS/permission errors
        if (error.code === '42501' || error.message.includes('permission')) {
          toast({
            variant: "destructive",
            title: "Permission Denied",
            description: "You're signed in but don't have permission to delete menu items. Ask an admin to add your email to admin_users.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Delete Failed",
            description: error.message || "Couldn't delete item",
          });
        }
        return;
      }

      toast({
        title: "Item Deleted",
        description: `Successfully deleted "${itemToDelete.label}"`,
      });

      // Refresh list
      loadItems();
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An unexpected error occurred",
      });
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleFormSuccess = () => {
    loadItems();
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold">Menu Administration</h1>
            <p className="text-muted-foreground mt-1">
              Manage navigation menu items, hierarchy, and settings
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin">
              Back to Admin
            </Link>
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 space-y-4">
        {/* Type filters and New Item button */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <AdminTypeChips selected={typeFilter} onChange={setTypeFilter} />
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            New Item
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by label..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>
            Total: <strong className="text-foreground">{items.length}</strong>
          </span>
          <span>•</span>
          <span>
            Showing: <strong className="text-foreground">{filteredItems.length}</strong>
          </span>
        </div>
      </div>

      {/* Table */}
      <AdminMenuTable
        items={filteredItems}
        parentMap={parentMap}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        loading={loading}
      />

      {/* Footer Help */}
      <div className="mt-8 p-4 border rounded-md bg-muted/50 text-sm">
        <div className="flex items-start gap-2">
          <FileText className="w-4 h-4 mt-0.5 text-muted-foreground" />
          <div>
            <p className="font-medium mb-1">Need Help?</p>
            <p className="text-muted-foreground">
              See the{' '}
              <a
                href="/docs/admin/menu_schema.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Menu Schema Documentation
              </a>
              {' '}for field definitions and hierarchy rules, or the{' '}
              <a
                href="/docs/admin/menu_editor.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Menu Editor Guide
              </a>
              {' '}for usage instructions.
            </p>
          </div>
        </div>
      </div>

      {/* Create/Edit Form Dialog */}
      <AdminMenuForm
        open={formOpen}
        onOpenChange={setFormOpen}
        item={editingItem}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Menu Item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{itemToDelete?.label}</strong> and all its children (if any).
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}