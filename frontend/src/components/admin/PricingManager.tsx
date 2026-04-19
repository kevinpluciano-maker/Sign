import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, DollarSign, Percent } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { API_ENDPOINTS } from '@/config/api';

interface Promo {
  code: string;
  discount_percent: number;
  active: boolean;
  description?: string;
}

interface PricingSettings {
  global_adjustment_percent: number;
  promos: Promo[];
  promo_banner_text: string;
  promo_banner_active: boolean;
}

const EMPTY: PricingSettings = {
  global_adjustment_percent: 0,
  promos: [],
  promo_banner_text: '',
  promo_banner_active: false,
};

export const PricingManager = () => {
  const [s, setS] = useState<PricingSettings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<PricingSettings>(API_ENDPOINTS.admin.pricing, { auth: true });
      setS({
        global_adjustment_percent: data.global_adjustment_percent ?? 0,
        promos: data.promos || [],
        promo_banner_text: data.promo_banner_text || '',
        promo_banner_active: !!data.promo_banner_active,
      });
    } catch (e: any) {
      toast.error('Failed to load pricing: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await apiFetch(API_ENDPOINTS.admin.pricing, {
        method: 'PUT',
        auth: true,
        json: s,
      });
      toast.success('Pricing saved');
    } catch (e: any) {
      toast.error('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const addPromo = () =>
    setS((x) => ({
      ...x,
      promos: [...x.promos, { code: 'NEW', discount_percent: 10, active: true, description: '' }],
    }));

  const updatePromo = (i: number, patch: Partial<Promo>) =>
    setS((x) => ({
      ...x,
      promos: x.promos.map((p, idx) => (idx === i ? { ...p, ...patch } : p)),
    }));

  const removePromo = (i: number) =>
    setS((x) => ({ ...x, promos: x.promos.filter((_, idx) => idx !== i) }));

  if (loading) return <p className="text-muted-foreground py-8 text-center">Loading pricing…</p>;

  return (
    <div className="space-y-6" data-testid="pricing-manager">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" /> Global Price Adjustment
          </CardTitle>
          <CardDescription>
            Applies to every product. Positive = markup (e.g. +15), negative = discount (e.g. -10).
            Storefront shows adjusted price.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 max-w-md">
            <div className="flex-1">
              <Label>Percent</Label>
              <Input
                type="number"
                step="0.1"
                value={s.global_adjustment_percent}
                onChange={(e) =>
                  setS((x) => ({
                    ...x,
                    global_adjustment_percent: parseFloat(e.target.value) || 0,
                  }))
                }
                data-testid="global-adjust-input"
              />
            </div>
            <span className="pb-3 text-muted-foreground">%</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" /> Promo Banner
          </CardTitle>
          <CardDescription>
            Site-wide announcement bar displayed at the top of the homepage when active.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            rows={2}
            placeholder="🎉 Spring Sale — 15% off with code SPRING"
            value={s.promo_banner_text}
            onChange={(e) => setS((x) => ({ ...x, promo_banner_text: e.target.value }))}
            data-testid="promo-banner-text"
          />
          <div className="flex items-center justify-between border rounded-md px-3 py-2">
            <Label>Banner Active</Label>
            <Switch
              checked={s.promo_banner_active}
              onCheckedChange={(v) => setS((x) => ({ ...x, promo_banner_active: v }))}
              data-testid="promo-banner-toggle"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Promo Codes ({s.promos.length})</CardTitle>
              <CardDescription>
                Codes customers can enter at checkout. Toggle active/inactive anytime.
              </CardDescription>
            </div>
            <Button onClick={addPromo} size="sm" data-testid="add-promo-btn">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {s.promos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No promo codes yet.</p>
          ) : (
            <div className="space-y-3">
              {s.promos.map((p, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center border rounded p-2"
                  data-testid={`promo-row-${i}`}
                >
                  <Input
                    className="md:col-span-3"
                    placeholder="CODE"
                    value={p.code}
                    onChange={(e) => updatePromo(i, { code: e.target.value.toUpperCase() })}
                  />
                  <div className="md:col-span-2 flex items-center gap-1">
                    <Input
                      type="number"
                      step="0.1"
                      value={p.discount_percent}
                      onChange={(e) =>
                        updatePromo(i, { discount_percent: parseFloat(e.target.value) || 0 })
                      }
                    />
                    <span className="text-sm">%</span>
                  </div>
                  <Input
                    className="md:col-span-5"
                    placeholder="Description"
                    value={p.description || ''}
                    onChange={(e) => updatePromo(i, { description: e.target.value })}
                  />
                  <div className="md:col-span-1 flex justify-center">
                    <Switch
                      checked={p.active}
                      onCheckedChange={(v) => updatePromo(i, { active: v })}
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removePromo(i)}
                    className="md:col-span-1 h-8"
                    data-testid={`remove-promo-${i}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} data-testid="save-pricing-btn">
          {saving ? 'Saving…' : 'Save All Pricing Settings'}
        </Button>
      </div>
    </div>
  );
};
