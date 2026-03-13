import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { adminApi, productsApi } from '@/services/api';
import {
  Users,
  ShoppingBag,
  DollarSign,
  Recycle,
  Bot,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

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
        <div className="bg-gray-50 dark:bg-gray-800 rounded p-1.5">
          <Icon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminApi.getDashboardStats,
    retry: false,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const { data: fallbackCategoryData = [] } = useQuery({
    queryKey: ['admin', 'inventory-category-fallback'],
    queryFn: async () => {
      const productsRes = await productsApi.getProducts({ page: 1, limit: 1000 });

      const extractProducts = (payload: any) => {
        const d = payload?.data;
        if (Array.isArray(d)) return d;
        if (Array.isArray(d?.products)) return d.products;
        return [];
      };

      const formatCategoryLabel = (value?: string) => {
        if (!value) return 'Other';
        return value
          .toLowerCase()
          .split('_')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
      };

      const products = extractProducts(productsRes);

      const counts = new Map<string, number>();
      products.forEach((p: any) => {
        const key = formatCategoryLabel(p?.category);
        counts.set(key, (counts.get(key) || 0) + 1);
      });

      return Array.from(counts.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
    },
    retry: false,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const stats = statsData?.data;
  const orders = stats?.recentOrders || [];
  const revenueData = stats?.revenueByMonth || [];
  const categoryData = stats?.inventoryByCategory?.length
    ? stats.inventoryByCategory
    : fallbackCategoryData;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 dark:bg-[#121212]">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Welcome back. Here&apos;s what&apos;s happening.</p>
        </div>

        {/* Metric cards */}
        {statsLoading ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading stats...
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <MetricCard
              label="Total Users"
              value={stats?.totalUsers ?? '—'}
              icon={Users}
            />
            <MetricCard
              label="Products"
              value={stats?.totalProducts ?? '—'}
              icon={ShoppingBag}
            />
            <MetricCard
              label="Total Orders"
              value={stats?.totalOrders ?? '—'}
              icon={TrendingUp}
            />
            <MetricCard
              label="Monthly Revenue"
              value={stats?.monthlyRevenue != null ? `₹${stats.monthlyRevenue.toLocaleString()}` : '—'}
              icon={DollarSign}
            />
            <MetricCard
              label="Thrift Requests"
              value={stats?.thriftRequestCount ?? '—'}
              icon={Recycle}
            />
            <MetricCard
              label="AI Try-Ons"
              value={stats?.aiTryOnCount ?? '—'}
              icon={Bot}
            />
          </div>
        )}

        {/* Charts row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Revenue trend */}
          <div className="xl:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Revenue Trend</h2>
            {revenueData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">No revenue data available yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                  <Tooltip
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb', boxShadow: 'none' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Category breakdown */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Inventory by Category</h2>
            {categoryData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">No inventory data available yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f0f0f0'} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="category" type="category" tick={{ fontSize: 11, fill: isDark ? '#9ca3af' : '#6b7280' }} axisLine={false} tickLine={false} width={92} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 6, border: isDark ? '1px solid #374151' : '1px solid #e5e7eb', boxShadow: 'none', backgroundColor: isDark ? '#1f2937' : '#ffffff', color: isDark ? '#f3f4f6' : '#111827' }}
                  />
                  <Bar dataKey="count" fill={isDark ? '#e5e7eb' : '#18181b'} radius={[0, 3, 3, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent orders */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>

          {statsLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-400">No orders yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left px-5 py-3 font-medium">Order ID</th>
                    <th className="text-left px-5 py-3 font-medium">Customer</th>
                    <th className="text-left px-5 py-3 font-medium">Items</th>
                    <th className="text-left px-5 py-3 font-medium">Total</th>
                    <th className="text-left px-5 py-3 font-medium">Payment Mode</th>
                    <th className="text-left px-5 py-3 font-medium">Status</th>
                    <th className="text-left px-5 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order: any, idx: number) => (
                    <tr key={order.id} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/30'}>
                      <td className="px-5 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">#{order.id.slice(-6).toUpperCase()}</td>
                      <td className="px-5 py-3 text-gray-800 dark:text-gray-200">{order.user?.name || '—'}</td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{(order.orderItems || order.items || []).length} item(s)</td>
                      <td className="px-5 py-3 text-gray-900 dark:text-white font-medium">₹{parseFloat(order.total || '0').toFixed(2)}</td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300 text-xs">
                        {order.paymentMethod === 'COD'
                          ? 'Cash on Delivery'
                          : order.paymentMethod === 'CARD'
                            ? 'Card'
                            : order.paymentMethod === 'WALLET'
                              ? 'Wallet'
                              : order.paymentMethod === 'COINS'
                                ? 'Fitverse Coins'
                                : '—'}
                      </td>
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
    </AdminLayout>
  );
};

export default AdminDashboard;
