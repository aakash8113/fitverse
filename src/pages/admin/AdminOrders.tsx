import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ordersApi, shippingApi } from '@/services/api';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Search, ChevronDown, ChevronUp, MapPin, Package, Truck, ExternalLink, Send, Download, Ruler } from 'lucide-react';
import { cn } from '@/lib/utils';

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  COD: 'Cash on Delivery',
  CARD: 'Card',
  WALLET: 'Wallet',
  COINS: 'Coins',
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

// Standard weight/dimensions by category — matches backend shippingService
const CATEGORY_DIMS: Record<string, { weight: number; length: number; breadth: number; height: number }> = {
  TSHIRT:     { weight: 200,  length: 30, breadth: 20, height: 3  },
  SHIRT:      { weight: 250,  length: 30, breadth: 25, height: 4  },
  HOODIE:     { weight: 400,  length: 35, breadth: 28, height: 8  },
  JACKET:     { weight: 500,  length: 40, breadth: 30, height: 10 },
  KURTI:      { weight: 350,  length: 35, breadth: 25, height: 8  },
  GOWN:       { weight: 600,  length: 45, breadth: 30, height: 12 },
  JEANS:      { weight: 500,  length: 35, breadth: 25, height: 6  },
  TROUSER:    { weight: 400,  length: 35, breadth: 25, height: 5  },
  TRACKPANT:  { weight: 350,  length: 30, breadth: 25, height: 5  },
  CARGO:      { weight: 450,  length: 35, breadth: 25, height: 6  },
  SLAX:       { weight: 400,  length: 35, breadth: 25, height: 5  },
};

/** Calculate estimated total weight (kg) and max dimensions for an order's items */
const calcEstimatedDims = (items: any[]) => {
  let totalWeight = 0, maxL = 0, maxB = 0, maxH = 0;
  for (const item of items) {
    const cat = item.product?.category || '';
    const d = CATEGORY_DIMS[cat] || CATEGORY_DIMS.TSHIRT;
    const qty = item.quantity || 1;
    totalWeight += (d.weight / 1000) * qty;
    if (d.length > maxL) maxL = d.length;
    if (d.breadth > maxB) maxB = d.breadth;
    if (d.height > maxH) maxH = d.height;
  }
  maxH = maxH * Math.max(1, Math.ceil(items.length / 3));
  return {
    weight: Math.round(totalWeight * 100) / 100,
    length: Math.max(10, maxL),
    breadth: Math.max(10, maxB),
    height: Math.max(1, maxH),
  };
};

