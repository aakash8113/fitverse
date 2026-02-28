import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { adminApi, ordersApi } from '@/services/api';
import {
  Users,
  ShoppingBag,
  DollarSign,
  Recycle,
  Bot,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
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
  Legend,
} from 'recharts';

const mockRevenueData = [
  { month: 'Jan', revenue: 4200 },
  { month: 'Feb', revenue: 5800 },
  { month: 'Mar', revenue: 4900 },
  { month: 'Apr', revenue: 7200 },
  { month: 'May', revenue: 6100 },
  { month: 'Jun', revenue: 8400 },
  { month: 'Jul', revenue: 9100 },
  { month: 'Aug', revenue: 7600 },
  { month: 'Sep', revenue: 10200 },
  { month: 'Oct', revenue: 11400 },
  { month: 'Nov', revenue: 9800 },
  { month: 'Dec', revenue: 13200 },
];

const mockCategoryData = [
  { category: 'Tops', count: 48 },
  { category: 'Bottoms', count: 36 },
  { category: 'Dresses', count: 22 },
  { category: 'Outerwear', count: 15 },
  { category: 'Thrift', count: 29 },
];

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: number;
  trendLabel?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon: Icon, trend, trendLabel }) => {
  const isPositive = trend !== undefined && trend >= 0;
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        <div className="bg-gray-50 rounded p-1.5">
          <Icon className="h-4 w-4 text-gray-600" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-1.5 text-xs ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
          {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          <span>{Math.abs(trend)}% {trendLabel || 'vs last month'}</span>
        </div>
      )}
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminApi.getDashboardStats,
    retry: false,
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: ordersApi.getAllOrders,
    retry: false,
  });

  const stats = statsData?.data;
  const orders = ordersData?.data?.slice(0, 8) || [];
  const revenueData = stats?.revenueByMonth || mockRevenueData;

  const totalRevenue = orders.reduce((sum: number, o: any) => sum + (parseFloat(o.total) || 0), 0);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back. Here&apos;s what&apos;s happening.</p>
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
              trend={8}
            />
            <MetricCard
              label="Products"
              value={stats?.totalProducts ?? '—'}
              icon={ShoppingBag}
              trend={3}
            />
            <MetricCard
              label="Total Orders"
              value={stats?.totalOrders ?? orders.length}
              icon={TrendingUp}
              trend={12}
            />
            <MetricCard
              label="Monthly Revenue"
              value={stats?.monthlyRevenue ? `₹${stats.monthlyRevenue.toLocaleString()}` : totalRevenue ? `₹${totalRevenue.toFixed(0)}` : '—'}
              icon={DollarSign}
              trend={18}
            />
            <MetricCard
              label="Thrift Requests"
              value={stats?.thriftRequestCount ?? '—'}
              icon={Recycle}
              trend={-2}
            />
            <MetricCard
              label="AI Try-Ons"
              value={stats?.aiTryOnCount ?? '—'}
              icon={Bot}
              trend={24}
            />
          </div>
        )}

        {/* Charts row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Revenue trend */}
          <div className="xl:col-span-2 bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Revenue Trend</h2>
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
          </div>

          {/* Category breakdown */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Inventory by Category</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={mockCategoryData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="category" type="category" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={72} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb', boxShadow: 'none' }}
                />
                <Bar dataKey="count" fill="#18181b" radius={[0, 3, 3, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent orders */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>

          {ordersLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-400">No orders yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 font-medium">Order ID</th>
                    <th className="text-left px-5 py-3 font-medium">Customer</th>
                    <th className="text-left px-5 py-3 font-medium">Items</th>
                    <th className="text-left px-5 py-3 font-medium">Total</th>                    <th className="text-left px-5 py-3 font-medium">Payment</th>                    <th className="text-left px-5 py-3 font-medium">Status</th>
                    <th className="text-left px-5 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order: any, idx: number) => (
                    <tr key={order.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-5 py-3 font-mono text-xs text-gray-500">#{order.id.slice(-6).toUpperCase()}</td>
                      <td className="px-5 py-3 text-gray-800">{order.user?.name || '—'}</td>
                      <td className="px-5 py-3 text-gray-600">{(order.orderItems || order.items || []).length} item(s)</td>
                      <td className="px-5 py-3 text-gray-900 font-medium">₹{parseFloat(order.total || '0').toFixed(2)}</td>
                      <td className="px-5 py-3 text-gray-600 text-xs">
                        {order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod === 'CARD' ? 'Card' : order.paymentMethod === 'WALLET' ? 'Wallet' : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={order.status?.toLowerCase() || 'pending'} />
                      </td>
                      <td className="px-5 py-3 text-gray-500">
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
