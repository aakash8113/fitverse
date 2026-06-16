import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { adminApi, AdminUser, coinsApi, adminBusinessApi } from '@/services/api';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { FitverseCoinIcon } from '@/components/shared/FitverseCoinIcon';
import {
  Search, Loader2, Eye, UserX, UserCheck, Download, ShieldAlert, Trash2, Copy, UserPlus, Briefcase,
} from 'lucide-react';

const MOCK_USERS: AdminUser[] = [];

const AdminUsers: React.FC = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'USER' | 'ADMIN' | 'SELLER' | 'BUSINESS'>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [coinUser, setCoinUser] = useState<AdminUser | null>(null);
  const [coinDialogOpen, setCoinDialogOpen] = useState(false);
  const [coinAmount, setCoinAmount] = useState('');
  const [coinDescription, setCoinDescription] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteUserTarget, setDeleteUserTarget] = useState<AdminUser | null>(null);
  const [sellerDialogOpen, setSellerDialogOpen] = useState(false);
  const [businessDialogOpen, setBusinessDialogOpen] = useState(false);

  // Seller form
  const [sellerForm, setSellerForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [sellerAddress, setSellerAddress] = useState({ name: '', address: '', address2: '', city: '', state: '', pincode: '', phone: '', email: '' });

  // Business form
  const [businessForm, setBusinessForm] = useState({ name: '', email: '', password: '', phone: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: adminApi.getUsers,
    retry: false,
  });

  const users: AdminUser[] = data?.data || MOCK_USERS;

  const blockMutation = useMutation({
    mutationFn: ({ id, block }: { id: string; block: boolean }) =>
      block ? adminApi.blockUser(id) : adminApi.unblockUser(id),
    onSuccess: (_, { block }) => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({ title: block ? 'User blocked' : 'User unblocked' });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to update user', variant: 'destructive' }),
  });

  const coinMutation = useMutation({
    mutationFn: ({ userId, amount, description }: { userId: string; amount: number; description: string }) =>
      coinsApi.adminAdjust(userId, amount, description),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({ title: 'Coins adjusted', description: data.message });
      setCoinDialogOpen(false);
      setCoinAmount('');
      setCoinDescription('');
    },
    onError: (err: any) =>
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to adjust coins', variant: 'destructive' }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast({ title: 'User deleted' });
      setDeleteDialogOpen(false);
      setDeleteUserTarget(null);
      if (selectedUser?.id === deleteUserTarget?.id) { setDetailOpen(false); setSelectedUser(null); }
    },
    onError: (err: any) =>
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to delete user', variant: 'destructive' }),
  });

  const createSellerMutation = useMutation({
    mutationFn: (data: any) => adminBusinessApi.createSeller(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      setSellerDialogOpen(false);
      setSellerForm({ name: '', email: '', password: '', phone: '' });
      setSellerAddress({ name: '', address: '', address2: '', city: '', state: '', pincode: '', phone: '', email: '' });
      toast({ title: 'Seller created', description: 'Seller account and Shiprocket pickup address created.' });
    },
    onError: (err: any) =>
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to create seller', variant: 'destructive' }),
  });

  const createBusinessMutation = useMutation({
    mutationFn: (data: any) => adminBusinessApi.createBusiness(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      setBusinessDialogOpen(false);
      setBusinessForm({ name: '', email: '', password: '', phone: '' });
      toast({ title: 'Business created' });
    },
    onError: (err: any) =>
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to create business', variant: 'destructive' }),
  });

  const filtered = users.filter((u) => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u.id.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const openDetail = (u: AdminUser) => { setSelectedUser(u); setDetailOpen(true); };
  const openCoinDialog = (u: AdminUser) => { setCoinUser(u); setCoinAmount(''); setCoinDescription(''); setCoinDialogOpen(true); };
  const openDeleteDialog = (u: AdminUser) => { setDeleteUserTarget(u); setDeleteDialogOpen(true); };
  const copyUserId = async (id: string) => { try { await navigator.clipboard.writeText(id); toast({ title: 'UUID copied' }); } catch { toast({ title: 'Failed to copy UUID', variant: 'destructive' }); } };

  const exportCSV = () => {
    const csv = [['UUID', 'Name', 'Email', 'Role', 'Email Verified', 'Orders', 'Joined', 'Blocked'], ...filtered.map((u) => [u.id, u.name, u.email, u.role, u.isEmailVerified ? 'Yes' : 'No', u._count?.orders ?? 0, new Date(u.createdAt).toLocaleDateString('en-IN'), u.isBlocked ? 'Yes' : 'No'])].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'users.csv'; a.click();
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Users</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">View and manage registered users</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50" onClick={() => setSellerDialogOpen(true)}>
              <UserPlus className="h-4 w-4" /> Add Seller
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 border-yellow-300 text-yellow-700 hover:bg-yellow-50" onClick={() => setBusinessDialogOpen(true)}>
              <Briefcase className="h-4 w-4" /> Add Business
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCSV}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
          </div>
          <div className="flex gap-2">
            {(['all', 'USER', 'ADMIN', 'SELLER', 'BUSINESS'] as const).map((r) => (
              <button key={r} onClick={() => setRoleFilter(r)} className={`text-xs px-3 py-1.5 rounded border transition-colors ${roleFilter === r ? r === 'SELLER' ? 'border-emerald-600 bg-emerald-600 text-white' : r === 'BUSINESS' ? 'border-yellow-600 bg-yellow-600 text-white' : 'border-zinc-900 bg-zinc-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex gap-5 text-sm text-gray-500 dark:text-gray-400">
          <span>Total: <strong className="text-gray-900 dark:text-white">{users.length}</strong></span>
          <span>Users: <strong className="text-gray-900 dark:text-white">{users.filter((u) => u.role === 'USER').length}</strong></span>
          <span>Admins: <strong className="text-purple-700 dark:text-purple-400">{users.filter((u) => u.role === 'ADMIN').length}</strong></span>
          <span>Sellers: <strong className="text-emerald-700 dark:text-emerald-400">{users.filter((u) => u.role === 'SELLER').length}</strong></span>
          <span>Business: <strong className="text-yellow-700 dark:text-yellow-400">{users.filter((u) => u.role === 'BUSINESS').length}</strong></span>
          <span>Blocked: <strong className="text-red-600 dark:text-red-400">{users.filter((u) => u.isBlocked).length}</strong></span>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading users...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                    <th className="text-left px-4 py-3 font-medium">User</th>
                    <th className="text-left px-4 py-3 font-medium">UUID</th>
                    <th className="text-left px-4 py-3 font-medium">Role</th>
                    <th className="text-left px-4 py-3 font-medium">Verified</th>
                    <th className="text-left px-4 py-3 font-medium">Orders</th>
                    <th className="text-left px-4 py-3 font-medium">Coins</th>
                    <th className="text-left px-4 py-3 font-medium">Joined</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user, idx) => (
                    <tr key={user.id} className={`border-b border-gray-100 dark:border-gray-800 last:border-0 ${idx % 2 ? 'bg-gray-50/40 dark:bg-gray-800/20' : ''} ${user.isBlocked ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-xs font-semibold text-zinc-600 dark:text-zinc-300 shrink-0">{user.name.charAt(0).toUpperCase()}</div>
                          <div><p className="font-medium text-gray-800 dark:text-gray-200">{user.name}</p><p className="text-xs text-gray-400 dark:text-gray-500">{user.email}</p></div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-[240px]">
                          <span className="font-mono text-[11px] text-gray-600 dark:text-gray-300 break-all">{user.id}</span>
                          <button onClick={() => copyUserId(user.id)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0" title="Copy UUID"><Copy className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={user.role.toLowerCase()} /></td>
                      <td className="px-4 py-3"><span className={`text-xs ${user.isEmailVerified ? 'text-green-600' : 'text-gray-400'}`}>{user.isEmailVerified ? '✓ Email' : '✗ Email'}</span></td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{user._count?.orders ?? 0}</td>
                      <td className="px-4 py-3"><span className="flex items-center gap-1 text-xs text-yellow-700 font-medium"><FitverseCoinIcon className="h-3 w-3" />{user.coinBalance ?? 0}</span></td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="px-4 py-3">{user.isBlocked ? <StatusBadge status="blocked" /> : <StatusBadge status="active" customLabel="Active" />}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openDetail(user)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="View profile"><Eye className="h-3.5 w-3.5" /></button>
                          <button onClick={() => openCoinDialog(user)} className="text-gray-400 hover:text-yellow-600 p-1 rounded hover:bg-yellow-50 transition-colors" title="Adjust coins"><FitverseCoinIcon className="h-3.5 w-3.5" /></button>
                          {user.role !== 'ADMIN' && user.role !== 'SELLER' && user.role !== 'BUSINESS' && (
                            <button onClick={() => blockMutation.mutate({ id: user.id, block: !user.isBlocked })} disabled={blockMutation.isPending} className={`p-1 rounded transition-colors ${user.isBlocked ? 'text-gray-400 hover:text-green-600 hover:bg-green-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`} title={user.isBlocked ? 'Unblock user' : 'Block user'}>
                              {user.isBlocked ? <UserCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
                            </button>
                          )}
                          {user.role !== 'ADMIN' && user.role !== 'SELLER' && (
                            <button onClick={() => openDeleteDialog(user)} className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors" title="Delete user"><Trash2 className="h-3.5 w-3.5" /></button>
                          )}
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

      {/* Create Seller Dialog */}
      <Dialog open={sellerDialogOpen} onOpenChange={setSellerDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-emerald-600" /> Create Seller Account</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <p className="text-xs text-gray-500">Seller will be created with a Shiprocket pickup address automatically.</p>
            <div className="space-y-3 border-b pb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase">Account Details</h3>
              <div><Label className="text-xs">Name</Label><Input value={sellerForm.name} onChange={e => setSellerForm({ ...sellerForm, name: e.target.value })} className="h-9 text-sm" /></div>
              <div><Label className="text-xs">Email</Label><Input value={sellerForm.email} onChange={e => setSellerForm({ ...sellerForm, email: e.target.value })} type="email" className="h-9 text-sm" /></div>
              <div><Label className="text-xs">Password</Label><Input value={sellerForm.password} onChange={e => setSellerForm({ ...sellerForm, password: e.target.value })} type="password" className="h-9 text-sm" /></div>
              <div><Label className="text-xs">Phone</Label><Input value={sellerForm.phone} onChange={e => setSellerForm({ ...sellerForm, phone: e.target.value })} className="h-9 text-sm" /></div>
            </div>
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase">Pickup Address (registered on Shiprocket)</h3>
              <div><Label className="text-xs">Pickup Name</Label><Input value={sellerAddress.name} onChange={e => setSellerAddress({ ...sellerAddress, name: e.target.value })} placeholder="e.g. Main Warehouse" className="h-9 text-sm" /></div>
              <div><Label className="text-xs">Address *</Label><Input value={sellerAddress.address} onChange={e => setSellerAddress({ ...sellerAddress, address: e.target.value })} className="h-9 text-sm" required /></div>
              <div><Label className="text-xs">Address Line 2</Label><Input value={sellerAddress.address2} onChange={e => setSellerAddress({ ...sellerAddress, address2: e.target.value })} className="h-9 text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">City *</Label><Input value={sellerAddress.city} onChange={e => setSellerAddress({ ...sellerAddress, city: e.target.value })} className="h-9 text-sm" required /></div>
                <div><Label className="text-xs">State *</Label><Input value={sellerAddress.state} onChange={e => setSellerAddress({ ...sellerAddress, state: e.target.value })} className="h-9 text-sm" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Pincode *</Label><Input value={sellerAddress.pincode} onChange={e => setSellerAddress({ ...sellerAddress, pincode: e.target.value })} className="h-9 text-sm" required /></div>
                <div><Label className="text-xs">Phone *</Label><Input value={sellerAddress.phone} onChange={e => setSellerAddress({ ...sellerAddress, phone: e.target.value })} className="h-9 text-sm" required /></div>
              </div>
            </div>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={createSellerMutation.isPending || !sellerForm.name || !sellerForm.email || !sellerForm.password || !sellerAddress.address || !sellerAddress.city || !sellerAddress.state || !sellerAddress.pincode || !sellerAddress.phone}
              onClick={() => createSellerMutation.mutate({
                name: sellerForm.name,
                email: sellerForm.email,
                password: sellerForm.password,
                phone: sellerForm.phone || undefined,
                pickupAddress: {
                  name: sellerAddress.name || 'Main Warehouse',
                  address: sellerAddress.address,
                  address2: sellerAddress.address2 || undefined,
                  city: sellerAddress.city,
                  state: sellerAddress.state,
                  pincode: sellerAddress.pincode,
                  phone: sellerAddress.phone,
                  email: sellerAddress.email || sellerForm.email,
                }
              })}>
              {createSellerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Create Seller with Shiprocket
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Business Dialog */}
      <Dialog open={businessDialogOpen} onOpenChange={setBusinessDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-yellow-600" /> Create Business Account</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Name</Label><Input value={businessForm.name} onChange={e => setBusinessForm({ ...businessForm, name: e.target.value })} className="h-9 text-sm" /></div>
            <div><Label className="text-xs">Email</Label><Input value={businessForm.email} onChange={e => setBusinessForm({ ...businessForm, email: e.target.value })} type="email" className="h-9 text-sm" /></div>
            <div><Label className="text-xs">Password</Label><Input value={businessForm.password} onChange={e => setBusinessForm({ ...businessForm, password: e.target.value })} type="password" className="h-9 text-sm" /></div>
            <div><Label className="text-xs">Phone</Label><Input value={businessForm.phone} onChange={e => setBusinessForm({ ...businessForm, phone: e.target.value })} className="h-9 text-sm" /></div>
            <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white" disabled={createBusinessMutation.isPending || !businessForm.name || !businessForm.email || !businessForm.password}
              onClick={() => createBusinessMutation.mutate(businessForm)}>
              {createBusinessMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Create Business
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Coin Adjustment Dialog */}
      <Dialog open={coinDialogOpen} onOpenChange={setCoinDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><FitverseCoinIcon className="h-5 w-5" /> Adjust Fitverse Coins</DialogTitle></DialogHeader>
          {coinUser && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 bg-yellow-50 rounded-lg p-3">
                <p className="font-medium text-gray-800">{coinUser.name}</p>
                <p className="text-xs text-gray-500">{coinUser.email}</p>
                <p className="text-xs text-yellow-700 font-medium mt-1">Current balance: {coinUser.coinBalance ?? 0} coins</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="coin-amount" className="text-sm font-medium">Amount <span className="text-gray-400 font-normal">(positive to credit, negative to deduct)</span></Label>
                <Input id="coin-amount" type="number" placeholder="e.g. 50 or -20" value={coinAmount} onChange={(e) => setCoinAmount(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coin-desc" className="text-sm font-medium">Reason / Description</Label>
                <Input id="coin-desc" placeholder="e.g. Loyalty bonus, correction, etc." value={coinDescription} onChange={(e) => setCoinDescription(e.target.value)} className="h-9" />
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setCoinDialogOpen(false)}>Cancel</Button>
                <Button size="sm" className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white" disabled={coinMutation.isPending || !coinAmount || !coinDescription} onClick={() => { if (!coinUser) return; coinMutation.mutate({ userId: coinUser.id, amount: parseInt(coinAmount), description: coinDescription }); }}>
                  {coinMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* User detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>User Profile</DialogTitle></DialogHeader>
          {selectedUser && (
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-lg font-semibold text-zinc-600 dark:text-zinc-300">{selectedUser.name.charAt(0).toUpperCase()}</div>
                <div><p className="font-semibold text-gray-900 dark:text-white">{selectedUser.name}</p><p className="text-gray-500 dark:text-gray-400">{selectedUser.email}</p></div>
                <div className="ml-auto"><StatusBadge status={selectedUser.role.toLowerCase()} /></div>
              </div>
              {selectedUser.isBlocked && <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded px-3 py-2 text-red-700 text-xs"><ShieldAlert className="h-3.5 w-3.5" /> This user is currently blocked</div>}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="col-span-2"><p className="text-gray-400 dark:text-gray-500 mb-0.5">UUID</p><p className="font-mono text-[11px] text-gray-700 dark:text-gray-300 break-all">{selectedUser.id}</p></div>
                <div><p className="text-gray-400 dark:text-gray-500 mb-0.5">Phone</p><p className="text-gray-700 dark:text-gray-300">{selectedUser.phone || '—'}</p></div>
                <div><p className="text-gray-400 dark:text-gray-500 mb-0.5">Orders</p><p className="text-gray-700 dark:text-gray-300">{selectedUser._count?.orders ?? 0}</p></div>
                <div><p className="text-gray-400 dark:text-gray-500 mb-0.5">Email Verified</p><p className={selectedUser.isEmailVerified ? 'text-green-700' : 'text-red-500'}>{selectedUser.isEmailVerified ? 'Verified' : 'Not verified'}</p></div>
                <div><p className="text-gray-400 dark:text-gray-500 mb-0.5">Phone Verified</p><p className={selectedUser.isPhoneVerified ? 'text-green-700' : 'text-red-500'}>{selectedUser.isPhoneVerified ? 'Verified' : 'Not verified'}</p></div>
                <div><p className="text-gray-400 dark:text-gray-500 mb-0.5">Member Since</p><p className="text-gray-700 dark:text-gray-300">{new Date(selectedUser.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p></div>
                <div><p className="text-gray-400 dark:text-gray-500 mb-0.5">Last Updated</p><p className="text-gray-700 dark:text-gray-300">{new Date(selectedUser.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p></div>
              </div>
              {selectedUser.role !== 'ADMIN' && selectedUser.role !== 'SELLER' && (
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex gap-2">
                    <Button variant={selectedUser.isBlocked ? 'outline' : 'destructive'} size="sm" onClick={() => { blockMutation.mutate({ id: selectedUser.id, block: !selectedUser.isBlocked }); setDetailOpen(false); }} disabled={blockMutation.isPending} className="flex-1 gap-2">
                      {selectedUser.isBlocked ? <><UserCheck className="h-3.5 w-3.5" /> Unblock User</> : <><UserX className="h-3.5 w-3.5" /> Block User</>}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openDeleteDialog(selectedUser)} className="text-red-600 border-red-200 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5 mr-1" /> Delete</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete user dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete User?</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500">This will permanently delete <strong>{deleteUserTarget?.name}</strong> and all related data. This cannot be undone.</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" disabled={deleteUserMutation.isPending || !deleteUserTarget} onClick={() => deleteUserTarget && deleteUserMutation.mutate(deleteUserTarget.id)}>
              {deleteUserMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null} Delete Permanently
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminUsers;