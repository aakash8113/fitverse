import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addressesApi, Address } from '@/services/api';
import { isServiceable } from '@/lib/pincodes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { MapPin, Plus, Loader2, ChevronUp, Check } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface AddressFormData {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

const emptyForm: AddressFormData = {
  name: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'India',
  isDefault: false,
};

interface AddressSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
  /** 'green' for thrift (default), 'dark' for checkout */
  variant?: 'green' | 'dark';
  /** When true, unserviceable addresses are greyed-out and non-selectable */
  enforceServiceability?: boolean;
}

export function AddressSelector({ selectedId, onSelect, variant = 'green', enforceServiceability = false }: AddressSelectorProps) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddressFormData>(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: addressesApi.getAddresses,
  });

  const addresses: Address[] = data?.data || [];

  // Auto-select on load: prefer default address; if enforcing serviceability, skip unserviceable ones
  useEffect(() => {
    if (addresses.length > 0 && !selectedId) {
      const candidates = enforceServiceability
        ? addresses.filter((a) => isServiceable(a.zipCode))
        : addresses;
      const def = candidates.find((a) => a.isDefault) ?? candidates[0];
      if (def) onSelect(def.id);
    }
  }, [addresses.length]);

  const createMutation = useMutation({
    mutationFn: addressesApi.createAddress,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['addresses'] });
      const newId = res?.data?.id;
      if (newId) onSelect(newId); // auto-select the newly added address
      setShowForm(false);
      setForm(emptyForm);
      toast({ title: 'Address saved', description: 'New address added and selected.' });
    },
    onError: () => {
      toast({ title: 'Failed to save address', description: 'Please try again.', variant: 'destructive' });
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const { name, phone, addressLine1, city, state, zipCode } = form;
    if (!name || !phone || !addressLine1 || !city || !state || !zipCode) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    createMutation.mutate(form);
  };

  const update = (field: keyof AddressFormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const selectedCardClass =
    variant === 'green'
      ? 'border-green-500 bg-green-50 dark:bg-[#1A211E]'
      : 'border-foreground bg-foreground/5';

  const accentInput = variant === 'green' ? 'accent-green-600' : '';
  const addBtnClass =
    variant === 'green'
      ? 'text-green-700 hover:text-green-800'
      : 'text-foreground hover:text-foreground/70';
  const saveBtnClass =
    variant === 'green'
      ? 'bg-green-600 hover:bg-green-700 text-white'
      : 'bg-foreground text-background hover:bg-foreground/90';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Empty state — no redirect, prompt to add inline */}
      {addresses.length === 0 && !showForm && (
        <div className="text-center py-6">
          <MapPin className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-foreground font-medium mb-1">No saved addresses</p>
          <p className="text-sm text-muted-foreground mb-4">Add your first address below to continue.</p>
        </div>
      )}

      {/* Address radio list — always shown so old addresses stay selectable */}
      {addresses.map((addr) => {
        const serviceable = !enforceServiceability || isServiceable(addr.zipCode);
        return (
          <label
            key={addr.id}
            className={cn(
              'flex items-start gap-4 p-4 rounded-lg border-2 transition-all',
              serviceable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60',
              selectedId === addr.id && serviceable
                ? selectedCardClass
                : 'border-border bg-card',
              serviceable && selectedId !== addr.id && 'hover:border-border/70',
            )}
          >
            <input
              type="radio"
              name="addressSelect"
              value={addr.id}
              checked={selectedId === addr.id}
              onChange={() => serviceable && onSelect(addr.id)}
              disabled={!serviceable}
              className={cn('mt-1', accentInput)}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-foreground">{addr.name}</span>
                {addr.isDefault && (
                  <span className="text-[11px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    Default
                  </span>
                )}
                {!serviceable && (
                  <span className="text-[11px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                    Outside delivery area
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{addr.phone}</p>
              <p className="text-sm text-foreground mt-1">
                {addr.addressLine1}
                {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
              </p>
              <p className="text-sm text-muted-foreground">
                {addr.city}, {addr.state} {addr.zipCode}
              </p>
            </div>
          </label>
        );
      })}

      {/* Toggle add-form button */}
      <button
        type="button"
        onClick={() => setShowForm((v) => !v)}
        className={cn('flex items-center gap-1.5 text-sm font-medium transition-colors pt-1', addBtnClass)}
      >
        {showForm ? (
          <><ChevronUp className="h-4 w-4" /> Cancel</>
        ) : (
          <><Plus className="h-4 w-4" /> Add a new address</>
        )}
      </button>

      {/* Inline add-address form */}
      {showForm && (
        <form
          onSubmit={handleSave}
          className="border border-border rounded-xl p-4 space-y-3 bg-muted/50 mt-1"
        >
          <p className="text-sm font-semibold text-foreground">New Address</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Full Name *</Label>
              <Input
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Phone *</Label>
              <Input
                placeholder="+91 9999999999"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Address Line 1 *</Label>
            <Input
              placeholder="House/Flat no., Street"
              value={form.addressLine1}
              onChange={(e) => update('addressLine1', e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Address Line 2</Label>
            <Input
              placeholder="Area, Landmark (optional)"
              value={form.addressLine2}
              onChange={(e) => update('addressLine2', e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">City *</Label>
              <Input
                placeholder="Mumbai"
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">State *</Label>
              <Input
                placeholder="Maharashtra"
                value={form.state}
                onChange={(e) => update('state', e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">PIN Code *</Label>
              <Input
                placeholder="400001"
                value={form.zipCode}
                onChange={(e) => update('zipCode', e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="addrIsDefault"
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => update('isDefault', e.target.checked)}
              className={accentInput}
            />
            <Label htmlFor="addrIsDefault" className="text-xs cursor-pointer">
              Set as default address
            </Label>
          </div>

          <Button
            type="submit"
            disabled={createMutation.isPending}
            size="sm"
            className={cn('w-full', saveBtnClass)}
          >
            {createMutation.isPending ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> Saving…</>
            ) : (
              <><Check className="h-3.5 w-3.5 mr-2" /> Save Address</>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
