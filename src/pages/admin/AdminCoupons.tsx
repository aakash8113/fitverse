import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { couponsApi, Coupon, CouponDiscountType, CouponScope, CouponTarget } from '@/services/api';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  Search, Loader2, Plus, Pencil, Trash2, RotateCcw, Eye, Tag, UserX,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function discountLabel(c: Coupon) {
  if (c.discountType === 'PERCENTAGE') {
    const cap = c.maxDiscountAmount ? ` (max ₹${c.maxDiscountAmount})` : '';
    return `${c.discountValue}%${cap}`;
  }
  return `₹${c.discountValue}`;
}

const GENDER_OPTIONS = ['MALE', 'FEMALE'];
const WEAR_OPTIONS = ['TOPWEAR', 'BOTTOMWEAR', 'FOOTWEAR', 'ACCESSORIES', 'INNERWEAR', 'SPORTSWEAR'];

// ─── blank form ──────────────────────────────────────────────────────────────

function blankForm(): CouponFormData {
  return {
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    maxDiscountAmount: '',
    minOrderAmount: '',
    totalUsageLimit: '',
    perUserLimit: '1',
    isFirstOrderOnly: false,
    applicableTo: 'BOTH',
    scope: 'ALL',
    applicableGenders: [],
    applicableWearTypes: [],
    applicableCategories: '',
    isActive: true,
    startsAt: '',
    expiresAt: '',
    productIds: '',
  };
}

interface CouponFormData {
  code: string;
  description: string;
  discountType: CouponDiscountType;
  discountValue: string;
  maxDiscountAmount: string;
  minOrderAmount: string;
  totalUsageLimit: string;
  perUserLimit: string;
  isFirstOrderOnly: boolean;
  applicableTo: CouponTarget;
  scope: CouponScope;
  applicableGenders: string[];
  applicableWearTypes: string[];
  applicableCategories: string;
  isActive: boolean;
  startsAt: string;
  expiresAt: string;
  productIds: string;
}

function couponToForm(c: Coupon): CouponFormData {
  return {
    code: c.code,
    description: c.description ?? '',
    discountType: c.discountType,
    discountValue: String(c.discountValue),
    maxDiscountAmount: c.maxDiscountAmount != null ? String(c.maxDiscountAmount) : '',
    minOrderAmount: c.minOrderAmount != null ? String(c.minOrderAmount) : '',
    totalUsageLimit: c.totalUsageLimit != null ? String(c.totalUsageLimit) : '',
    perUserLimit: String(c.perUserLimit),
    isFirstOrderOnly: c.isFirstOrderOnly,
    applicableTo: c.applicableTo,
    scope: c.scope,
    applicableGenders: c.applicableGenders,
    applicableWearTypes: c.applicableWearTypes,
    applicableCategories: c.applicableCategories.join(', '),
    isActive: c.isActive,
    startsAt: c.startsAt ? c.startsAt.slice(0, 10) : '',
    expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '',
    productIds: '',
  };
}

