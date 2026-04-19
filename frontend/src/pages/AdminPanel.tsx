import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import ImprovedFooter from '@/components/ImprovedFooter';
import SimpleWYSIWYGEditor from '@/components/admin/SimpleWYSIWYGEditor';
import { ProductManager } from '@/components/admin/ProductManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Lock, Settings, FileText, Home, Star, Trash2, Edit2, X, Check,
  Package, LogOut, BarChart3,
} from 'lucide-react';
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
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', content: '', rating: 0, author: '' });
  const [stats, setStats] = useState<any>(null);

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
      const merged = DEFAULT_SECTIONS.map((def) => {
        const found = saved.find((s) => s.section_id === def.id);
        if (!found) return def;
        return {
          ...def,
          content: found.content || def.content,
          fontSize: found.font_size || def.fontSize,
          fontFamily: found.font_family || def.fontFamily,
        };
      });
      setSections(merged);
    } catch (e: any) {
      toast.error('Failed to load content: ' + e.message);
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
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="products" data-testid="tab-products">
                <Package className="h-4 w-4 mr-2" /> Products
              </TabsTrigger>
              <TabsTrigger value="content" data-testid="tab-content">
                <FileText className="h-4 w-4 mr-2" /> Content
              </TabsTrigger>
              <TabsTrigger value="reviews" data-testid="tab-reviews">
                <Star className="h-4 w-4 mr-2" /> Reviews
              </TabsTrigger>
              <TabsTrigger value="orders" data-testid="tab-orders">
                <BarChart3 className="h-4 w-4 mr-2" /> Orders
              </TabsTrigger>
              <TabsTrigger value="settings" data-testid="tab-settings">
                <Settings className="h-4 w-4 mr-2" /> Settings
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
                  <CardTitle>Content Management</CardTitle>
                  <CardDescription>
                    Edit text content across your website. Changes save to the database and sync everywhere.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {sections.map((section) => (
                      <SimpleWYSIWYGEditor
                        key={section.id}
                        sectionId={section.id}
                        sectionName={section.name}
                        initialContent={section.content}
                        initialFontSize={section.fontSize}
                        initialFontFamily={section.fontFamily}
                        onSave={(data) => handleSaveSection(section.id, data)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reviews */}
            <TabsContent value="reviews" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Customer Reviews</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {reviews.length} total
                    </span>
                  </CardTitle>
                  <CardDescription>
                    Edit, feature, or delete customer reviews. Featured reviews can be highlighted on the homepage.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {reviews.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No reviews yet</p>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review) => (
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
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
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
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {review.productName} • {review.date}
                                  </p>
                                </div>
                                <div className="flex gap-2">
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
