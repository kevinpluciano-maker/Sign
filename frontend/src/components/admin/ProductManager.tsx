import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, Edit2, Copy, Package, Eye, EyeOff, Star, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { API_ENDPOINTS } from '@/config/api';
import { MediaLibrary } from '@/components/admin/MediaLibrary';

interface Product {
  id: string;
  name: string;
  price: string;
  category: string;
  description: string;
  image: string;
  images: string[];
  materials: string[];
  features: string[];
  color_options: string[];
  braille_options: string[];
  size_options: { size: string; price: string }[];
  badges: string[];
  rating: number;
  review_count: number;
  in_stock: boolean;
  published: boolean;
  featured: boolean;
  slug?: string;
  created_at?: string;
  updated_at?: string;
}

const EMPTY: Partial<Product> = {
  name: '',
  price: '',
  category: 'restroom-signs',
  description: '',
  image: '',
  images: [],
  materials: [],
  features: [],
  color_options: [],
  braille_options: ['Yes', 'No'],
  size_options: [],
  badges: [],
  rating: 5.0,
  review_count: 0,
  in_stock: true,
  published: true,
  featured: false,
};

const CATEGORIES = [
  'restroom-signs',
  'door-signs',
  'ada-signs',
  'office-signs',
  'custom',
  'best-sellers',
  'new',
];

