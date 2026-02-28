import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { adminApi, ThriftInventoryItem } from '@/services/api';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Search, Edit2, Trash2, Download } from 'lucide-react';

const CONDITIONS: ThriftInventoryItem['condition'][] = ['GOOD', 'VERY_GOOD', 'EXCELLENT'];

const MOCK_ITEMS: ThriftInventoryItem[] = [
  {
    id: 'ti1', name: 'Refurbished Silk Saree', description: 'Beautifully cleaned and restored silk saree.',
    price: 1800, stock: 1, images: [], category: 'Sarees', condition: 'EXCELLENT',
    isSold: false, createdAt: '2024-12-18T10:00:00Z',
  },
  {
    id: 'ti2', name: 'Vintage Denim Jacket', description: 'Classic denim jacket in great shape.',
    price: 1200, stock: 1, images: [], category: 'Jackets', condition: 'VERY_GOOD',
    isSold: false, createdAt: '2024-12-17T08:00:00Z',
  },
  {
    id: 'ti3', name: 'Cotton Kurta Set', description: 'Pair of cotton kurtas, minor fade wear.',
    price: 600, stock: 2, images: [], category: 'Kurtas', condition: 'GOOD',
    isSold: true, createdAt: '2024-12-10T12:00:00Z',
  },
];

interface EditForm { price: string; stock: string; condition: ThriftInventoryItem['condition'] }

const AdminThriftInventory: React.FC = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [soldFilter, setSoldFilter] = useState<'all' | 'active' | 'sold'>('all');
  const [editItem, setEditItem] = useState<ThriftInventoryItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<ThriftInventoryItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<EditForm>({ price: '', stock: '', condition: 'GOOD' });

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'thrift-inventory'],
    queryFn: adminApi.getThriftInventory,
    retry: false,
  });

  const items: ThriftInventoryItem[] = data?.data || MOCK_ITEMS;

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ThriftInventoryItem> }) =>
      adminApi.updateThriftItem(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'thrift-inventory'] });
      toast({ title: 'Item updated' });
      setEditOpen(false);
    },
    onError: () => toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' }),
  });

  const markSoldMutation = useMutation({
    mutationFn: (id: string) => adminApi.updateThriftItem(id, { isSold: true, stock: 0 }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'thrift-inventory'] });
      toast({ title: 'Marked as sold' });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteThriftItem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'thrift-inventory'] });
      toast({ title: 'Item removed' });
      setDeleteItem(null);
    },
    onError: () => toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' }),
  });

  const openEdit = (item: ThriftInventoryItem) => {
    setEditItem(item);
    setForm({ price: String(item.price), stock: String(item.stock), condition: item.condition });
    setEditOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    updateMutation.mutate({
      id: editItem.id,
      data: { price: Number(form.price), stock: Number(form.stock), condition: form.condition },
    });
  };

  const filtered = items.filter((item) => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
    const matchSold =
      soldFilter === 'all' || (soldFilter === 'active' && !item.isSold) || (soldFilter === 'sold' && item.isSold);
    return matchSearch && matchSold;
  });

  const exportCSV = () => {
    const csv = [
      ['Name', 'Category', 'Condition', 'Price', 'Stock', 'Sold'],
      ...filtered.map((i) => [i.name, i.category, i.condition, i.price, i.stock, i.isSold ? 'Yes' : 'No']),
    ]
      .map((r) => r.join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'thrift-inventory.csv';
    a.click();
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Thrift Inventory</h1>
            <p className="text-sm text-gray-500 mt-0.5">Live thrift items, pricing, and stock management</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCSV}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'sold'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setSoldFilter(f)}
                className={`text-xs px-3 py-1.5 rounded border transition-colors capitalize ${
                  soldFilter === f ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm text-gray-500">
          <span>Total: <strong className="text-gray-900">{items.length}</strong></span>
          <span>Available: <strong className="text-green-700">{items.filter((i) => !i.isSold).length}</strong></span>
          <span>Sold: <strong className="text-gray-500">{items.filter((i) => i.isSold).length}</strong></span>
          <span>Total Value: <strong className="text-gray-900">₹{items.filter((i) => !i.isSold).reduce((s, i) => s + i.price * i.stock, 0).toLocaleString()}</strong></span>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading inventory...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">No items found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-medium">Item</th>
                    <th className="text-left px-4 py-3 font-medium">Category</th>
                    <th className="text-left px-4 py-3 font-medium">Condition</th>
                    <th className="text-left px-4 py-3 font-medium">Price</th>
                    <th className="text-left px-4 py-3 font-medium">Stock</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, idx) => (
                    <tr key={item.id} className={`border-b border-gray-100 last:border-0 ${idx % 2 ? 'bg-gray-50/40' : ''} ${item.isSold ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                      <td className="px-4 py-3 text-gray-600">{item.category}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          item.condition === 'EXCELLENT' ? 'bg-green-50 text-green-700' :
                          item.condition === 'VERY_GOOD' ? 'bg-blue-50 text-blue-700' : 'bg-yellow-50 text-yellow-700'
                        }`}>{item.condition.replace('_', ' ')}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">₹{item.price.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-700">{item.stock}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={item.isSold ? 'sold' : 'active'} customLabel={item.isSold ? 'Sold' : 'Available'} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {!item.isSold && (
                            <>
                              <button onClick={() => openEdit(item)} className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-colors">
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => markSoldMutation.mutate(item.id)}
                                className="text-xs text-gray-500 px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                              >
                                Mark Sold
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setDeleteItem(item)}
                            className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit — {editItem?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Price (₹)</Label>
                <Input type="number" min="0" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Stock</Label>
                <Input type="number" min="0" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Condition</Label>
                <Select value={form.condition} onValueChange={(v) => setForm((f) => ({ ...f, condition: v as ThriftInventoryItem['condition'] }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Remove Item?</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500"><strong>{deleteItem?.name}</strong> will be permanently removed from thrift inventory.</p>
          <DialogFooter className="mt-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteItem(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" disabled={deleteMutation.isPending} onClick={() => deleteItem && deleteMutation.mutate(deleteItem.id)}>
              {deleteMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminThriftInventory;
