import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { adminSellerApi, AdminSellerProduct, getTotalStock } from '@/services/api';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import {
  Loader2, CheckCircle, XCircle, Search, ImagePlus,
} from 'lucide-react';

const STATUS_FILTERS = ['ALL', 'REQUESTED', 'PRICE_UPDATE_REQUESTED', 'APPROVED', 'REJECTED'];

const AdminSellerProducts: React.FC = () => {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [approveDialog, setApproveDialog] = useState<{ product: AdminSellerProduct; open: boolean }>({ product: null as any, open: false });
  const [rejectDialog, setRejectDialog] = useState<{ product: AdminSellerProduct; open: boolean }>({ product: null as any, open: false });
  const [finalPrice, setFinalPrice] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'seller-requests', statusFilter],
    queryFn: () => adminSellerApi.getRequests({ status: statusFilter !== 'ALL' ? statusFilter : undefined, limit: 50 }),
  });

  const result = data?.data as any;
  const products: AdminSellerProduct[] = result?.products || [];

  const filtered = products.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.seller?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const approveMutation = useMutation({
    mutationFn: ({ id, price }: { id: string; price: number }) => adminSellerApi.approveProduct(id, price),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'seller-requests'] });
      toast({ title: 'Product approved' });
      setApproveDialog({ product: null as any, open: false });
    },
    onError: (e: any) => toast({ title: 'Error', description: e?.response?.data?.message || 'Approval failed', variant: 'destructive' }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => adminSellerApi.rejectProduct(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'seller-requests'] });
      toast({ title: 'Product rejected' });
      setRejectDialog({ product: null as any, open: false });
    },
    onError: (e: any) => toast({ title: 'Error', description: e?.response?.data?.message || 'Rejection failed', variant: 'destructive' }),
  });

  const openApprove = (p: AdminSellerProduct) => {
    setFinalPrice(String(p.price));
    setApproveDialog({ product: p, open: true });
  };

  const openReject = (p: AdminSellerProduct) => {
    setRejectReason('');
    setRejectDialog({ product: p, open: true });
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Seller Products</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Review and approve seller product listings</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search product or seller..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`text-xs px-3 py-1.5 rounded border transition-colors ${statusFilter === s ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
              >
                {s === 'ALL' ? 'All' : s === 'PRICE_UPDATE_REQUESTED' ? 'Price Update' : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">No seller products found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 border-b">
                    <th className="text-left px-4 py-3 font-medium">Product</th>
                    <th className="text-left px-4 py-3 font-medium">Seller</th>
                    <th className="text-left px-4 py-3 font-medium">Seller Price</th>
                    <th className="text-left px-4 py-3 font-medium">Listed Price</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p: AdminSellerProduct, idx: number) => (
                    <tr key={p.id} className={`border-b last:border-0 ${idx % 2 === 0 ? '' : 'bg-gray-50/40 dark:bg-gray-800/20'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded border bg-gray-100 overflow-hidden shrink-0">
                            {p.images?.[0] ? <img src={p.images[0]} alt="" className="h-full w-full object-cover" /> : <div className="h-full flex items-center justify-center text-gray-300"><ImagePlus className="h-4 w-4" /></div>}
                          </div>
                          <span className="font-medium text-gray-800 dark:text-gray-200 line-clamp-1">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.seller?.name || '—'}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">₹{p.sellerPrice ? Number(p.sellerPrice).toFixed(2) : '—'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">₹{Number(p.price).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={(p.sellerApprovalStatus || 'unknown').toLowerCase()} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {(p.sellerApprovalStatus === 'REQUESTED' || p.sellerApprovalStatus === 'PRICE_UPDATE_REQUESTED') && (
                            <>
                              <button onClick={() => openApprove(p)} className="text-emerald-600 hover:text-emerald-700 p-1 rounded hover:bg-emerald-50 transition-colors" title="Approve">
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button onClick={() => openReject(p)} className="text-red-500 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors" title="Reject">
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Approve Dialog */}
      <Dialog open={approveDialog.open} onOpenChange={(o) => setApproveDialog({ ...approveDialog, open: o })}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Approve Product</DialogTitle></DialogHeader>
          {approveDialog.product && (
            <div className="space-y-4">
              <div className="text-sm bg-gray-50 rounded-lg p-3">
                <p className="font-medium">{approveDialog.product.name}</p>
                <p className="text-xs text-gray-500">Seller: {approveDialog.product.seller?.name}</p>
                <p className="text-xs text-gray-500">Seller's price: ₹{Number(approveDialog.product.sellerPrice || 0).toFixed(2)}</p>
              </div>
              <div className="space-y-2">
                <Label>Final Listing Price (₹)</Label>
                <Input type="number" step="0.01" value={finalPrice} onChange={(e) => setFinalPrice(e.target.value)} />
                <p className="text-xs text-gray-400">Admin's margin: ₹{Math.max(0, (parseFloat(finalPrice) || 0) - (approveDialog.product.sellerPrice ? parseFloat(String(approveDialog.product.sellerPrice)) : 0)).toFixed(2)}</p>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setApproveDialog({ product: null as any, open: false })}>Cancel</Button>
                <Button size="sm" disabled={approveMutation.isPending || !finalPrice} className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => approveMutation.mutate({ id: approveDialog.product.id, price: parseFloat(finalPrice) })}>
                  {approveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                  Approve & List
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(o) => setRejectDialog({ ...rejectDialog, open: o })}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Reject Product</DialogTitle></DialogHeader>
          {rejectDialog.product && (
            <div className="space-y-4">
              <p className="text-sm">Reject <strong>{rejectDialog.product.name}</strong>?</p>
              <div className="space-y-2">
                <Label>Reason (optional)</Label>
                <Input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. Image quality issue" />
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setRejectDialog({ product: null as any, open: false })}>Cancel</Button>
                <Button variant="destructive" size="sm" disabled={rejectMutation.isPending}
                  onClick={() => rejectMutation.mutate({ id: rejectDialog.product.id, reason: rejectReason || undefined })}>
                  {rejectMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                  Reject
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminSellerProducts;