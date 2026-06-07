import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SellerLayout } from '@/components/seller/SellerLayout';
import { sellerApi } from '@/services/api';
import { Loader2, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const SellerAnalytics: React.FC = () => {
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

  const { data, isLoading } = useQuery({
    queryKey: ['seller', 'revenue'],
    queryFn: sellerApi.getRevenue,
    retry: false,
  });

  const revenue = data?.data;

  if (isLoading) {
    return (
      <SellerLayout>
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </SellerLayout>
    );
  }

  if (!revenue || revenue.totalOrders === 0) {
    return (
      <SellerLayout>
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Analytics</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Revenue breakdown and insights</p>
          </div>
          <div className="text-center py-20 text-sm text-gray-400">
            No sales data yet. Once your products start selling, your analytics will appear here.
          </div>
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Revenue breakdown and insights</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase">Total Revenue</span>
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">₹{revenue.totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase">Total Orders</span>
              <ShoppingCart className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{revenue.totalOrders}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase">Avg. Order Value</span>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              ₹{(revenue.totalOrders > 0 ? (revenue.totalRevenue / revenue.totalOrders).toFixed(2) : '0')}
            </p>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Monthly Revenue */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Monthly Revenue</h2>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenue.revenueByMonth} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGradSeller" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f0f0f0'} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                  contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb', backgroundColor: isDark ? '#1f2937' : '#fff', color: isDark ? '#f3f4f6' : '#111827' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#revGradSeller)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue by Category */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Revenue by Category</h2>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={revenue.revenueByCategory}
                  dataKey="revenue"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={true}
                >
                  {revenue.revenueByCategory.map((_: any, idx: number) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Top Products by Revenue</h2>
          <ResponsiveContainer width="100%" height={Math.max(100, revenue.revenueByProduct.length * 40)}>
            <BarChart data={revenue.revenueByProduct.slice(0, 10)} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f0f0f0'} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <YAxis dataKey="productName" type="category" tick={{ fontSize: 11, fill: isDark ? '#9ca3af' : '#6b7280' }} axisLine={false} tickLine={false} width={150} />
              <Tooltip
                formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb', backgroundColor: isDark ? '#1f2937' : '#fff' }}
              />
              <Bar dataKey="revenue" fill="#10b981" radius={[0, 3, 3, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </SellerLayout>
  );
};

export default SellerAnalytics;