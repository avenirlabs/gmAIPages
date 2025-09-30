// client/components/admin/menu/AdminMenuForm.tsx
import { useState, useEffect } from "react";
import { NavigationItem, NavigationItemFormData, MenuItemType } from "@/types/menu";
import { supabase } from "@/lib/supabaseClient";
import { ParentSelector } from "./ParentSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface AdminMenuFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: NavigationItem | null; // null for create, NavigationItem for edit
  onSuccess: () => void;
}

export function AdminMenuForm({ open, onOpenChange, item, onSuccess }: AdminMenuFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<NavigationItemFormData>({
    type: 'column',
    label: '',
    parent_id: null,
    order: 0,
    hidden_on: [],
    is_active: true,
    href: '',
    external: false,
    open_new_tab: false,
    icon: '',
    badge_text: '',
    tracking_tag: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        type: item.type,
        label: item.label,
        parent_id: item.parent_id,
        order: item.order,
        hidden_on: item.hidden_on || [],
        is_active: item.is_active,
        href: item.href || '',
        external: item.external,
        open_new_tab: item.open_new_tab,
        icon: item.icon || '',
        badge_text: item.badge_text || '',
        tracking_tag: item.tracking_tag || '',
      });
    } else {
      // Reset for new item
      setFormData({
        type: 'column',
        label: '',
        parent_id: null,
        order: 0,
        hidden_on: [],
        is_active: true,
        href: '',
        external: false,
        open_new_tab: false,
        icon: '',
        badge_text: '',
        tracking_tag: '',
      });
    }
    setErrors({});
  }, [item, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Label is required
    if (!formData.label.trim()) {
      newErrors.label = 'Label is required';
    }

    // Type-specific validation
    if (formData.type === 'group' && !formData.parent_id) {
      newErrors.parent_id = 'Groups must be under a Column';
    }

    if (formData.type === 'link') {
      // Links can have no parent (root-level), so parent_id is optional
      if (!formData.href?.trim()) {
        newErrors.href = 'URL is required for links';
      } else {
        // Validate href safety
        const href = formData.href.toLowerCase();
        if (href.startsWith('javascript:') || href.startsWith('data:')) {
          newErrors.href = 'javascript: and data: URLs are not allowed for security';
        }
      }
    }

    // Validate order is numeric
    if (isNaN(formData.order)) {
      newErrors.order = 'Order must be a number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fix the errors before saving",
      });
      return;
    }

    setLoading(true);

    try {
      // Prepare data for database
      // Normalize empty string parent_id to null
      const normalizedParentId = formData.parent_id === '' ? null : formData.parent_id;

      const dbData: any = {
        type: formData.type,
        label: formData.label,
        parent_id: normalizedParentId,
        order: formData.order,
        hidden_on: formData.hidden_on,
        is_active: formData.is_active,
      };

      // Only include link-specific fields for link type
      if (formData.type === 'link') {
        dbData.href = formData.href || null;
        dbData.external = formData.external;
        dbData.open_new_tab = formData.open_new_tab;
        dbData.icon = formData.icon || null;
        dbData.badge_text = formData.badge_text || null;
        dbData.tracking_tag = formData.tracking_tag || null;
      } else {
        // Clear link-only fields for non-link types
        dbData.href = null;
        dbData.external = false;
        dbData.open_new_tab = false;
        dbData.icon = null;
        dbData.badge_text = null;
        dbData.tracking_tag = null;
      }

      // Column type must have null parent_id
      if (formData.type === 'column') {
        dbData.parent_id = null;
      }

      let result;
      if (item) {
        // Update existing item
        result = await supabase
          .from('navigation_items')
          .update(dbData)
          .eq('id', item.id);
      } else {
        // Insert new item
        result = await supabase
          .from('navigation_items')
          .insert(dbData);
      }

      if (result.error) {
        // Handle RLS/permission errors
        if (result.error.code === '42501' || result.error.message.includes('permission')) {
          toast({
            variant: "destructive",
            title: "Permission Denied",
            description: "You're signed in but don't have permission to edit menu items. Ask an admin to add your email to admin_users.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Save Failed",
            description: result.error.message || "Couldn't save. See details and try again.",
          });
        }
        return;
      }

      toast({
        title: item ? "Item Updated" : "Item Created",
        description: `Successfully ${item ? 'updated' : 'created'} "${formData.label}"`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving menu item:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type: MenuItemType) => {
    setFormData((prev) => ({
      ...prev,
      type,
      // Clear parent_id when changing to column
      parent_id: type === 'column' ? null : prev.parent_id,
    }));
  };

  const toggleHiddenOn = (platform: 'mobile' | 'desktop') => {
    setFormData((prev) => ({
      ...prev,
      hidden_on: prev.hidden_on.includes(platform)
        ? prev.hidden_on.filter((p) => p !== platform)
        : [...prev.hidden_on, platform],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item ? 'Edit Menu Item' : 'Create Menu Item'}
          </DialogTitle>
          <DialogDescription>
            {item ? 'Update the menu item details below' : 'Fill in the details to create a new menu item'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select
              value={formData.type}
              onValueChange={handleTypeChange}
              disabled={loading}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="column">Column (Top-level)</SelectItem>
                <SelectItem value="group">Group (Sub-category)</SelectItem>
                <SelectItem value="link">Link (Navigation item)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Label */}
          <div className="space-y-2">
            <Label htmlFor="label">Label *</Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => setFormData((prev) => ({ ...prev, label: e.target.value }))}
              placeholder="e.g., Products, Electronics, Home"
              disabled={loading}
            />
            {errors.label && (
              <p className="text-sm text-destructive">{errors.label}</p>
            )}
          </div>

          {/* Parent Selector */}
          <div className="space-y-2">
            <Label>Parent {formData.type !== 'column' && '*'}</Label>
            <ParentSelector
              currentType={formData.type}
              value={formData.parent_id}
              onChange={(val) => setFormData((prev) => ({ ...prev, parent_id: val }))}
              currentItemId={item?.id}
              disabled={loading}
            />
            {errors.parent_id && (
              <p className="text-sm text-destructive">{errors.parent_id}</p>
            )}
          </div>

          {/* Order */}
          <div className="space-y-2">
            <Label htmlFor="order">Order</Label>
            <Input
              id="order"
              type="number"
              value={formData.order}
              onChange={(e) => setFormData((prev) => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
              placeholder="0"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Items are sorted by order (ascending) within their parent
            </p>
            {errors.order && (
              <p className="text-sm text-destructive">{errors.order}</p>
            )}
          </div>

          {/* Hidden On */}
          <div className="space-y-2">
            <Label>Hide On Platforms</Label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hide-mobile"
                  checked={formData.hidden_on.includes('mobile')}
                  onCheckedChange={() => toggleHiddenOn('mobile')}
                  disabled={loading}
                />
                <label htmlFor="hide-mobile" className="text-sm">Mobile</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hide-desktop"
                  checked={formData.hidden_on.includes('desktop')}
                  onCheckedChange={() => toggleHiddenOn('desktop')}
                  disabled={loading}
                />
                <label htmlFor="hide-desktop" className="text-sm">Desktop</label>
              </div>
            </div>
          </div>

          {/* Link-only fields */}
          {formData.type === 'link' && (
            <div className="space-y-4 p-4 border rounded-md bg-muted/50">
              <h4 className="text-sm font-medium">Link Details</h4>

              {/* Href */}
              <div className="space-y-2">
                <Label htmlFor="href">URL (href) *</Label>
                <Input
                  id="href"
                  value={formData.href}
                  onChange={(e) => setFormData((prev) => ({ ...prev, href: e.target.value }))}
                  placeholder="/products/smartphones or https://external.com"
                  disabled={loading}
                />
                {errors.href && (
                  <p className="text-sm text-destructive">{errors.href}</p>
                )}
              </div>

              {/* Icon */}
              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
                  placeholder="smartphone, laptop, etc."
                  disabled={loading}
                />
              </div>

              {/* Badge Text */}
              <div className="space-y-2">
                <Label htmlFor="badge_text">Badge Text</Label>
                <Input
                  id="badge_text"
                  value={formData.badge_text}
                  onChange={(e) => setFormData((prev) => ({ ...prev, badge_text: e.target.value }))}
                  placeholder="New, Hot, 5"
                  disabled={loading}
                />
              </div>

              {/* External & Open in New Tab */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="external">External Link</Label>
                  <Switch
                    id="external"
                    checked={formData.external}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, external: checked }))}
                    disabled={loading}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="open_new_tab">Open in New Tab</Label>
                  <Switch
                    id="open_new_tab"
                    checked={formData.open_new_tab}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, open_new_tab: checked }))}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Tracking Tag */}
              <div className="space-y-2">
                <Label htmlFor="tracking_tag">Tracking Tag</Label>
                <Input
                  id="tracking_tag"
                  value={formData.tracking_tag}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tracking_tag: e.target.value }))}
                  placeholder="analytics-tag"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Internal tracking identifier (not shown to users)
                </p>
              </div>
            </div>
          )}

          {/* Is Active */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="is_active">Active</Label>
              <p className="text-xs text-muted-foreground">
                Inactive items are hidden from the public menu
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
              disabled={loading}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : item ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}