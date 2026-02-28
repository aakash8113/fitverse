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
import { Loader2, Search } from 'lucide-react';

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  COD: 'Cash on Delivery',
  CARD: 'Card',
  WALLET: 'Wallet',
};

const ORDER_STATUSES = [
  'PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED',
];

const AdminOrders: React.FC = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

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

  const filtered = search.trim()
    ? orders.filter(
        (o) =>
          o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
          o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
          o.user?.email?.toLowerCase().includes(search.toLowerCase())
      )
    : orders;

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
                    <th className="text-left px-5 py-3 font-medium">Payment</th>
                    <th className="text-left px-5 py-3 font-medium">Status</th>
                    <th className="text-left px-5 py-3 font-medium">Date</th>
                    <th className="text-left px-5 py-3 font-medium">Change Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order: any, idx: number) => (
                    <tr key={order.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
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
                    </tr>
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
