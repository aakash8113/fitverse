import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { adminApi, RefurbishmentItem } from '@/services/api';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Edit2, ArrowRight, PackageCheck } from 'lucide-react';

const MOCK_ITEMS: RefurbishmentItem[] = [
  {
    id: 'r1',
    thriftRequestId: '3',
    itemName: 'Silk Saree',
    originalImages: [],
    refurbishedImages: [],
    notes: 'Requires minor repair on hemline.',
    cost: 350,
    finalPrice: 1800,
    status: 'IN_PROGRESS',
    createdAt: '2024-12-16T10:00:00Z',
    updatedAt: '2024-12-16T10:00:00Z',
  },
  {
    id: 'r2',
    thriftRequestId: '2',
    itemName: 'Denim Jacket',
    originalImages: [],
    refurbishedImages: [],
    notes: 'Cleaned and patched. Good condition.',
    cost: 200,
    finalPrice: 1200,
    status: 'COMPLETED',
    createdAt: '2024-12-14T08:00:00Z',
    updatedAt: '2024-12-17T12:00:00Z',
  },
];

interface EditForm {
  notes: string;
  cost: string;
  finalPrice: string;
}

const AdminRefurbishment: React.FC = () => {
  const qc = useQueryClient();
  const [editingItem, setEditingItem] = useState<RefurbishmentItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [moveDialogItem, setMoveDialogItem] = useState<RefurbishmentItem | null>(null);
  const [form, setForm] = useState<EditForm>({ notes: '', cost: '', finalPrice: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'refurbishment'],
    queryFn: adminApi.getRefurbishmentItems,
    retry: false,
  });

  const items: RefurbishmentItem[] = data?.data || MOCK_ITEMS;

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RefurbishmentItem> }) =>
      adminApi.updateRefurbishmentItem(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'refurbishment'] });
      toast({ title: 'Item updated' });
      setEditOpen(false);
    },
    onError: () => toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' }),
  });

  const moveMutation = useMutation({
    mutationFn: (id: string) => adminApi.moveToInventory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'refurbishment'] });
      qc.invalidateQueries({ queryKey: ['admin', 'thrift-inventory'] });
      toast({ title: 'Moved to thrift inventory' });
      setMoveDialogItem(null);
    },
    onError: () => toast({ title: 'Error', description: 'Failed to move item', variant: 'destructive' }),
  });

  const openEdit = (item: RefurbishmentItem) => {
    setEditingItem(item);
    setForm({ notes: item.notes, cost: String(item.cost), finalPrice: String(item.finalPrice) });
    setEditOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    updateMutation.mutate({
      id: editingItem.id,
      data: { notes: form.notes, cost: Number(form.cost), finalPrice: Number(form.finalPrice) },
    });
  };

  const inProgress = items.filter((i) => i.status === 'IN_PROGRESS');
  const completed = items.filter((i) => i.status === 'COMPLETED');
  const inInventory = items.filter((i) => i.status === 'IN_INVENTORY');

  const renderTable = (list: RefurbishmentItem[], showMoveBtn: boolean) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-500 bg-gray-50 border-b border-gray-100">
            <th className="text-left px-4 py-3 font-medium">Item</th>
            <th className="text-left px-4 py-3 font-medium">Notes</th>
            <th className="text-left px-4 py-3 font-medium">Refurb Cost</th>
            <th className="text-left px-4 py-3 font-medium">Final Price</th>
            <th className="text-left px-4 py-3 font-medium">Status</th>
            <th className="text-right px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.map((item, idx) => (
            <tr key={item.id} className={`border-b border-gray-100 last:border-0 ${idx % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
              <td className="px-4 py-3 font-medium text-gray-800">{item.itemName}</td>
              <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{item.notes || '—'}</td>
              <td className="px-4 py-3 text-gray-700">₹{item.cost}</td>
              <td className="px-4 py-3 font-medium text-gray-900">₹{item.finalPrice}</td>
              <td className="px-4 py-3">
                <StatusBadge status={item.status.toLowerCase()} customLabel={item.status.replace(/_/g, ' ')} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEdit(item)}
                    className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  {showMoveBtn && item.status === 'COMPLETED' && (
                    <button
                      onClick={() => setMoveDialogItem(item)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                      title="Move to Inventory"
                    >
                      <PackageCheck className="h-3.5 w-3.5" />
                      Move
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Refurbishment Tracking</h1>
          <p className="text-sm text-gray-500 mt-0.5">Add notes, costs, and move items to live thrift inventory</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'In Progress', count: inProgress.length, color: 'bg-blue-50 text-blue-700' },
            { label: 'Completed', count: completed.length, color: 'bg-green-50 text-green-700' },
            { label: 'In Inventory', count: inInventory.length, color: 'bg-gray-100 text-gray-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3">
              <div className={`rounded-full px-3 py-1 text-xs font-medium ${s.color}`}>{s.count}</div>
              <p className="text-sm text-gray-600">{s.label}</p>
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading items...
          </div>
        ) : (
          <>
            {/* In Progress */}
            {inProgress.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-700 mb-2">
                  In Progress <span className="ml-1.5 text-xs font-normal text-blue-600">{inProgress.length}</span>
                </h2>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {renderTable(inProgress, false)}
                </div>
              </section>
            )}

            {/* Completed — Ready to move */}
            {completed.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  Ready to Move to Inventory
                  <span className="ml-1.5 text-xs font-normal text-green-600">{completed.length}</span>
                </h2>
                <div className="bg-white border border-green-200 rounded-lg overflow-hidden">
                  {renderTable(completed, true)}
                </div>
              </section>
            )}

            {/* In Inventory (archived) */}
            {inInventory.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 mb-2">
                  Moved to Inventory
                  <span className="ml-1.5 text-xs font-normal">{inInventory.length}</span>
                </h2>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden opacity-70">
                  {renderTable(inInventory, false)}
                </div>
              </section>
            )}

            {items.length === 0 && (
              <div className="text-center py-16 text-gray-400 text-sm">No refurbishment items yet.</div>
            )}
          </>
        )}
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Refurbishment — {editingItem?.itemName}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs">Refurbishment Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
                className="text-sm resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Refurbishment Cost (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.cost}
                  onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Final Sale Price (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.finalPrice}
                  onChange={(e) => setForm((f) => ({ ...f, finalPrice: e.target.value }))}
                  className="h-9 text-sm"
                />
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

      {/* Move to inventory confirmation */}
      <Dialog open={!!moveDialogItem} onOpenChange={() => setMoveDialogItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Move to Thrift Inventory?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">
            <strong>{moveDialogItem?.itemName}</strong> will be listed in the live thrift inventory at ₹{moveDialogItem?.finalPrice}.
          </p>
          <DialogFooter className="mt-2">
            <Button variant="outline" size="sm" onClick={() => setMoveDialogItem(null)}>Cancel</Button>
            <Button
              size="sm"
              disabled={moveMutation.isPending}
              onClick={() => moveDialogItem && moveMutation.mutate(moveDialogItem.id)}
              className="gap-1.5"
            >
              {moveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminRefurbishment;
