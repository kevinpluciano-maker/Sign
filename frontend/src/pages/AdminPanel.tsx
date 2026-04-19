import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import ImprovedFooter from '@/components/ImprovedFooter';
import SimpleWYSIWYGEditor from '@/components/admin/SimpleWYSIWYGEditor';
import { ProductManager } from '@/components/admin/ProductManager';
import { MediaLibrary } from '@/components/admin/MediaLibrary';
import { PricingManager } from '@/components/admin/PricingManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Lock, Settings, FileText, Home, Star, Trash2, Edit2, X, Check, Plus,
  Package, LogOut, BarChart3, Image as ImageIcon, Percent, CheckCircle2, EyeOff,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import SEO from '@/components/SEO';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import { API_ENDPOINTS } from '@/config/api';

interface ContentSection {
  id: string;
  name: string;
  content: string;
  fontSize: string;
  fontFamily: string;
}

interface Review {
  id: string;
  productId: string;
  productName: string;
  author: string;
  email?: string;
  rating: number;
  title: string;
  content: string;
  date: string;
  verified: boolean;
  helpful: number;
  featured?: boolean;
  status?: string;
}

const DEFAULT_SECTIONS: ContentSection[] = [
  {
    id: 'hero-title',
    name: 'Hero Section Title',
    content: '<h1>Professional Acrylic Braille Signs</h1>',
    fontSize: '48px',
    fontFamily: 'Inter',
  },
  {
    id: 'hero-description',
    name: 'Hero Section Description',
    content: '<p>Professional quality door signs, restroom signs, and custom architectural signage for modern workspaces.</p>',
    fontSize: '20px',
    fontFamily: 'Inter',
  },
  {
    id: 'about-content',
    name: 'About Page Content',
    content: '<p>We specialize in creating high-quality ADA compliant signage solutions.</p>',
    fontSize: '16px',
    fontFamily: 'Inter',
  },
  {
    id: 'footer-description',
    name: 'Footer Description',
    content: '<p>Premium acrylic braille signs and ADA compliant signage solutions.</p>',
    fontSize: '14px',
    fontFamily: 'Inter',
  },
];

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading, logout } = useAuth();
  const [sections, setSections] = useState<ContentSection[]>(DEFAULT_SECTIONS);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'approved' | 'pending' | 'hidden'>('all');
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', content: '', rating: 0, author: '' });
  const [stats, setStats] = useState<any>(null);

  // Manual-review creation (admin can add testimonials on behalf of customers)
  const [createReviewOpen, setCreateReviewOpen] = useState(false);
  const EMPTY_NEW_REVIEW = {
    product_id: '',
    author: '',
    rating: 5,
    title: '',
    content: '',
    status: 'approved' as 'approved' | 'pending' | 'hidden',
    featured: false,
    verified: true,
  };
  const [newReview, setNewReview] = useState(EMPTY_NEW_REVIEW);

  // Filter reviews based on the currently-selected status tab.
  // Legacy reviews without an explicit status are treated as 'approved'.
  const filteredReviews = useMemo(() => {
    if (reviewFilter === 'all') return reviews;
    return reviews.filter((r) => (r.status || 'approved') === reviewFilter);
  }, [reviews, reviewFilter]);

  // Route protection
  useEffect(() => {
    if (authLoading) return;
    if (!user || !isAdmin) {
      toast.error('Admin access required');
      navigate('/login');
    }
  }, [authLoading, user, isAdmin, navigate]);

  // Load data once authenticated
  useEffect(() => {
    if (!isAdmin) return;
    loadContentSections();
    loadReviews();
    loadStats();
  }, [isAdmin]);

  const loadStats = async () => {
    try {
      const data = await apiFetch<any>(API_ENDPOINTS.admin.stats, { auth: true });
      setStats(data);
    } catch (e) {
      /* non-critical */
    }
  };

  const loadContentSections = async () => {
    try {
      const data = await apiFetch<{ sections: any[] }>(API_ENDPOINTS.admin.content, { auth: true });
      const saved = data.sections || [];

      // Start with all curated defaults, overlaid with any DB content…
      const merged: ContentSection[] = DEFAULT_SECTIONS.map((def) => {
        const found = saved.find((s) => s.section_id === def.id);
        if (!found) return def;
        return {
          ...def,
          name: found.name || def.name,
          content: found.content || def.content,
          fontSize: found.font_size || def.fontSize,
          fontFamily: found.font_family || def.fontFamily,
        };
      });

      // …then append any DB-only sections the admin added dynamically.
      const defaultIds = new Set(DEFAULT_SECTIONS.map((d) => d.id));
      for (const s of saved) {
        if (!defaultIds.has(s.section_id)) {
          merged.push({
            id: s.section_id,
            name: s.name || s.section_id,
            content: s.content || '',
            fontSize: s.font_size || '16px',
            fontFamily: s.font_family || 'Inter',
          });
        }
      }

      setSections(merged);
    } catch (e: any) {
      toast.error('Failed to load content: ' + e.message);
    }
  };

  // Add a brand-new, fully-dynamic content section (WordPress-style).
  const addContentSection = async () => {
    const name = window.prompt(
      'Name your new section (e.g. "Summer Promo Banner"):'
    )?.trim();
    if (!name) return;
    // Derive a safe slug-like ID from the name
    const baseId = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || `section-${Date.now()}`;
    // Ensure uniqueness
    let id = baseId;
    let i = 2;
    while (sections.some((s) => s.id === id)) {
      id = `${baseId}-${i++}`;
    }

    try {
      await apiFetch(API_ENDPOINTS.admin.contentById(id), {
        method: 'PUT',
        auth: true,
        json: {
          name,
          content: '',
          font_size: '16px',
          font_family: 'Inter',
        },
      });
      setSections((prev) => [
        ...prev,
        { id, name, content: '', fontSize: '16px', fontFamily: 'Inter' },
      ]);
      toast.success(`Section "${name}" created`);
    } catch (e: any) {
      toast.error('Create failed: ' + e.message);
    }
  };

  // Delete a section entirely. Defaults can also be deleted (they'll reappear
  // on next reload because the code above seeds them), so we warn only for custom.
  const deleteContentSection = async (section: ContentSection) => {
    const isDefault = DEFAULT_SECTIONS.some((d) => d.id === section.id);
    const msg = isDefault
      ? `Delete "${section.name}"? This is a built-in section — it will reappear empty on next reload.`
      : `Delete "${section.name}"? This is permanent.`;
    if (!window.confirm(msg)) return;
    try {
      await apiFetch(API_ENDPOINTS.admin.contentById(section.id), {
        method: 'DELETE',
        auth: true,
      });
      setSections((prev) => prev.filter((s) => s.id !== section.id));
      toast.success('Section deleted');
    } catch (e: any) {
      toast.error('Delete failed: ' + e.message);
    }
  };

  const loadReviews = async () => {
    try {
      const data = await apiFetch<{ reviews: Review[] }>(API_ENDPOINTS.admin.reviews, {
        auth: true,
      });
      setReviews(data.reviews || []);
    } catch (e: any) {
      toast.error('Failed to load reviews: ' + e.message);
    }
  };

  const handleSaveSection = async (sectionId: string, data: any) => {
    try {
      await apiFetch(API_ENDPOINTS.admin.contentById(sectionId), {
        method: 'PUT',
        auth: true,
        json: {
          content: data.content,
          font_size: data.fontSize,
          font_family: data.fontFamily,
          plain_text: data.plainText,
        },
      });
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId
            ? { ...s, content: data.content, fontSize: data.fontSize, fontFamily: data.fontFamily }
            : s
        )
      );
      toast.success('Content saved successfully');
    } catch (e: any) {
      toast.error('Save failed: ' + e.message);
      throw e;
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Delete this review permanently?')) return;
    try {
      await apiFetch(API_ENDPOINTS.admin.reviewById(reviewId), {
        method: 'DELETE',
        auth: true,
      });
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      toast.success('Review deleted');
    } catch (e: any) {
      toast.error('Delete failed: ' + e.message);
    }
  };

  const startEditReview = (review: Review) => {
    setEditingReview(review.id);
    setEditForm({
      title: review.title,
      content: review.content,
      rating: review.rating,
      author: review.author,
    });
  };

  const handleSaveReview = async (reviewId: string) => {
    try {
      await apiFetch(API_ENDPOINTS.admin.reviewById(reviewId), {
        method: 'PUT',
        auth: true,
        json: editForm,
      });
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, ...editForm } : r)));
      setEditingReview(null);
      toast.success('Review updated');
    } catch (e: any) {
      toast.error('Update failed: ' + e.message);
    }
  };

  const toggleFeatureReview = async (r: Review) => {
    try {
      await apiFetch(API_ENDPOINTS.admin.reviewById(r.id), {
        method: 'PUT',
        auth: true,
        json: { featured: !r.featured },
      });
      setReviews((prev) => prev.map((x) => (x.id === r.id ? { ...x, featured: !x.featured } : x)));
    } catch (e: any) {
      toast.error('Toggle failed: ' + e.message);
    }
  };

  // Change a review's moderation status (approved / pending / hidden).
  const setReviewStatus = async (
    r: Review,
    status: 'approved' | 'pending' | 'hidden'
  ) => {
    try {
      await apiFetch(API_ENDPOINTS.admin.reviewById(r.id), {
        method: 'PUT',
        auth: true,
        json: { status },
      });
      setReviews((prev) => prev.map((x) => (x.id === r.id ? { ...x, status } : x)));
      toast.success(
        status === 'approved'
          ? 'Review approved — it will now show on the site'
          : status === 'hidden'
          ? 'Review hidden'
          : 'Review set to pending'
      );
    } catch (e: any) {
      toast.error('Status update failed: ' + e.message);
    }
  };

  // Admin manually adds a review (e.g. transcribing a printed testimonial).
  const submitNewReview = async () => {
    if (!newReview.product_id.trim() || !newReview.content.trim() || !newReview.author.trim()) {
      toast.error('Product ID, author, and content are required');
      return;
    }
    try {
      const created: any = await apiFetch(API_ENDPOINTS.admin.reviews, {
        method: 'POST',
        auth: true,
        json: newReview,
      });
      setReviews((prev) => [created, ...prev]);
      toast.success('Review added');
      setCreateReviewOpen(false);
      setNewReview(EMPTY_NEW_REVIEW);
    } catch (e: any) {
      toast.error('Add failed: ' + e.message);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <>
      <SEO title="Admin Panel - AB Signs" description="Admin panel" noIndex={true} />
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8" data-testid="admin-panel">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Admin Portal</h1>
              <p className="text-muted-foreground">
                Signed in as <span className="font-medium">{user.email}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6 text-primary" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  logout();
                  toast.success('Logged out');
                  navigate('/');
                }}
                data-testid="admin-logout-btn"
              >
                <LogOut className="h-4 w-4 mr-2" /> Log out
              </Button>
            </div>
          </div>

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <StatCard label="Products" value={stats.products} />
              <StatCard label="Reviews" value={stats.reviews} />
              <StatCard label="Orders" value={stats.orders} />
              <StatCard label="Subscribers" value={stats.newsletter_subscribers} />
              <StatCard label="Inquiries" value={stats.contact_submissions} />
            </div>
          )}

          <Tabs defaultValue="products" className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="products" data-testid="tab-products">
                <Package className="h-4 w-4 mr-1" /> Products
              </TabsTrigger>
              <TabsTrigger value="content" data-testid="tab-content">
                <FileText className="h-4 w-4 mr-1" /> Content
              </TabsTrigger>
              <TabsTrigger value="media" data-testid="tab-media">
                <ImageIcon className="h-4 w-4 mr-1" /> Media
              </TabsTrigger>
              <TabsTrigger value="pricing" data-testid="tab-pricing">
                <Percent className="h-4 w-4 mr-1" /> Pricing
              </TabsTrigger>
              <TabsTrigger value="reviews" data-testid="tab-reviews">
                <Star className="h-4 w-4 mr-1" /> Reviews
              </TabsTrigger>
              <TabsTrigger value="orders" data-testid="tab-orders">
                <BarChart3 className="h-4 w-4 mr-1" /> Orders
              </TabsTrigger>
              <TabsTrigger value="settings" data-testid="tab-settings">
                <Settings className="h-4 w-4 mr-1" /> Settings
              </TabsTrigger>
            </TabsList>

            {/* Products */}
            <TabsContent value="products" className="mt-6">
              <ProductManager />
            </TabsContent>

            {/* Content */}
            <TabsContent value="content" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Content Management</span>
                    <Button size="sm" onClick={addContentSection} data-testid="add-section-btn">
                      <Plus className="h-4 w-4 mr-1" /> New Section
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Edit any text across your site. Changes save to the database and sync everywhere.
                    Create custom sections (banners, promos, legal pages…) and delete ones you don't need.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {sections.map((section) => (
                      <div key={section.id} className="relative group">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteContentSection(section)}
                          className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
                          data-testid={`delete-section-${section.id}`}
                          title={`Delete "${section.name}"`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <SimpleWYSIWYGEditor
                          sectionId={section.id}
                          sectionName={section.name}
                          initialContent={section.content}
                          initialFontSize={section.fontSize}
                          initialFontFamily={section.fontFamily}
                          onSave={(data) => handleSaveSection(section.id, data)}
                        />
                      </div>
                    ))}
                    {sections.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        No sections yet. Click <strong>+ New Section</strong> to create your first one.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Media */}
            <TabsContent value="media" className="mt-6">
              <MediaLibrary />
            </TabsContent>

            {/* Pricing */}
            <TabsContent value="pricing" className="mt-6">
              <PricingManager />
            </TabsContent>

            {/* Reviews */}
            <TabsContent value="reviews" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Customer Reviews</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-normal text-muted-foreground">
                        {filteredReviews.length} / {reviews.length}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => setCreateReviewOpen(true)}
                        data-testid="add-review-btn"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add Review
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Approve new reviews before they appear on the site. Hide inappropriate ones. Feature the best on the homepage.
                  </CardDescription>
                  <div className="flex gap-2 mt-3" data-testid="review-filter-tabs">
                    {(['all', 'approved', 'pending', 'hidden'] as const).map((f) => (
                      <Button
                        key={f}
                        size="sm"
                        variant={reviewFilter === f ? 'default' : 'outline'}
                        onClick={() => setReviewFilter(f)}
                        data-testid={`review-filter-${f}`}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </Button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredReviews.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No reviews in this filter</p>
                  ) : (
                    <div className="space-y-4">
                      {filteredReviews.map((review) => (
                        <div
                          key={review.id}
                          className="border rounded-lg p-4 bg-card"
                          data-testid={`review-row-${review.id}`}
                        >
                          {editingReview === review.id ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Rating:</span>
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      onClick={() => setEditForm((x) => ({ ...x, rating: star }))}
                                    >
                                      <Star
                                        className={`h-5 w-5 ${
                                          star <= editForm.rating
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <Input
                                value={editForm.author}
                                onChange={(e) => setEditForm((x) => ({ ...x, author: e.target.value }))}
                                placeholder="Author"
                              />
                              <Input
                                value={editForm.title}
                                onChange={(e) => setEditForm((x) => ({ ...x, title: e.target.value }))}
                                placeholder="Title"
                              />
                              <Textarea
                                value={editForm.content}
                                onChange={(e) => setEditForm((x) => ({ ...x, content: e.target.value }))}
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleSaveReview(review.id)}>
                                  <Check className="h-4 w-4 mr-1" /> Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingReview(null)}>
                                  <X className="h-4 w-4 mr-1" /> Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-start justify-between mb-2 gap-2 flex-wrap">
                                <div>
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="font-semibold">{review.author}</span>
                                    <div className="flex">
                                      {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                          key={s}
                                          className={`h-4 w-4 ${
                                            s <= review.rating
                                              ? 'fill-yellow-400 text-yellow-400'
                                              : 'text-gray-300'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    {review.featured && (
                                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                        Featured
                                      </span>
                                    )}
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded ${
                                        (review.status || 'approved') === 'approved'
                                          ? 'bg-green-100 text-green-700'
                                          : (review.status || 'approved') === 'pending'
                                          ? 'bg-yellow-100 text-yellow-700'
                                          : 'bg-gray-200 text-gray-700'
                                      }`}
                                    >
                                      {(review.status || 'approved').toUpperCase()}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {review.productName} • {review.date}
                                  </p>
                                </div>
                                <div className="flex gap-1 flex-wrap">
                                  {(review.status || 'approved') !== 'approved' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setReviewStatus(review, 'approved')}
                                      data-testid={`approve-review-${review.id}`}
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                                    </Button>
                                  )}
                                  {(review.status || 'approved') !== 'hidden' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setReviewStatus(review, 'hidden')}
                                      title="Hide from public"
                                    >
                                      <EyeOff className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => toggleFeatureReview(review)}
                                    title={review.featured ? 'Unfeature' : 'Feature'}
                                  >
                                    <Star
                                      className={`h-4 w-4 ${
                                        review.featured ? 'fill-yellow-400 text-yellow-400' : ''
                                      }`}
                                    />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => startEditReview(review)}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteReview(review.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <h4 className="font-medium mb-1">{review.title}</h4>
                              <p className="text-sm text-muted-foreground">{review.content}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders */}
            <TabsContent value="orders" className="mt-6">
              <OrdersTab />
            </TabsContent>

            {/* Settings */}
            <TabsContent value="settings" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                  <CardDescription>Global configuration (coming soon)</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Coming in next release: pricing rules, media library, staff accounts, theme colors.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
        <ImprovedFooter />
      </div>

      {/* Manual review creation dialog */}
      <Dialog open={createReviewOpen} onOpenChange={setCreateReviewOpen}>
        <DialogContent className="max-w-lg" data-testid="add-review-dialog">
          <DialogHeader>
            <DialogTitle>Add Review Manually</DialogTitle>
            <DialogDescription>
              Add a testimonial on behalf of a customer. Admin-created reviews default to
              Approved so they appear on the site immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="nr-product">Product ID (slug) *</Label>
              <Input
                id="nr-product"
                placeholder="e.g. men-restroom-sign"
                value={newReview.product_id}
                onChange={(e) => setNewReview((x) => ({ ...x, product_id: e.target.value }))}
                data-testid="new-review-product"
              />
            </div>
            <div>
              <Label htmlFor="nr-author">Author *</Label>
              <Input
                id="nr-author"
                placeholder="Customer name"
                value={newReview.author}
                onChange={(e) => setNewReview((x) => ({ ...x, author: e.target.value }))}
                data-testid="new-review-author"
              />
            </div>
            <div>
              <Label>Rating</Label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setNewReview((x) => ({ ...x, rating: s }))}
                    className="p-1"
                    data-testid={`new-review-star-${s}`}
                  >
                    <Star
                      className={`h-6 w-6 ${
                        s <= newReview.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="nr-title">Title</Label>
              <Input
                id="nr-title"
                placeholder="Review headline (optional)"
                value={newReview.title}
                onChange={(e) => setNewReview((x) => ({ ...x, title: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="nr-content">Content *</Label>
              <Textarea
                id="nr-content"
                rows={4}
                placeholder="Review body"
                value={newReview.content}
                onChange={(e) => setNewReview((x) => ({ ...x, content: e.target.value }))}
                data-testid="new-review-content"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newReview.featured}
                  onChange={(e) => setNewReview((x) => ({ ...x, featured: e.target.checked }))}
                />
                Feature on homepage
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newReview.verified}
                  onChange={(e) => setNewReview((x) => ({ ...x, verified: e.target.checked }))}
                />
                Verified buyer
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateReviewOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitNewReview} data-testid="submit-new-review">
              Add Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <Card>
    <CardContent className="pt-6">
      <div className="text-3xl font-bold">{value ?? 0}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">{label}</div>
    </CardContent>
  </Card>
);

const OrdersTab = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    apiFetch<{ orders: any[] }>(API_ENDPOINTS.admin.orders, { auth: true })
      .then((d) => setOrders(d.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders ({orders.length})</CardTitle>
        <CardDescription>Read-only view of orders captured by the backend</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : orders.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No orders yet</p>
        ) : (
          <div className="space-y-2">
            {orders.map((o, i) => (
              <div key={i} className="border rounded p-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">
                    {o.order_id || o.id} — {o.customer_name}
                  </span>
                  <span className="font-semibold">${o.total}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {o.customer_email} • {(o.items || []).length} items
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminPanel;