function formToPayload(f: CouponFormData) {
  const payload: any = {
    code: f.code.toUpperCase().trim(),
    description: f.description || undefined,
    discountType: f.discountType,
    discountValue: Number(f.discountValue),
    maxDiscountAmount: f.maxDiscountAmount ? Number(f.maxDiscountAmount) : undefined,
    minOrderAmount: f.minOrderAmount ? Number(f.minOrderAmount) : undefined,
    totalUsageLimit: f.totalUsageLimit ? Number(f.totalUsageLimit) : undefined,
    perUserLimit: Number(f.perUserLimit) || 1,
    isFirstOrderOnly: f.isFirstOrderOnly,
    applicableTo: f.applicableTo,
    scope: f.scope,
    applicableGenders: f.applicableGenders,
    applicableWearTypes: f.applicableWearTypes,
    applicableCategories: f.applicableCategories
      ? f.applicableCategories.split(',').map((s) => s.trim()).filter(Boolean)
      : [],
    isActive: f.isActive,
    startsAt: f.startsAt || undefined,
    expiresAt: f.expiresAt || undefined,
  };
  if (f.scope === 'PRODUCT' && f.productIds.trim()) {
    payload.productIds = f.productIds.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return payload;
}

// ─── main component ──────────────────────────────────────────────────────────

const AdminCoupons: React.FC = () => {
  const qc = useQueryClient();

  // list state
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponFormData>(blankForm());

  const [usagesOpen, setUsagesOpen] = useState(false);
  const [usagesCoupon, setUsagesCoupon] = useState<Coupon | null>(null);

  const [blockOpen, setBlockOpen] = useState(false);
  const [blockCoupon, setBlockCoupon] = useState<Coupon | null>(null);
  const [blockUserId, setBlockUserId] = useState('');

  const [deleteConfirm, setDeleteConfirm] = useState<Coupon | null>(null);

  // ─── queries ────────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => couponsApi.listCoupons({ limit: 200 }),
  });

  const { data: usagesData, isLoading: usagesLoading } = useQuery({
    queryKey: ['admin-coupon-usages', usagesCoupon?.id],
    queryFn: () => couponsApi.getCouponUsages(usagesCoupon!.id),
    enabled: !!usagesCoupon,
  });

  // ─── mutations ───────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (payload: any) => couponsApi.createCoupon(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast({ title: 'Coupon created' });
      setFormOpen(false);
    },
    onError: (e: any) => toast({ title: 'Error', description: e.response?.data?.message || 'Failed', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => couponsApi.updateCoupon(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast({ title: 'Coupon updated' });
      setFormOpen(false);
    },
    onError: (e: any) => toast({ title: 'Error', description: e.response?.data?.message || 'Failed', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => couponsApi.deleteCoupon(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast({ title: 'Coupon deleted' });
      setDeleteConfirm(null);
    },
    onError: (e: any) => toast({ title: 'Error', description: e.response?.data?.message || 'Failed', variant: 'destructive' }),
  });

  const resetMutation = useMutation({
    mutationFn: (id: string) => couponsApi.resetUsageCount(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast({ title: 'Usage count reset to 0' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.response?.data?.message || 'Failed', variant: 'destructive' }),
  });

  const blockMutation = useMutation({
    mutationFn: ({ couponId, userId }: { couponId: string; userId: string }) =>
      couponsApi.blockUser(couponId, userId),
    onSuccess: () => {
      toast({ title: 'User blocked from coupon' });
      setBlockUserId('');
    },
    onError: (e: any) => toast({ title: 'Error', description: e.response?.data?.message || 'Failed', variant: 'destructive' }),
  });

  // ─── derived ─────────────────────────────────────────────────────────────────

  const coupons: Coupon[] = (data as any)?.data?.coupons ?? (data as any)?.coupons ?? [];

  const filtered = coupons
    .filter((c) => {
      if (activeFilter === 'active') return c.isActive;
      if (activeFilter === 'inactive') return !c.isActive;
      return true;
    })
    .filter((c) =>
      !search.trim() || c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase())
    );

  // ─── form helpers ─────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditTarget(null);
    setForm(blankForm());
    setFormOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditTarget(c);
    setForm(couponToForm(c));
    setFormOpen(true);
  };

  const handleSubmit = () => {
    if (!form.code.trim()) return toast({ title: 'Code is required', variant: 'destructive' });
    if (!form.discountValue || Number(form.discountValue) <= 0)
      return toast({ title: 'Discount value must be > 0', variant: 'destructive' });
    const payload = formToPayload(form);
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const toggle = (field: keyof CouponFormData, checked: boolean) =>
    setForm((p) => ({ ...p, [field]: checked }));

  const toggleMulti = (field: 'applicableGenders' | 'applicableWearTypes', val: string) => {
    setForm((p) => {
      const arr = p[field] as string[];
      return { ...p, [field]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val] };
    });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const usages: any[] = (usagesData as any)?.data ?? [];

  // ─── render ───────────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Coupons</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{coupons.length} total</p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New Coupon
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by code or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <div className="flex rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden text-sm">
            {(['all', 'active', 'inactive'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={cn(
                  'px-3 py-1.5 capitalize transition-colors',
                  activeFilter === f
                    ? 'bg-zinc-900 dark:bg-gray-100 text-white dark:text-gray-900'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Tag className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No coupons found</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3 whitespace-nowrap">Code</th>
                  <th className="px-4 py-3 whitespace-nowrap">Discount</th>
                  <th className="px-4 py-3 whitespace-nowrap">Applies To</th>
                  <th className="px-4 py-3 whitespace-nowrap">Scope</th>
                  <th className="px-4 py-3 whitespace-nowrap">Min Order</th>
                  <th className="px-4 py-3 whitespace-nowrap">Usage</th>
                  <th className="px-4 py-3 whitespace-nowrap">Expires</th>
                  <th className="px-4 py-3 whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono font-semibold text-zinc-900 dark:text-white">{c.code}</div>
                      {c.description && (
                        <div className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[180px]">{c.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium dark:text-gray-200">{discountLabel(c)}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          c.applicableTo === 'SHOP' && 'border-blue-300 text-blue-700',
                          c.applicableTo === 'THRIFT' && 'border-purple-300 text-purple-700',
                          c.applicableTo === 'BOTH' && 'border-gray-300 text-gray-700',
                        )}
                      >
                        {c.applicableTo}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{c.scope}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {c.minOrderAmount ? `₹${c.minOrderAmount}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-800 dark:text-gray-200">{c.usageCount}</span>
                      {c.totalUsageLimit && (
                        <span className="text-gray-400 dark:text-gray-500"> / {c.totalUsageLimit}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatDate(c.expiresAt)}</td>
                    <td className="px-4 py-3">
                      <Badge
                        className={cn(
                          'text-xs',
                          c.isActive
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600'
                        )}
                        variant="outline"
                      >
                        {c.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          title="View usages"
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                          onClick={() => { setUsagesCoupon(c); setUsagesOpen(true); }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          title="Edit"
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                          onClick={() => openEdit(c)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          title="Reset usage count"
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-yellow-600"
                          onClick={() => resetMutation.mutate(c.id)}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                        <button
                          title="Block a user"
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-orange-600"
                          onClick={() => { setBlockCoupon(c); setBlockOpen(true); }}
                        >
                          <UserX className="h-3.5 w-3.5" />
                        </button>
                        <button
                          title="Delete"
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-red-600"
                          onClick={() => setDeleteConfirm(c)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create / Edit Dialog ──────────────────────────────────────────────── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Coupon' : 'New Coupon'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">

            {/* Code */}
            <div className="space-y-1">
              <Label>Code *</Label>
              <Input
                placeholder="SUMMER20"
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                className="font-mono uppercase"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label>Description</Label>
              <Input
                placeholder="Short description (optional)"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>

            {/* Discount Type */}
            <div className="space-y-1">
              <Label>Discount Type *</Label>
              <Select
                value={form.discountType}
                onValueChange={(v) => setForm((p) => ({ ...p, discountType: v as CouponDiscountType }))}
              >
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                  <SelectItem value="FLAT">Flat (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Discount Value */}
            <div className="space-y-1">
              <Label>{form.discountType === 'PERCENTAGE' ? 'Percentage *' : 'Amount (₹) *'}</Label>
              <Input
                type="number"
                min={0}
                placeholder={form.discountType === 'PERCENTAGE' ? 'e.g. 20' : 'e.g. 100'}
                value={form.discountValue}
                onChange={(e) => setForm((p) => ({ ...p, discountValue: e.target.value }))}
              />
            </div>

            {/* Max Discount (only for PERCENTAGE) */}
            {form.discountType === 'PERCENTAGE' && (
              <div className="space-y-1">
                <Label>Max Discount Amount (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="e.g. 500 (leave blank for no cap)"
                  value={form.maxDiscountAmount}
                  onChange={(e) => setForm((p) => ({ ...p, maxDiscountAmount: e.target.value }))}
                />
              </div>
            )}

            {/* Min Order Amount */}
            <div className="space-y-1">
              <Label>Min Order Amount (₹)</Label>
              <Input
                type="number"
                min={0}
                placeholder="e.g. 500 (leave blank for none)"
                value={form.minOrderAmount}
                onChange={(e) => setForm((p) => ({ ...p, minOrderAmount: e.target.value }))}
              />
            </div>

            {/* Total Usage Limit */}
            <div className="space-y-1">
              <Label>Total Usage Limit</Label>
              <Input
                type="number"
                min={1}
                placeholder="Leave blank for unlimited"
                value={form.totalUsageLimit}
                onChange={(e) => setForm((p) => ({ ...p, totalUsageLimit: e.target.value }))}
              />
            </div>

            {/* Per User Limit */}
            <div className="space-y-1">
              <Label>Per-User Limit</Label>
              <Input
                type="number"
                min={1}
                placeholder="1"
                value={form.perUserLimit}
                onChange={(e) => setForm((p) => ({ ...p, perUserLimit: e.target.value }))}
              />
            </div>

            {/* Applies To */}
            <div className="space-y-1">
              <Label>Applies To</Label>
              <Select
                value={form.applicableTo}
                onValueChange={(v) => setForm((p) => ({ ...p, applicableTo: v as CouponTarget }))}
              >
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SHOP">Shop only</SelectItem>
                  <SelectItem value="THRIFT">Thrift only</SelectItem>
                  <SelectItem value="BOTH">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Scope */}
            <div className="space-y-1">
              <Label>Scope</Label>
              <Select
                value={form.scope}
                onValueChange={(v) => setForm((p) => ({ ...p, scope: v as CouponScope }))}
              >
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All products</SelectItem>
                  <SelectItem value="CATEGORY">Specific categories</SelectItem>
                  <SelectItem value="PRODUCT">Specific products</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Applicable Categories (only when scope = CATEGORY) */}
            {form.scope === 'CATEGORY' && (
              <div className="space-y-1 sm:col-span-2">
                <Label>Applicable Categories <span className="text-gray-400 font-normal">(comma-separated)</span></Label>
                <Input
                  placeholder="e.g. TOPS, BOTTOMS, DRESSES"
                  value={form.applicableCategories}
                  onChange={(e) => setForm((p) => ({ ...p, applicableCategories: e.target.value }))}
                />
              </div>
            )}

            {/* Product IDs (only when scope = PRODUCT) */}
            {form.scope === 'PRODUCT' && (
              <div className="space-y-1 sm:col-span-2">
                <Label>Product IDs <span className="text-gray-400 font-normal">(comma-separated UUIDs)</span></Label>
                <Input
                  placeholder="paste product ids separated by commas"
                  value={form.productIds}
                  onChange={(e) => setForm((p) => ({ ...p, productIds: e.target.value }))}
                />
              </div>
            )}

            {/* Applicable Genders */}
            <div className="space-y-1 sm:col-span-2">
              <Label>Applicable Genders <span className="text-gray-400 font-normal">(leave blank for all)</span></Label>
              <div className="flex gap-2 flex-wrap">
                {GENDER_OPTIONS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleMulti('applicableGenders', g)}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs border transition-colors',
                      form.applicableGenders.includes(g)
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Applicable Wear Types */}
            <div className="space-y-1 sm:col-span-2">
              <Label>Applicable Wear Types <span className="text-gray-400 font-normal">(leave blank for all)</span></Label>
              <div className="flex gap-2 flex-wrap">
                {WEAR_OPTIONS.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => toggleMulti('applicableWearTypes', w)}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs border transition-colors',
                      form.applicableWearTypes.includes(w)
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                    )}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Start Date */}
            <div className="space-y-1">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={form.startsAt}
                onChange={(e) => setForm((p) => ({ ...p, startsAt: e.target.value }))}
              />
            </div>

            {/* Expiry Date */}
            <div className="space-y-1">
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
              />
            </div>

            {/* Toggles row */}
            <div className="sm:col-span-2 flex flex-wrap gap-6 pt-1">
              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  checked={form.isActive}
                  onCheckedChange={(v) => toggle('isActive', v)}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="isFirstOrderOnly"
                  checked={form.isFirstOrderOnly}
                  onCheckedChange={(v) => toggle('isFirstOrderOnly', v)}
                />
                <Label htmlFor="isFirstOrderOnly">First Order Only</Label>
              </div>
            </div>

          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editTarget ? 'Save Changes' : 'Create Coupon'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Usages Dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={usagesOpen} onOpenChange={(o) => { setUsagesOpen(o); if (!o) setUsagesCoupon(null); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Usage History — <span className="font-mono">{usagesCoupon?.code}</span>
            </DialogTitle>
          </DialogHeader>
          {usagesLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
          ) : usages.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No usages yet.</p>
          ) : (
            <div className="space-y-2 mt-2">
              {usages.map((u: any) => (
                <div key={u.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium">{u.user?.name ?? u.userId}</p>
                    <p className="text-xs text-gray-400">{u.user?.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Order #{u.order?.orderNumber ?? u.orderId?.slice(-6)}</p>
                    <p className="text-xs text-gray-400">{formatDate(u.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setUsagesOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Block User Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={blockOpen} onOpenChange={(o) => { setBlockOpen(o); if (!o) { setBlockCoupon(null); setBlockUserId(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Block User from <span className="font-mono">{blockCoupon?.code}</span></DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>User ID</Label>
            <Input
              placeholder="Paste user UUID"
              value={blockUserId}
              onChange={(e) => setBlockUserId(e.target.value.trim())}
            />
            <p className="text-xs text-gray-400">You can copy the user ID from the Users admin page.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!blockUserId || blockMutation.isPending}
              onClick={() => {
                if (!blockCoupon || !blockUserId) return;
                blockMutation.mutate(
                  { couponId: blockCoupon.id, userId: blockUserId },
                  { onSuccess: () => { setBlockOpen(false); setBlockCoupon(null); setBlockUserId(''); } }
                );
              }}
            >
              {blockMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Block User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ─────────────────────────────────────────────── */}
      <Dialog open={!!deleteConfirm} onOpenChange={(o) => { if (!o) setDeleteConfirm(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Coupon</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            Are you sure you want to delete <strong className="font-mono">{deleteConfirm?.code}</strong>?
            This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </AdminLayout>
  );
};

export default AdminCoupons;