const AdminOrders: React.FC = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sendingOrderId, setSendingOrderId] = useState<string | null>(null);
  const [showDimensions, setShowDimensions] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<Record<string, { weight?: number; length?: number; breadth?: number; height?: number }>>({});

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

  const sendToShiprocketMutation = useMutation({
    mutationFn: ({ orderId, dimensions }: { orderId: string; dimensions?: any }) =>
      shippingApi.sendToShiprocket(orderId, dimensions || {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      setSendingOrderId(null);
      setShowDimensions(null);
      toast({ title: 'Sent to Shiprocket', description: 'Order has been sent to Shiprocket for fulfillment.' });
    },
    onError: (err: any) => {
      setSendingOrderId(null);
      toast({
        title: 'Shiprocket failed',
        description: err.response?.data?.message || 'Failed to send order to Shiprocket.',
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

  const handleSendToShiprocket = (orderId: string) => {
    const dims = dimensions[orderId];
    const hasDims = dims && (dims.weight || dims.length);
    sendToShiprocketMutation.mutate({
      orderId,
      dimensions: hasDims ? {
        weight: Number(dims.weight) || undefined,
        length: Number(dims.length) || undefined,
        breadth: Number(dims.breadth) || undefined,
        height: Number(dims.height) || undefined,
      } : undefined,
    });
  };

  const updateDim = (orderId: string, field: string, value: string) => {
    setDimensions(prev => ({
      ...prev,
      [orderId]: { ...(prev[orderId] || {}), [field]: value ? Number(value) : undefined }
    }));
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Orders</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">All customer orders</p>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">{orders.length} total</span>
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
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                {tab.label}
                {count > 0 && (
                  <span className={cn('ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]',
                    statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
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
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
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
                  <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left px-5 py-3 font-medium">Order #</th>
                    <th className="text-left px-5 py-3 font-medium">Customer</th>
                    <th className="text-left px-5 py-3 font-medium">Items</th>
                    <th className="text-left px-5 py-3 font-medium">Total</th>
                    <th className="text-left px-5 py-3 font-medium">Payment</th>
                    <th className="text-left px-5 py-3 font-medium">Shipping</th>
                    <th className="text-left px-5 py-3 font-medium">Status</th>
                    <th className="text-left px-5 py-3 font-medium">Date</th>
                    <th className="text-left px-5 py-3 font-medium">Actions</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order: any, idx: number) => {
                    const shipInfo = order.shippingInfo;
                    const isShiprocket = shipInfo?.method === 'SHIPROCKET';
                    const canSendToShiprocket = order.status === 'PROCESSING' && !order.shippingMethod;

                    return (
                    <React.Fragment key={order.id}>
                    <tr className={cn('border-b border-gray-100 dark:border-gray-800 last:border-0', idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/30')}>
                      <td className="px-5 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">{order.orderNumber || `#${order.id.slice(-6).toUpperCase()}`}</td>
                      <td className="px-5 py-3">
                        <div>
                          <p className="text-gray-800 dark:text-gray-200 font-medium">{order.user?.name || '—'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{order.user?.email || ''}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{(order.orderItems || order.items || []).length} item(s)</td>
                      <td className="px-5 py-3 text-gray-900 dark:text-white font-medium">₹{parseFloat(order.total || '0').toFixed(2)}</td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300 text-xs">
                        {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod || '—'}
                      </td>
                      <td className="px-5 py-3">
                        {isShiprocket ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full">
                            <Truck className="h-3 w-3" />
                            Shiprocket
                          </span>
                        ) : order.shippingMethod === 'ADMIN' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-300 px-2 py-0.5 rounded-full">
                            Admin
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500 italic">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={order.status?.toLowerCase() || 'processing'} />
                      </td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* ── Unassigned PROCESSING order: show Shiprocket + dimension button + Deliver Myself ── */}
                          {canSendToShiprocket && (
                            <>
                              {showDimensions === order.id ? (
                                <div className="flex items-center gap-1 bg-white border rounded p-1.5">
                                  <Input
                                    placeholder="Wt kg"
                                    className="h-6 w-14 text-[10px]"
                                    value={dimensions[order.id]?.weight ?? ''}
                                    onChange={e => updateDim(order.id, 'weight', e.target.value)}
                                  />
                                  <Input
                                    placeholder="L cm"
                                    className="h-6 w-12 text-[10px]"
                                    value={dimensions[order.id]?.length ?? ''}
                                    onChange={e => updateDim(order.id, 'length', e.target.value)}
                                  />
                                  <Input
                                    placeholder="B cm"
                                    className="h-6 w-12 text-[10px]"
                                    value={dimensions[order.id]?.breadth ?? ''}
                                    onChange={e => updateDim(order.id, 'breadth', e.target.value)}
                                  />
                                  <Input
                                    placeholder="H cm"
                                    className="h-6 w-12 text-[10px]"
                                    value={dimensions[order.id]?.height ?? ''}
                                    onChange={e => updateDim(order.id, 'height', e.target.value)}
                                  />
                                  <Button
                                    size="sm"
                                    className="h-6 text-[10px] px-2 bg-blue-600 text-white"
                                    disabled={sendToShiprocketMutation.isPending && sendingOrderId === order.id}
                                    onClick={() => {
                                      setSendingOrderId(order.id);
                                      handleSendToShiprocket(order.id);
                                    }}
                                  >
                                    {sendToShiprocketMutation.isPending && sendingOrderId === order.id
                                      ? <Loader2 className="h-3 w-3 animate-spin" />
                                      : 'Send'}
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-[11px] whitespace-nowrap border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400"
                                    onClick={() => {
                                      // Pre-fill estimated dimensions from category defaults
                                      const items = order.orderItems || order.items || [];
                                      const estimated = calcEstimatedDims(items);
                                      setDimensions(prev => ({
                                        ...prev,
                                        [order.id]: estimated,
                                      }));
                                      setShowDimensions(order.id);
                                    }}
                                  >
                                    <Send className="h-3 w-3 mr-1" />
                                    Shiprocket
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-[11px] whitespace-nowrap border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400"
                                    onClick={async () => {
                                      try {
                                        await shippingApi.markAsAdminShipment(order.id);
                                        qc.invalidateQueries({ queryKey: ['admin-orders'] });
                                        toast({ title: 'Admin shipment', description: 'Order marked for admin delivery.' });
                                      } catch (err: any) {
                                        toast({ title: 'Failed', description: err.response?.data?.message || 'Error', variant: 'destructive' });
                                      }
                                    }}
                                  >
                                   &nbsp;  Deliver Myself  &nbsp;
                                  </Button>
                                </>
                              )}
                            </>
                          )}

                          {/* ── ADMIN-managed order: show status dropdown ── */}
                          {!isShiprocket && !canSendToShiprocket && (
                            <Select
                              value={order.status}
                              onValueChange={(val) => updateMutation.mutate({ id: order.id, status: val })}
                            >
                              <SelectTrigger className="h-7 text-xs w-28">
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
                          )}

                          {/* ── SHIPROCKET-managed order: show tracking link + AWB ── */}
                          {isShiprocket && shipInfo?.trackingUrl && (
                            <a
                              href={shipInfo.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Track
                            </a>
                          )}
                          {isShiprocket && shipInfo?.awbCode && (
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                              AWB: {shipInfo.awbCode}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => setExpandedId((prev) => prev === order.id ? null : order.id)}
                          className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          {expandedId === order.id
                            ? <ChevronUp className="h-4 w-4" />
                            : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </td>
                    </tr>
                    {expandedId === order.id && (
                      <tr className="bg-gray-50 dark:bg-gray-800/30">
                        <td colSpan={10} className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
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

                            {/* Shiprocket tracking info */}
                            {isShiprocket && shipInfo && (
                              <div className="flex items-start gap-2 bg-purple-50 border border-purple-100 rounded-lg px-3 py-2.5 text-xs">
                                <Truck className="h-3.5 w-3.5 text-purple-500 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <span className="font-semibold text-purple-700">Shiprocket Fulfillment</span>
                                  <div className="mt-1 space-y-0.5 text-purple-600">
                                    {shipInfo.courierName && <p>Courier: {shipInfo.courierName}</p>}
                                    {shipInfo.awbCode && <p>AWB: <span className="font-mono">{shipInfo.awbCode}</span></p>}
                                    {shipInfo.trackingUrl && (
                                      <a href={shipInfo.trackingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                                        <ExternalLink className="h-3 w-3" /> Track on courier website
                                      </a>
                                    )}
                                    {shipInfo.labelUrl && (
                                      <a href={shipInfo.labelUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                                        <Download className="h-3 w-3" /> Download Label
                                      </a>
                                    )}
                                    {shipInfo.pickupScheduledAt && (
                                      <p>Pickup: {new Date(shipInfo.pickupScheduledAt).toLocaleString('en-IN')}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Line items */}
                            <div className="space-y-2">
                              {(order.orderItems || order.items || []).map((item: any) => {
                                const img = item.productImage || item.product?.images?.[0];
                                const imgUrl = img?.startsWith('http') ? img : img ? `http://localhost:5000/${img}` : null;
                                return (
                                  <div key={item.id} className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-3">
                                    {imgUrl ? (
                                      <img src={imgUrl} alt={item.productName || item.product?.name} className="h-12 w-12 rounded-lg object-cover border border-gray-200 dark:border-gray-600 shrink-0" />
                                    ) : (
                                      <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                                        <Package className="h-5 w-5 text-gray-300 dark:text-gray-500" />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate dark:text-gray-200">{item.productName || item.product?.name || '—'}</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">Qty: {item.quantity} &middot; ₹{parseFloat(item.price || '0').toFixed(2)} each</p>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 shrink-0">₹{(parseFloat(item.price || '0') * item.quantity).toFixed(2)}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  )})}
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