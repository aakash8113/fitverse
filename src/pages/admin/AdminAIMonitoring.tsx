import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { adminApi, AIStats } from '@/services/api';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Loader2, Bot, AlertCircle, CheckCircle2, Clock, TrendingUp, WifiOff } from 'lucide-react';

const MOCK_STATS: AIStats = {
  totalRequests: 4827,
  requestsToday: 142,
  avgProcessingTimeMs: 2340,
  successRate: 97.2,
  errorCount: 134,
  isMaintenanceMode: false,
  requestsByDay: [
    { date: 'Dec 13', count: 98 },
    { date: 'Dec 14', count: 112 },
    { date: 'Dec 15', count: 87 },
    { date: 'Dec 16', count: 145 },
    { date: 'Dec 17', count: 163 },
    { date: 'Dec 18', count: 120 },
    { date: 'Dec 19', count: 142 },
  ],
  recentErrors: [
    { timestamp: '2024-12-19T12:30:00Z', message: 'Image processing timeout after 10s', userId: 'u_abc123' },
    { timestamp: '2024-12-19T10:15:00Z', message: 'Invalid image format: .bmp not supported' },
    { timestamp: '2024-12-18T18:40:00Z', message: 'Model inference failed: out of memory', userId: 'u_xyz789' },
  ],
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
  highlight?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, sub, highlight }) => (
  <div className={`bg-white dark:bg-gray-900 border rounded-lg p-5 ${highlight ? 'border-blue-200 dark:border-blue-800' : 'border-gray-200 dark:border-gray-700'}`}>
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</span>
      <Icon className={`h-4 w-4 ${highlight ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'}`} />
    </div>
    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
    {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
  </div>
);

const AdminAIMonitoring: React.FC = () => {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'ai-stats'],
    queryFn: adminApi.getAIStats,
    retry: false,
    refetchInterval: 60_000,
  });

  const stats: AIStats = data?.data || MOCK_STATS;

  const toggleMaintenance = useMutation({
    mutationFn: (enabled: boolean) => adminApi.toggleAIMaintenanceMode(enabled),
    onSuccess: (_, enabled) => {
      qc.invalidateQueries({ queryKey: ['admin', 'ai-stats'] });
      toast({ title: enabled ? 'Maintenance mode enabled' : 'Maintenance mode disabled' });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to toggle maintenance mode', variant: 'destructive' }),
  });

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">AI Monitoring</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">FitverseAI try-on usage, performance, and errors</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Maintenance toggle */}
            <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
              <WifiOff className={`h-4 w-4 ${stats.isMaintenanceMode ? 'text-red-500' : 'text-gray-300 dark:text-gray-600'}`} />
              <span className="text-sm text-gray-600 dark:text-gray-300">Maintenance</span>
              <button
                onClick={() => toggleMaintenance.mutate(!stats.isMaintenanceMode)}
                disabled={toggleMaintenance.isPending}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                  stats.isMaintenanceMode ? 'bg-red-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                    stats.isMaintenanceMode ? 'translate-x-4.5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Maintenance banner */}
        {stats.isMaintenanceMode && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            AI try-on is currently in <strong>maintenance mode</strong>. Users will see a downtime message.
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading AI stats...
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Requests" value={stats.totalRequests.toLocaleString()} icon={Bot} highlight />
              <StatCard label="Today's Requests" value={stats.requestsToday} icon={TrendingUp} />
              <StatCard
                label="Avg Processing"
                value={`${(stats.avgProcessingTimeMs / 1000).toFixed(1)}s`}
                icon={Clock}
                sub="Per try-on request"
              />
              <StatCard
                label="Success Rate"
                value={`${stats.successRate.toFixed(1)}%`}
                icon={CheckCircle2}
                sub={`${stats.errorCount} errors total`}
              />
            </div>

            {/* Usage chart */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Daily Try-On Requests (Last 7 days)</h2>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={stats.requestsByDay} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb', boxShadow: 'none' }} />
                  <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fill="url(#aiGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Error log */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Recent Error Log</h2>
                <span className="text-xs text-gray-400 dark:text-gray-500">{stats.errorCount} total errors</span>
              </div>
              {stats.recentErrors.length === 0 ? (
                <div className="text-center py-10 text-sm text-gray-400">No recent errors. All systems normal.</div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {stats.recentErrors.map((err, i) => (
                    <div key={i} className="flex items-start gap-3 px-5 py-3">
                      <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 dark:text-gray-200">{err.message}</p>
                        {err.userId && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">User: {err.userId}</p>}
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap shrink-0">
                        {new Date(err.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAIMonitoring;
