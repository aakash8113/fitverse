import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ordersApi } from '@/services/api';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Search, ChevronDown, ChevronUp, MapPin, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  COD: 'Cash on Delivery',
  CARD: 'Card',
  WALLET: 'Wallet',
};

const ORDER_STATUSES = [
  'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED',
];

const STATUS_TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'PROCESSING', label: 'Processing' },
  { key: 'SHIPPED', label: 'Shipped' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'CANCELLED', label: 'Cancelled' },
  { key: 'REFUNDED', label: 'Returned' },
];

const AdminOrders: React.FC = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: ordersApi.getAllOrders,
  });

  const orders: any[] = data?.data || [];

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ordersApi.updateOrderStatus(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      toast({ title: 'Order updated', description: 'Order status changed successfully.' });
    },
    onError: (err: any) => {
      toast({
        title: 'Update failed',
        description: err.response?.data?.message || 'Something went wrong.',
        variant: 'destructive',
      });
    },
  });

  const filtered = orders
    .filter((o) =>
      statusFilter === 'ALL' || o.status === statusFilter
    )
    .filter((o) =>
      !search.trim() ||
      o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.user?.email?.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Orders</h1>
            <p className="text-sm text-gray-500 mt-0.5">All customer orders</p>
          </div>
          <span className="text-sm text-gray-500">{orders.length} total</span>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-1 flex-wrap">
          {STATUS_TABS.map((tab) => {
            const count = tab.key === 'ALL' ? orders.length : orders.filter(o => o.status === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                  statusFilter === tab.key
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {tab.label}
                {count > 0 && (
                  <span className={cn('ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]',
                    statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-300 text-gray-700'
                  )}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by order #, name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading orders...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-sm text-gray-400">No orders found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 font-medium">Order #</th>
                    <th className="text-left px-5 py-3 font-medium">Customer</th>
                    <th className="text-left px-5 py-3 font-medium">Items</th>
                    <th className="text-left px-5 py-3 font-medium">Total</th>
                    <th className="text-left px-5 py-3 font-medium">Payment Mode</th>
                    <th className="text-left px-5 py-3 font-medium">Status</th>
                    <th className="text-left px-5 py-3 font-medium">Date</th>
                    <th className="text-left px-5 py-3 font-medium">Change Status</th>
                    <th className="px-5 py-3" />{/* expand */}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order: any, idx: number) => (
                    <React.Fragment key={order.id}>
                    <tr className={cn('border-b border-gray-100 last:border-0', idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                      <td className="px-5 py-3 font-mono text-xs text-gray-500">{order.orderNumber || `#${order.id.slice(-6).toUpperCase()}`}</td>
                      <td className="px-5 py-3">
                        <div>
                          <p className="text-gray-800 font-medium">{order.user?.name || '—'}</p>
                          <p className="text-xs text-gray-500">{order.user?.email || ''}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{(order.orderItems || order.items || []).length} item(s)</td>
                      <td className="px-5 py-3 text-gray-900 font-medium">₹{parseFloat(order.total || '0').toFixed(2)}</td>
                      <td className="px-5 py-3 text-gray-600 text-xs">
                        {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod || '—'}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={order.status?.toLowerCase() || 'pending'} />
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <Select
                          value={order.status}
                          onValueChange={(val) => updateMutation.mutate({ id: order.id, status: val })}
                        >
                          <SelectTrigger className="h-7 text-xs w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ORDER_STATUSES.map((s) => (
                              <SelectItem key={s} value={s} className="text-xs">
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => setExpandedId((prev) => prev === order.id ? null : order.id)}
                          className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-colors"
                        >
                          {expandedId === order.id
                            ? <ChevronUp className="h-4 w-4" />
                            : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </td>
                    </tr>
                    {expandedId === order.id && (
                      <tr className="bg-gray-50">
                        <td colSpan={9} className="px-5 py-4 border-b border-gray-100">
                          <div className="space-y-3">
                            {/* Delivery address */}
                            {order.address ? (
                              <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 text-xs">
                                <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-semibold text-blue-700">Deliver to: </span>
                                  <span className="text-blue-700">{order.address.name} &middot; {order.address.phone}</span>
                                  <span className="text-blue-600 ml-1">
                                    &mdash; {order.address.addressLine1}{order.address.addressLine2 ? `, ${order.address.addressLine2}` : ''}, {order.address.city}, {order.address.state} {order.address.zipCode}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 italic">No delivery address on record.</p>
                            )}
                            {/* Line items */}
                            <div className="space-y-2">
                              {(order.orderItems || order.items || []).map((item: any) => {
                                const img = item.productImage || item.product?.images?.[0];
                                const imgUrl = img?.startsWith('http') ? img : img ? `http://localhost:5000/${img}` : null;
                                return (
                                  <div key={item.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-lg p-3">
                                    {imgUrl ? (
                                      <img src={imgUrl} alt={item.productName || item.product?.name} className="h-12 w-12 rounded-lg object-cover border border-gray-200 shrink-0" />
                                    ) : (
                                      <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                        <Package className="h-5 w-5 text-gray-300" />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{item.productName || item.product?.name || '—'}</p>
                                      <p className="text-xs text-gray-500">Qty: {item.quantity} &middot; ₹{parseFloat(item.price || '0').toFixed(2)} each</p>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-800 shrink-0">₹{(parseFloat(item.price || '0') * item.quantity).toFixed(2)}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
