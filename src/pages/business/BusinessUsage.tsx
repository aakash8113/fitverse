import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BusinessLayout } from '@/components/business/BusinessLayout';
import { businessApi } from '@/services/api';
import { Loader2 } from 'lucide-react';

const BusinessUsage: React.FC = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['business', 'usage', page],
    queryFn: () => businessApi.getUsage({ page, limit: 20 }),
  });

  const result = data?.data as any;
  const items = result?.items || [];
  const pagination = result?.pagination || {};

  return (
    <BusinessLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Usage History</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Track your API usage and credits consumed</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="p-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">No usage data yet. Start sending API requests!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800/50 border-b">
                    <th className="text-left px-4 py-3 font-medium">Task ID</th>
                    <th className="text-left px-4 py-3 font-medium">HD Mode</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.taskId.slice(0, 16)}...</td>
                      <td className="px-4 py-3">{item.hdMode ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          item.success === null ? 'bg-yellow-50 text-yellow-700' :
                          item.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {item.success === null ? 'Processing' : item.success ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(item.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </BusinessLayout>
  );
};

export default BusinessUsage;