export const ProductManager = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Product>>(EMPTY);
  const [isNew, setIsNew] = useState(true);
  const [importing, setImporting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ products: Product[] }>(API_ENDPOINTS.admin.products, {
        auth: true,
      });
      setProducts(data.products || []);
    } catch (e: any) {
      toast.error('Failed to load products: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing({ ...EMPTY });
    setIsNew(true);
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing({ ...p });
    setIsNew(false);
    setDialogOpen(true);
  };

  const save = async () => {
    if (!editing.name || !editing.price) {
      toast.error('Name and price are required');
      return;
    }
    try {
      if (isNew) {
        await apiFetch(API_ENDPOINTS.admin.products, {
          method: 'POST',
          auth: true,
          json: editing,
        });
        toast.success('Product created');
      } else {
        await apiFetch(API_ENDPOINTS.admin.productById(editing.id as string), {
          method: 'PUT',
          auth: true,
          json: editing,
        });
        toast.success('Product updated');
      }
      setDialogOpen(false);
      load();
    } catch (e: any) {
      toast.error('Save failed: ' + e.message);
    }
  };

  const remove = async (id: string) => {
    try {
      await apiFetch(API_ENDPOINTS.admin.productById(id), {
        method: 'DELETE',
        auth: true,
      });
      toast.success('Product deleted');
      load();
    } catch (e: any) {
      toast.error('Delete failed: ' + e.message);
    }
  };

  // 1-click clone — duplicates every field, creates a fresh UUID + unique slug,
  // starts as Draft (unpublished) so the admin can safely edit before going live.
  const clone = async (p: Product) => {
    try {
      const created: any = await apiFetch(API_ENDPOINTS.admin.productClone(p.id), {
        method: 'POST',
        auth: true,
      });
      toast.success(`Cloned "${p.name}" → "${created.name}". Opening editor…`);
      await load();
      // Immediately open the new clone in the editor for quick customisation
      setEditing({ ...created });
      setIsNew(false);
      setDialogOpen(true);
    } catch (e: any) {
      toast.error('Clone failed: ' + e.message);
    }
  };

  const togglePublished = async (p: Product) => {
    try {
      await apiFetch(API_ENDPOINTS.admin.productById(p.id), {
        method: 'PUT',
        auth: true,
        json: { published: !p.published },
      });
      load();
    } catch (e: any) {
      toast.error('Toggle failed: ' + e.message);
    }
  };

  const toggleFeatured = async (p: Product) => {
    try {
      await apiFetch(API_ENDPOINTS.admin.productById(p.id), {
        method: 'PUT',
        auth: true,
        json: { featured: !p.featured },
      });
      load();
    } catch (e: any) {
      toast.error('Toggle failed: ' + e.message);
    }
  };

  const importCatalog = async () => {
    if (!confirm(
      'Import hardcoded products from src/data/productsData.ts + bestSellersProducts.ts into MongoDB?\n\nSafe to run multiple times — existing products with matching IDs are updated, not duplicated.'
    )) return;
    setImporting(true);
    try {
      const [{ productsData }, { bestSellersProducts }] = await Promise.all([
        import('@/data/productsData'),
        import('@/data/bestSellersProducts'),
      ]);
      // Flatten productsData (record of category -> array)
      const flat: any[] = [];
      Object.entries(productsData as Record<string, any[]>).forEach(([cat, arr]) => {
        arr.forEach((p) => {
          flat.push({
            id: p.id,
            name: p.name,
            price: p.price,
            category: p.category || cat,
            description: p.description || '',
            image: p.image || '',
            images: p.gallery || [],
            materials: p.materials || [],
            features: p.badges || [],
            color_options: p.colorOptions || [],
            braille_options: p.brailleOptions || [],
            size_options: (p.sizeOptions || []).map((s: any) => ({ size: s.size, price: s.price })),
            badges: p.badges || [],
            rating: p.rating || 5,
            review_count: p.reviews || 0,
            in_stock: true,
            published: true,
            featured: false,
            slug: p.slug,
          });
        });
      });
      // Merge bestSellers (by id) — skip duplicates
      (bestSellersProducts as any[]).forEach((b) => {
        if (!flat.find((x) => x.id === b.id)) {
          flat.push({
            id: b.id,
            name: b.name,
            price: `$${b.price}`,
            category: 'best-sellers',
            description: b.description || '',
            image: b.image || '',
            images: [],
            materials: b.materials || [],
            features: b.features || [],
            color_options: b.colors || [],
            braille_options: [],
            size_options: [],
            badges: [],
            rating: b.rating || 5,
            review_count: b.reviewCount || 0,
            in_stock: true,
            published: true,
            featured: !!b.isNew,
          });
        }
      });
      const result = await apiFetch<{ imported: number; updated: number; total: number }>(
        API_ENDPOINTS.admin.productsBulkImport,
        { method: 'POST', auth: true, json: flat }
      );
      toast.success(
        `Imported ${result.imported} new + updated ${result.updated} (${result.total} total)`
      );
      load();
    } catch (e: any) {
      toast.error('Import failed: ' + e.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card data-testid="product-manager-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" /> Products ({products.length})
            </CardTitle>
            <CardDescription>
              Add, edit, and remove products. Changes save instantly to MongoDB and reflect on the live site.
            </CardDescription>
          </div>
          <Button onClick={openNew} data-testid="new-product-btn">
            <Plus className="h-4 w-4 mr-2" /> New Product
          </Button>
          <Button
            onClick={importCatalog}
            disabled={importing}
            variant="outline"
            className="ml-2"
            data-testid="import-catalog-btn"
          >
            <Upload className="h-4 w-4 mr-2" />
            {importing ? 'Importing…' : 'Import Existing Catalog'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading products…</p>
        ) : products.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No products yet. Click "New Product" to add your first one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="border rounded-lg p-4 bg-card flex flex-col"
                data-testid={`product-row-${p.id}`}
              >
                {p.image && (
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-32 object-cover rounded mb-3"
                    onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                  />
                )}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-sm">{p.name}</h3>
                  <div className="flex gap-1">
                    {p.featured && <Badge variant="default">Featured</Badge>}
                    {!p.published && <Badge variant="secondary">Draft</Badge>}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-1">{p.category}</p>
                <p className="font-medium text-primary mb-2">{p.price}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{p.description}</p>
                <div className="flex gap-2 mt-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(p)}
                    data-testid={`edit-product-${p.id}`}
                  >
                    <Edit2 className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => clone(p)}
                    title="Clone this product"
                    data-testid={`clone-product-${p.id}`}
                  >
                    <Copy className="h-3 w-3 mr-1" /> Clone
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => togglePublished(p)}
                    title={p.published ? 'Unpublish' : 'Publish'}
                    data-testid={`publish-toggle-${p.id}`}
                  >
                    {p.published ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleFeatured(p)}
                    title={p.featured ? 'Unfeature' : 'Feature'}
                    data-testid={`feature-toggle-${p.id}`}
                  >
                    <Star className={`h-3 w-3 ${p.featured ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="destructive"
                        data-testid={`delete-product-${p.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{p.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This cannot be undone. The product will be permanently removed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => remove(p.id)}
                          data-testid={`confirm-delete-${p.id}`}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? 'New Product' : `Edit: ${editing.name}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name *</Label>
              <Input
                value={editing.name || ''}
                onChange={(e) => setEditing((x) => ({ ...x, name: e.target.value }))}
                data-testid="product-name-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Price * (e.g. "from $58.00")</Label>
                <Input
                  value={editing.price || ''}
                  onChange={(e) => setEditing((x) => ({ ...x, price: e.target.value }))}
                  data-testid="product-price-input"
                />
              </div>
              <div>
                <Label>Category</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editing.category || 'restroom-signs'}
                  onChange={(e) => setEditing((x) => ({ ...x, category: e.target.value }))}
                  data-testid="product-category-input"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={editing.description || ''}
                onChange={(e) => setEditing((x) => ({ ...x, description: e.target.value }))}
                data-testid="product-description-input"
              />
            </div>
            <div>
              <Label>Main Image URL</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://... or /lovable-uploads/..."
                  value={editing.image || ''}
                  onChange={(e) => setEditing((x) => ({ ...x, image: e.target.value }))}
                  data-testid="product-image-input"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPickerOpen('main')}
                  data-testid="pick-main-image-btn"
                >
                  <ImageIcon className="h-4 w-4 mr-1" /> Pick
                </Button>
              </div>
              {editing.image && (
                <img
                  src={editing.image}
                  alt=""
                  className="mt-2 h-24 object-contain border rounded"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                />
              )}
            </div>
            <div>
              <Label>Gallery URLs (comma-separated)</Label>
              <Textarea
                rows={2}
                placeholder="url1, url2, url3"
                value={(editing.images || []).join(', ')}
                onChange={(e) =>
                  setEditing((x) => ({
                    ...x,
                    images: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Materials (comma-separated)</Label>
                <Input
                  value={(editing.materials || []).join(', ')}
                  onChange={(e) =>
                    setEditing((x) => ({
                      ...x,
                      materials: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    }))
                  }
                />
              </div>
              <div>
                <Label>Features (comma-separated)</Label>
                <Input
                  value={(editing.features || []).join(', ')}
                  onChange={(e) =>
                    setEditing((x) => ({
                      ...x,
                      features: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <Label>Color Options (comma-separated)</Label>
              <Input
                value={(editing.color_options || []).join(', ')}
                onChange={(e) =>
                  setEditing((x) => ({
                    ...x,
                    color_options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  }))
                }
              />
            </div>
            <div>
              <Label>Size Options (one per line, format: "size | price")</Label>
              <Textarea
                rows={3}
                placeholder="8 x 8 in | $58.00&#10;10 x 10 in | $65.00"
                value={(editing.size_options || []).map((s) => `${s.size} | ${s.price}`).join('\n')}
                onChange={(e) =>
                  setEditing((x) => ({
                    ...x,
                    size_options: e.target.value
                      .split('\n')
                      .map((line) => {
                        const [size, price] = line.split('|').map((s) => s.trim());
                        return size ? { size, price: price || '' } : null;
                      })
                      .filter(Boolean) as { size: string; price: string }[],
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center justify-between border rounded-md px-3 py-2">
                <Label>Published</Label>
                <Switch
                  checked={editing.published !== false}
                  onCheckedChange={(v) => setEditing((x) => ({ ...x, published: v }))}
                />
              </div>
              <div className="flex items-center justify-between border rounded-md px-3 py-2">
                <Label>Featured</Label>
                <Switch
                  checked={!!editing.featured}
                  onCheckedChange={(v) => setEditing((x) => ({ ...x, featured: v }))}
                />
              </div>
              <div className="flex items-center justify-between border rounded-md px-3 py-2">
                <Label>In Stock</Label>
                <Switch
                  checked={editing.in_stock !== false}
                  onCheckedChange={(v) => setEditing((x) => ({ ...x, in_stock: v }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} data-testid="save-product-btn">
              {isNew ? 'Create Product' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Media picker modal */}
      <Dialog open={!!pickerOpen} onOpenChange={(v) => !v && setPickerOpen(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pick an image from Media Library</DialogTitle>
          </DialogHeader>
          <MediaLibrary
            pickerMode
            onPick={(url) => {
              setEditing((x) => ({ ...x, image: url }));
              setPickerOpen(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};
