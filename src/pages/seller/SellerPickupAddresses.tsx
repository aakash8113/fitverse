import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SellerLayout } from '@/components/seller/SellerLayout';
import { pickupAddressApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Plus, MapPin, Trash2, Star, AlertCircle } from 'lucide-react';

interface AddressForm {
  name: string;
  companyName: string;
  address: string;
  address2: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  isDefault: boolean;
}

const emptyForm: AddressForm = {
  name: '', companyName: '', address: '', address2: '',
  city: '', state: '', pincode: '', phone: '', email: '',
  isDefault: false,
};

const SellerPickupAddresses: React.FC = () => {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressForm>(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['seller', 'pickup-addresses'],
    queryFn: pickupAddressApi.getMyPickupAddresses,
  });

  const addresses = data?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: AddressForm) => pickupAddressApi.createPickupAddress(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller', 'pickup-addresses'] });
      setShowForm(false);
      setForm(emptyForm);
      toast({ title: 'Pickup address created' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed', description: err.response?.data?.message || err.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AddressForm> }) => pickupAddressApi.updatePickupAddress(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller', 'pickup-addresses'] });
      setShowForm(false);
      setEditId(null);
      setForm(emptyForm);
      toast({ title: 'Pickup address updated' });
    },
    onError: (err: any) => {
      toast({ title: 'Update failed', description: err.response?.data?.message || err.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => pickupAddressApi.deletePickupAddress(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller', 'pickup-addresses'] });
      toast({ title: 'Pickup address deleted' });
    },
    onError: (err: any) => {
      toast({ title: 'Delete failed', description: err.response?.data?.message || err.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      updateMutation.mutate({ id: editId, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const startEdit = (addr: any) => {
    setEditId(addr.id);
    setForm({
      name: addr.name || '',
      companyName: addr.companyName || '',
      address: addr.address || '',
      address2: addr.address2 || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      phone: addr.phone || '',
      email: addr.email || '',
      isDefault: addr.isDefault || false,
    });
    setShowForm(true);
  };

  return (
    <SellerLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Pickup Addresses</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Shiprocket uses these addresses to pick up your products for delivery
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={showForm}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Address
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {editId ? 'Edit Pickup Address' : 'New Pickup Address'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Name *</label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. My Warehouse" className="h-9 text-sm" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Company Name</label>
                <Input value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} placeholder="Business name" className="h-9 text-sm" />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs text-gray-500">Address *</label>
                <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Street address" className="h-9 text-sm" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Address Line 2</label>
                <Input value={form.address2} onChange={e => setForm({ ...form, address2: e.target.value })} placeholder="Apartment, suite, etc." className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">City *</label>
                <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="City" className="h-9 text-sm" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">State *</label>
                <Input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="State" className="h-9 text-sm" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Pincode *</label>
                <Input value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} placeholder="6-digit pincode" className="h-9 text-sm" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Phone *</label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" className="h-9 text-sm" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Email *</label>
                <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" placeholder="Email address" className="h-9 text-sm" required />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={form.isDefault}
                  onChange={e => setForm({ ...form, isDefault: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="isDefault" className="text-xs text-gray-600 dark:text-gray-400">Set as default pickup address</label>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                {editId ? 'Update' : 'Create'}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Addresses list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-16 text-sm text-gray-400 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p>No pickup addresses yet.</p>
            <p className="text-xs mt-1">Add at least one pickup address so Shiprocket can collect your products.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {addresses.map((addr: any) => (
              <div key={addr.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2">
                      <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{addr.name}</p>
                        {addr.isDefault && (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded-full">
                            <Star className="h-2.5 w-2.5" /> Default
                          </span>
                        )}
                      </div>
                      {addr.companyName && <p className="text-xs text-gray-500">{addr.companyName}</p>}
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        {addr.address}{addr.address2 ? `, ${addr.address2}` : ''}, {addr.city}, {addr.state} {addr.pincode}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{addr.phone} · {addr.email}</p>
                      {addr.shiprocketCode && (
                        <p className="text-[10px] text-blue-500 mt-1">Shiprocket Code: {addr.shiprocketCode}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => startEdit(addr)}>Edit</Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-red-500 border-red-200 hover:bg-red-50"
                      onClick={() => {
                        if (confirm('Delete this pickup address?')) deleteMutation.mutate(addr.id);
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SellerLayout>
  );
};

export default SellerPickupAddresses;