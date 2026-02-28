import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { adminApi, ThriftRequest } from '@/services/api';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import {
  Search, Loader2, Eye, Download, Filter,
} from 'lucide-react';

const THRIFT_STATUSES: ThriftRequest['status'][] = [
  'PENDING', 'PICKED_UP', 'UNDER_REFURBISHMENT', 'APPROVED', 'REJECTED',
];

const STATUS_TRANSITIONS: Record<ThriftRequest['status'], ThriftRequest['status'][]> = {
  PENDING: ['PICKED_UP', 'REJECTED'],
  PICKED_UP: ['UNDER_REFURBISHMENT', 'REJECTED'],
  UNDER_REFURBISHMENT: ['APPROVED', 'REJECTED'],
  APPROVED: [],
  REJECTED: [],
};

// Mock data for when API is unavailable
const MOCK_DATA: ThriftRequest[] = [
  {
    id: '1',
    userId: 'u1',
    userName: 'Priya Sharma',
    userEmail: 'priya@example.com',
    address: '12 MG Road, Bengaluru 560001',
    pickupDate: '2024-12-20',
    pickupTime: '10:00 AM',
    itemDescription: 'Blue denim jacket, barely used. Minor wear on cuffs.',
    images: [],
    status: 'PENDING',
    createdAt: '2024-12-18T08:00:00Z',
    updatedAt: '2024-12-18T08:00:00Z',
  },
  {
    id: '2',
    userId: 'u2',
    userName: 'Rohan Verma',
    userEmail: 'rohan@example.com',
    address: '45 Park Street, Mumbai 400001',
    pickupDate: '2024-12-21',
    pickupTime: '2:00 PM',
    itemDescription: '3 cotton kurtas in good condition.',
    images: [],
    status: 'PICKED_UP',
    createdAt: '2024-12-17T10:00:00Z',
    updatedAt: '2024-12-19T09:00:00Z',
  },
  {
    id: '3',
    userId: 'u3',
    userName: 'Ananya Das',
    userEmail: 'ananya@example.com',
    address: '8 Kalighat Road, Kolkata 700026',
    pickupDate: '2024-12-15',
    pickupTime: '11:00 AM',
    itemDescription: 'Silk saree in very good condition.',
    images: [],
    status: 'UNDER_REFURBISHMENT',
    createdAt: '2024-12-14T07:00:00Z',
    updatedAt: '2024-12-16T14:00:00Z',
  },
];

const AdminThriftRequests: React.FC = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<ThriftRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'thrift-requests'],
    queryFn: adminApi.getThriftRequests,
    retry: false,
  });

  const requests: ThriftRequest[] = data?.data || MOCK_DATA;

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ThriftRequest['status'] }) =>
      adminApi.updateThriftRequestStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'thrift-requests'] });
      toast({ title: 'Status updated' });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' }),
  });

  const filtered = requests.filter((r) => {
    const matchSearch =
      !search ||
      r.userName.toLowerCase().includes(search.toLowerCase()) ||
      r.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      r.address.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openDetail = (r: ThriftRequest) => {
    setSelectedRequest(r);
    setDetailOpen(true);
  };

  const exportCSV = () => {
    const csv = [
      ['ID', 'Name', 'Email', 'Address', 'Pickup Date', 'Status', 'Submitted'],
      ...filtered.map((r) => [
        r.id, r.userName, r.userEmail, r.address, r.pickupDate, r.status,
        new Date(r.createdAt).toLocaleDateString('en-IN'),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'thrift-requests.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Thrift Requests</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage customer pickup submissions</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCSV}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-sm w-48">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {THRIFT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary strips */}
        <div className="flex gap-3 flex-wrap">
          {THRIFT_STATUSES.map((s) => {
            const count = requests.filter((r) => r.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  statusFilter === s ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                {s.replace(/_/g, ' ')} <span className="ml-1 font-semibold">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading requests...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">No requests found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-medium">Customer</th>
                    <th className="text-left px-4 py-3 font-medium">Address</th>
                    <th className="text-left px-4 py-3 font-medium">Pickup</th>
                    <th className="text-left px-4 py-3 font-medium">Submitted</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Update Status</th>
                    <th className="text-right px-4 py-3 font-medium">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, idx) => {
                    const nextStatuses = STATUS_TRANSITIONS[r.status];
                    return (
                      <tr key={r.id} className={`border-b border-gray-100 last:border-0 ${idx % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">{r.userName}</p>
                          <p className="text-xs text-gray-400">{r.userEmail}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{r.address}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          <p>{r.pickupDate}</p>
                          <p className="text-xs text-gray-400">{r.pickupTime}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={r.status.toLowerCase()} customLabel={r.status.replace(/_/g, ' ')} />
                        </td>
                        <td className="px-4 py-3">
                          {nextStatuses.length > 0 ? (
                            <Select
                              onValueChange={(v) =>
                                updateStatus.mutate({ id: r.id, status: v as ThriftRequest['status'] })
                              }
                            >
                              <SelectTrigger className="h-7 text-xs w-44">
                                <SelectValue placeholder="Move to..." />
                              </SelectTrigger>
                              <SelectContent>
                                {nextStatuses.map((s) => (
                                  <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-xs text-gray-400">Final</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => openDetail(r)}
                            className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Detail</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Customer</p>
                  <p className="font-medium text-gray-800">{selectedRequest.userName}</p>
                  <p className="text-gray-500">{selectedRequest.userEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Status</p>
                  <StatusBadge
                    status={selectedRequest.status.toLowerCase()}
                    customLabel={selectedRequest.status.replace(/_/g, ' ')}
                  />
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 mb-0.5">Pickup Address</p>
                  <p className="text-gray-700">{selectedRequest.address}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Pickup Date</p>
                  <p className="text-gray-700">{selectedRequest.pickupDate}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Time Slot</p>
                  <p className="text-gray-700">{selectedRequest.pickupTime}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 mb-0.5">Item Description</p>
                  <p className="text-gray-700 bg-gray-50 rounded p-3 text-xs leading-relaxed">{selectedRequest.itemDescription}</p>
                </div>
              </div>
              {selectedRequest.images.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2">Uploaded Images</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedRequest.images.map((img, i) => (
                      <img key={i} src={img} alt={`img ${i + 1}`} className="h-20 w-20 object-cover rounded border border-gray-200" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminThriftRequests;
