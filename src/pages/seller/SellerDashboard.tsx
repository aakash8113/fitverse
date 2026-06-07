import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SellerLayout } from '@/components/seller/SellerLayout';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { sellerApi } from '@/services/api';
import {
  ShoppingBag,
  ClipboardList,
  DollarSign,
  TrendingUp,
  Loader2,
  Package,
} from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon: Icon }) => {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</span>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded p-1.5">
          <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-gray-900 dark:text-white">
        {typeof value === 'number' && label.includes('Revenue')
          ? `₹${value.toLocaleString()}`
          : value}
      </p>
    </div>
  );
};

const SellerDashboard: React.FC = () => {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['seller', 'stats'],
    queryFn: sellerApi.getStats,
    retry: false,
    refetchInterval: 30_000,
  });

  const stats = statsData?.data;
  const orders = stats?.recentOrders || [];

  return (
    <SellerLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Seller Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Your store at a glance.</p>
        </div>

        {/* Metric cards */}
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading stats...
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Total Products"
              value={stats?.totalProducts ?? '—'}
              icon={Package}
            />
            <MetricCard
              label="Total Orders"
              value={stats?.totalOrders ?? '—'}
              icon={ClipboardList}
            />
            <MetricCard
              label="Total Revenue"
              value={stats?.totalRevenue ?? '—'}
              icon={DollarSign}
            />
            <MetricCard
              label="Growth"
              value={stats?.totalOrders ? 'Active' : '—'}
              icon={TrendingUp}
            />
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/seller/products"
            className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
          >
            <ShoppingBag className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Manage Products</p>
              <p className="text-xs text-gray-500">Add, edit or remove your listings</p>
            </div>
          </Link>
          <Link
            to="/seller/orders"
            className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
          >
            <ClipboardList className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">View Orders</p>
              <p className="text-xs text-gray-500">Track and ship customer orders</p>
            </div>
          </Link>
          <Link
            to="/seller/analytics"
            className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
          >
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Analytics</p>
              <p className="text-xs text-gray-500">Revenue breakdown and insights</p>
            </div>
          </Link>
        </div>

        {/* Recent orders */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Recent Orders</h2>
            <Link to="/seller/orders" className="text-xs text-emerald-600 hover:underline">View all</Link>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-400">No orders yet for your products.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left px-5 py-3 font-medium">Order ID</th>
                    <th className="text-left px-5 py-3 font-medium">Customer</th>
                    <th className="text-left px-5 py-3 font-medium">Status</th>
                    <th className="text-left px-5 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order: any, idx: number) => (
                    <tr key={order.id} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/30'}>
                      <td className="px-5 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">#{order.orderNumber || order.id.slice(-6).toUpperCase()}</td>
                      <td className="px-5 py-3 text-gray-800 dark:text-gray-200">{order.user?.name || '—'}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={order.status?.toLowerCase() || 'processing'} />
                      </td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </SellerLayout>
  );
};

export default SellerDashboard;