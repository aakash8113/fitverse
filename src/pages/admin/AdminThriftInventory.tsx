import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { adminThriftApi, ThriftItem } from '@/services/api';
import { Loader2, Search, ImageOff, IndianRupee, Package2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const ITEM_STATUS_TABS = [
  { key: '', label: 'All', color: 'bg-gray-100 text-gray-700' },
  { key: 'LISTED', label: 'Listed', color: 'bg-green-100 text-green-700' },
  { key: 'SOLD', label: 'Sold', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'UNDER_REFURBISHMENT', label: 'Refurbishment', color: 'bg-orange-100 text-orange-700' },
];

const CONDITION_LABEL: Record<string, string> = {
  POOR: 'Poor', FAIR: 'Fair', GOOD: 'Good', VERY_GOOD: 'Very Good', LIKE_NEW: 'Like New',
};

function ItemThumb({ src, alt }: { src?: string; alt: string }) {
  if (!src) return (
    <div className="h-20 w-20 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
      <ImageOff className="h-6 w-6 text-gray-300" />
    </div>
  );
  return (
    <img
      src={src.startsWith('http') ? src : `http://localhost:5000/${src}`}
      alt={alt}
      className="h-20 w-20 rounded-xl object-cover border border-gray-200 shrink-0"
    />
  );
}

const AdminThriftInventory: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'thrift-inventory'],
    queryFn: () => adminThriftApi.getInventory({ status: 'ALL', limit: 200 }),
    refetchInterval: 60_000,
  });

  const allItems: ThriftItem[] = data?.data || [];

  const items = statusTab
    ? allItems.filter((item) => item.status === statusTab)
    : allItems;

  const filtered = search
    ? items.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.brand?.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  const counts = {
    total: allItems.length,
    listed: allItems.filter((i) => i.status === 'LISTED').length,
    sold: allItems.filter((i) => i.status === 'SOLD').length,
    refurb: allItems.filter((i) => i.status === 'UNDER_REFURBISHMENT').length,
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Thrift Inventory</h1>
          <p className="text-sm text-gray-500 mt-0.5">Items collected and listed in the thrift store</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Items', count: counts.total, color: 'text-gray-700' },
            { label: 'Listed', count: counts.listed, color: 'text-green-700' },
            { label: 'Sold', count: counts.sold, color: 'text-emerald-700' },
            { label: 'Refurbishment', count: counts.refurb, color: 'text-orange-700' },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={cn('text-2xl font-bold mt-1', s.color)}>{s.count}</p>
            </div>
          ))}
        </div>

        {/* Tabs + Search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {ITEM_STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusTab(tab.key)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  statusTab === tab.key
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm w-56"
            />
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <Package2 className="h-10 w-10 text-gray-200" />
            <p className="text-sm">No items found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((item) => {
              const statusCfg: Record<string, string> = {
                LISTED: 'bg-green-100 text-green-700',
                SOLD: 'bg-emerald-100 text-emerald-700',
                UNDER_REFURBISHMENT: 'bg-orange-100 text-orange-700',
                PICKED_UP: 'bg-purple-100 text-purple-700',
                APPROVED: 'bg-blue-100 text-blue-700',
                PENDING: 'bg-amber-100 text-amber-700',
                REJECTED: 'bg-red-100 text-red-700',
              };
              const statusLabel: Record<string, string> = {
                LISTED: 'Listed', SOLD: 'Sold', UNDER_REFURBISHMENT: 'Refurbishment',
                PICKED_UP: 'Picked Up', APPROVED: 'Approved', PENDING: 'Pending', REJECTED: 'Rejected',
              };
              return (
                <div key={item.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                  {item.images?.[0] ? (
                    <img
                      src={item.images[0].startsWith('http') ? item.images[0] : `http://localhost:5000/${item.images[0]}`}
                      alt={item.name}
                      className="w-full h-44 object-cover"
                    />
                  ) : (
                    <div className="w-full h-44 bg-gray-100 flex items-center justify-center">
                      <ImageOff className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0', statusCfg[item.status] || 'bg-gray-100 text-gray-600')}>
                        {statusLabel[item.status] || item.status}
                      </span>
                    </div>
                    {item.brand && <p className="text-xs text-gray-400">{item.brand}</p>}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-500">{CONDITION_LABEL[item.condition] || item.condition}</span>
                      {item.size && <span className="text-xs text-gray-400"> Size {item.size}</span>}
                      <span className="text-xs text-gray-400"> {item.category}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      {item.listedPrice ? (
                        <span className="text-sm font-semibold text-gray-900 flex items-center gap-0.5">
                          <IndianRupee className="h-3.5 w-3.5" />{Number(item.listedPrice).toLocaleString()}
                        </span>
                      ) : item.estimatedValue ? (
                        <span className="text-xs text-green-700">Offer: Rs.{Number(item.estimatedValue).toLocaleString()}</span>
                      ) : <span />}
                      <span className="text-[10px] text-gray-400">
                        {item.updatedAt ? format(new Date(item.updatedAt), 'dd MMM yy') : ''}
                      </span>
                    </div>
                    {item.user && (
                      <p className="text-[10px] text-gray-400">Seller: {item.user.name}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminThriftInventory;
