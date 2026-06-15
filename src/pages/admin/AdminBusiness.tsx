import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { adminApi, AdminUser } from '@/services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Search, Loader2, Zap, Copy } from 'lucide-react';

const AdminBusiness: React.FC = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [adjustDialog, setAdjustDialog] = useState<{ user: AdminUser | null; open: boolean }>({ user: null, open: false });
  const [creditAmount, setCreditAmount] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: adminApi.getUsers,
    retry: false,
  });

  const users: AdminUser[] = (data?.data || []).filter((u: AdminUser) => u.role === 'BUSINESS');

  const adjustCreditsMutation = useMutation({
    mutationFn: ({ userId, amount }: { userId: string; amount: number }) =>
      adminApi.adjustAiCredits(userId, amount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({ title: 'Credits adjusted' });
      setAdjustDialog({ user: null, open: false });
    },
    onError: (err: any) =>
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed', variant: 'destructive' }),
  });

  const filtered = users.filter((u) =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Business Accounts</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage business API accounts and credits</p>
          </div>
        </div>

        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search businesses..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">No business accounts found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 border-b">
                    <th className="text-left px-4 py-3 font-medium">Business</th>
                    <th className="text-left px-4 py-3 font-medium">Email</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Credits</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user, idx) => (
                    <tr key={user.id} className={`border-b last:border-0 ${idx % 2 === 0 ? '' : 'bg-gray-50/40 dark:bg-gray-800/20'}`}>
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{user.name}</td>
                      <td className="px-4 py-3 text-gray-500">{user.email}</td>
                      <td className="px-4 py-3"><StatusBadge status="business" /></td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-yellow-700 font-medium">
                          <Zap className="h-3.5 w-3.5" />
                          {(user as any).businessCredits ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="outline" className="h-8 text-xs"
                          onClick={() => { setAdjustDialog({ user, open: true }); setCreditAmount(''); }}>
                          Adjust Credits
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Dialog open={adjustDialog.open} onOpenChange={(o) => setAdjustDialog({ ...adjustDialog, open: o })}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Adjust Business Credits</DialogTitle></DialogHeader>
          {adjustDialog.user && (
            <div className="space-y-4">
              <div className="bg-yellow-50 rounded-lg p-3 text-sm">
                <p className="font-medium">{adjustDialog.user.name}</p>
                <p className="text-xs text-gray-500">{adjustDialog.user.email}</p>
                <p className="text-xs text-yellow-700 font-medium mt-1">
                  Current credits: {(adjustDialog.user as any).businessCredits ?? 0}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Amount (positive to add, negative to deduct)</Label>
                <Input type="number" value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} placeholder="e.g. 100 or -50" />
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setAdjustDialog({ user: null, open: false })}>Cancel</Button>
                <Button size="sm" disabled={adjustCreditsMutation.isPending || !creditAmount} className="bg-yellow-500 hover:bg-yellow-600 text-white"
                  onClick={() => adjustCreditsMutation.mutate({ userId: adjustDialog.user!.id, amount: parseInt(creditAmount) })}>
                  {adjustCreditsMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                  Apply
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminBusiness;