import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SellerLayout } from '@/components/seller/SellerLayout';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { sellerApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package, Truck, ExternalLink, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ORDER_STATUSES = ['', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const SellerOrders: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['seller', 'orders', statusFilter],
    queryFn: () => sellerApi.getOrders({ limit: 50, status: statusFilter || undefined }),
  });

  const orders = data?.data?.orders || [];

  return (
    <SellerLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Orders</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Orders containing your products</p>
        </div>

        {/* Status filter */}
        <div className="flex gap-2 flex-wrap">
          {ORDER_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                statusFilter === s
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-400'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        {/* Orders list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-sm text-gray-400">No orders found.</div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => {
              const canShip = order.status === 'PROCESSING';
              const isShiprocket = order.shippingMethod === 'SHIPROCKET';
              return (
                <div
                  key={order.id}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-5"
                >
                  {/* Order header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
                        <Package className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          #{order.orderNumber || order.id.slice(-6).toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {order.user?.name} · {order.user?.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {isShiprocket && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded-full">
                          <Truck className="h-3 w-3" />
                          Shiprocket
                        </span>
                      )}
                      <StatusBadge status={order.status?.toLowerCase() || 'processing'} />
                    </div>
                  </div>

                  {/* Shiprocket tracking info */}
                  {isShiprocket && (
                    <div className="flex items-start gap-2 bg-purple-50 border border-purple-100 dark:bg-purple-900/20 dark:border-purple-800 rounded-lg px-3 py-2.5 mb-3">
                      <Truck className="h-3.5 w-3.5 text-purple-500 shrink-0 mt-0.5" />
                      <div className="text-xs text-purple-700 dark:text-purple-300">
                        <p className="font-semibold">Shiprocket Fulfillment</p>
                        {order.courierName && <p>Courier: {order.courierName}</p>}
                        {order.awbCode && <p>AWB: <span className="font-mono">{order.awbCode}</span></p>}
                        {order.trackingUrl && (
                          <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline mt-0.5">
                            <ExternalLink className="h-3 w-3" /> Track on courier site
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Order items from seller */}
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Your items in this order</p>
                    {(order.sellerItems || []).map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                        <div className="w-10 h-10 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0">
                          {item.productImage ? (
                            <img src={item.productImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">N/A</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.productName}</p>
                          <p className="text-xs text-gray-500">Size: {item.size} × Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Payment & shipping info */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>Payment: {order.paymentMethod}</span>
                      {order.shippedAt && <span>Shipped: {new Date(order.shippedAt).toLocaleDateString()}</span>}
                      {order.deliveredAt && <span>Delivered: {new Date(order.deliveredAt).toLocaleDateString()}</span>}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Order Total: ₹{Number(order.total || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info about pickup addresses */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-xs text-amber-800 dark:text-amber-200">
          <div className="flex items-start gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Important: Pickup Addresses Needed for Shiprocket</p>
              <p className="mt-0.5">
                When the admin sends an order to Shiprocket, your default pickup address is used for courier pickup.
                Add and set a default pickup address in the{" "}
                <a href="/seller/pickup-addresses" className="underline font-medium">Pickup Addresses</a> section.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SellerLayout>
  );
};

export default SellerOrders;