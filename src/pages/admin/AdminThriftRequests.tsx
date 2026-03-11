import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { adminThriftApi, ThriftListing, ThriftItem } from '@/services/api';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Clock, CheckCircle, XCircle, Truck, Package, Eye,
  Loader2, Calendar, IndianRupee, ImageOff, ChevronDown, ChevronUp,
  Search, Wrench, Tag, ChevronLeft, ChevronRight, MapPin, Phone, Pencil,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const LISTING_STATUS_CFG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING:    { label: 'Pending Review',  color: 'bg-amber-100 text-amber-700',   icon: Clock },
  OFFER_SENT: { label: 'Offer Sent',      color: 'bg-violet-100 text-violet-700', icon: IndianRupee },
  APPROVED:   { label: 'Approved',        color: 'bg-blue-100 text-blue-700',     icon: CheckCircle },
  REJECTED:   { label: 'Rejected',        color: 'bg-red-100 text-red-700',       icon: XCircle },
  PICKED_UP:  { label: 'Picked Up',       color: 'bg-purple-100 text-purple-700', icon: Truck },
  COMPLETED:  { label: 'Completed',       color: 'bg-green-100 text-green-700',   icon: CheckCircle },
};

// Format monetary value — strips floating point drift, omits decimals when whole number
const fmtPrice = (val: any) => {
  const n = Math.round(Number(val) * 100) / 100;
  return n % 1 === 0 ? n.toLocaleString('en-IN') : n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const ITEM_STATUS_CFG: Record<string, { label: string; color: string }> = {
  PENDING:             { label: 'Pending',       color: 'bg-amber-50 text-amber-700'    },
  APPROVED:            { label: 'Approved',       color: 'bg-blue-50 text-blue-700'      },
  REJECTED:            { label: 'Rejected',       color: 'bg-red-50 text-red-700'        },
  PICKED_UP:           { label: 'Picked Up',      color: 'bg-purple-50 text-purple-700'  },
  UNDER_REFURBISHMENT: { label: 'Refurbishment',  color: 'bg-orange-50 text-orange-700'  },
  LISTED:              { label: 'Listed',          color: 'bg-green-50 text-green-700'    },
  SOLD:                { label: 'Sold',             color: 'bg-emerald-50 text-emerald-700'},
};

const CONDITION_LABEL: Record<string, string> = {
  POOR: 'Poor', FAIR: 'Fair', GOOD: 'Good', VERY_GOOD: 'Very Good', LIKE_NEW: 'Like New',
};

const PICKUP_SLOTS = ['8 AM - 11 AM', '11 AM - 2 PM', '2 PM - 5 PM', '5 PM - 8 PM'];

function ItemThumb({ src, alt }: { src?: string; alt: string }) {
  if (!src) return (
    <div className="h-14 w-14 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
      <ImageOff className="h-5 w-5 text-gray-300" />
    </div>
  );
  return (
    <img
      src={src.startsWith('http') ? src : `http://localhost:5000/${src}`}
      alt={alt}
      className="h-14 w-14 rounded-lg object-cover border border-gray-200 shrink-0"
    />
  );
}

function ItemImageGallery({ images, alt }: { images?: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const imgs = images?.filter(Boolean) ?? [];
  if (imgs.length === 0) return (
    <div className="w-full h-40 rounded-xl bg-gray-100 flex items-center justify-center">
      <ImageOff className="h-8 w-8 text-gray-300" />
    </div>
  );
  const url = (src: string) => src.startsWith('http') ? src : `http://localhost:5000/${src}`;
  const prev = () => setActive((i) => (i - 1 + imgs.length) % imgs.length);
  const next = () => setActive((i) => (i + 1) % imgs.length);
  return (
    <div className="space-y-2">
      {/* Main image */}
      <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
        <img src={url(imgs[active])} alt={`${alt} ${active + 1}`} className="w-full h-full object-cover" />
        {imgs.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={next} className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition">
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="absolute bottom-1.5 right-2 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded-full">
              {active + 1}/{imgs.length}
            </span>
          </>
        )}
      </div>
      {/* Thumbnail strip */}
      {imgs.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {imgs.map((src, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={cn('shrink-0 h-12 w-12 rounded-lg overflow-hidden border-2 transition',
                i === active ? 'border-green-500' : 'border-transparent opacity-60 hover:opacity-90')}>
              <img src={url(src)} alt={`${alt} thumb ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface ReviewState {
  [itemId: string]: { approved: boolean; estimatedValue: string; rejectionReason: string };
}

function ReviewDialog({ listing, open, onClose }: { listing: ThriftListing; open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [pickupDate, setPickupDate] = useState('');
  const [pickupSlot, setPickupSlot] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [decision, setDecision] = useState<'OFFER' | 'REJECTED'>('OFFER');
  const [itemReviews, setItemReviews] = useState<ReviewState>(() =>
    Object.fromEntries(listing.items.map((item) => [item.id, { approved: true, estimatedValue: '', rejectionReason: '' }]))
  );

  const reviewMutation = useMutation({
    mutationFn: (d: 'OFFER' | 'REJECTED') =>
      adminThriftApi.reviewListing(listing.id, {
        decision: d,
        pickupDate: d === 'OFFER' ? pickupDate : undefined,
        pickupSlot: d === 'OFFER' ? pickupSlot : undefined,
        adminNotes,
        items: listing.items.map((item) => ({
          id: item.id,
          approved: itemReviews[item.id]?.approved ?? true,
          estimatedValue: itemReviews[item.id]?.approved ? parseFloat(itemReviews[item.id]?.estimatedValue || '0') || undefined : undefined,
          rejectionReason: !itemReviews[item.id]?.approved ? itemReviews[item.id]?.rejectionReason : undefined,
        })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'thrift', 'requests'] });
      toast({ title: decision === 'OFFER' ? 'Offer sent to seller!' : 'Listing rejected', description: decision === 'OFFER' ? 'The seller will be notified to review and respond.' : 'The listing has been rejected.' });
      onClose();
    },
    onError: (e: any) => toast({ title: 'Error', description: e?.response?.data?.message || 'Review failed', variant: 'destructive' }),
  });

  const setItemReview = (id: string, field: string, value: string | boolean) =>
    setItemReviews((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

  const approvedCount = Object.values(itemReviews).filter((r) => r.approved).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review &amp; Send Offer</DialogTitle>
          <DialogDescription>
            Submitted by <strong>{listing.user?.name}</strong> - {listing.items.length} items - {format(new Date(listing.createdAt), 'dd MMM yyyy')}
          </DialogDescription>
        </DialogHeader>

        {/* Pickup Address */}
        {listing.pickupAddress && (
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm">
            <MapPin className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-800 mb-0.5">Pickup Address</p>
              <p className="text-blue-700 font-medium">{listing.pickupAddress.name} &middot; {listing.pickupAddress.phone}</p>
              <p className="text-blue-700">
                {listing.pickupAddress.addressLine1}
                {listing.pickupAddress.addressLine2 ? `, ${listing.pickupAddress.addressLine2}` : ''}
              </p>
              <p className="text-blue-600">
                {listing.pickupAddress.city}, {listing.pickupAddress.state} {listing.pickupAddress.zipCode}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-5">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">Items ({approvedCount}/{listing.items.length} approved)</p>
            {listing.items.map((item) => {
              const rev = itemReviews[item.id];
              return (
                <div key={item.id} className={cn('border rounded-xl p-4 space-y-3', rev?.approved ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/20')}>
                  {/* Image gallery */}
                  <ItemImageGallery images={item.images} alt={item.name} />
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.brand && `${item.brand} - `}{CONDITION_LABEL[item.condition]}{item.size && ` - Size ${item.size}`}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{[item.gender === 'MENS' ? "Men's" : item.gender === 'WOMENS' ? "Women's" : null, item.wearType === 'TOPWEAR' ? 'Topwear' : item.wearType === 'BOTTOMWEAR' ? 'Bottomwear' : null, item.category, item.subCategory?.replace(/_/g, ' ')].filter(Boolean).join(' · ')}</p>
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.description}</p>
                          {item.originalPrice && <p className="text-xs text-gray-500 mt-1">Originally paid: Rs.{fmtPrice(item.originalPrice)}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-gray-600">Accept</Label>
                          <Checkbox checked={rev?.approved ?? true} onCheckedChange={(c) => setItemReview(item.id, 'approved', !!c)} disabled={decision === 'REJECTED'} />
                        </div>
                      </div>
                    </div>
                  </div>
                  {rev?.approved && decision === 'OFFER' ? (
                    <div className="space-y-1">
                      <Label className="text-xs">Offer Value for Seller (Rs.) *</Label>
                      <div className="relative max-w-[160px]">
                        <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <Input type="number" min="0" step="1" placeholder="0" value={rev.estimatedValue}
                          onChange={(e) => setItemReview(item.id, 'estimatedValue', e.target.value)} className="h-8 text-sm pl-7" />
                      </div>
                      <p className="text-[10px] text-gray-400">Amount the seller receives when their item sells</p>
                    </div>
                  ) : (!rev?.approved && (
                    <div className="space-y-1">
                      <Label className="text-xs text-red-600">Rejection Reason</Label>
                      <Input placeholder="e.g. Too worn, stains, not accepted category" value={rev?.rejectionReason || ''}
                        onChange={(e) => setItemReview(item.id, 'rejectionReason', e.target.value)} className="h-8 text-sm border-red-200" />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          {decision === 'OFFER' && approvedCount > 0 && (
            <div className="space-y-3 border-t pt-4">
              <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Proposed Pickup Schedule</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Pickup Date *</Label>
                  <Input type="date" value={pickupDate} min={new Date().toISOString().split('T')[0]} onChange={(e) => setPickupDate(e.target.value)} className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Time Slot</Label>
                  <Select value={pickupSlot} onValueChange={setPickupSlot}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select slot" /></SelectTrigger>
                    <SelectContent>{PICKUP_SLOTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs">Note to Seller (optional)</Label>
            <Textarea placeholder="Any message to relay to the seller..." value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={2} className="text-sm resize-none" />
          </div>
        </div>
        <DialogFooter className="mt-4 flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={reviewMutation.isPending}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={() => { setDecision('REJECTED'); reviewMutation.mutate('REJECTED'); }}
            disabled={reviewMutation.isPending}
          >
            {reviewMutation.isPending && decision === 'REJECTED'
              ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              : <XCircle className="h-4 w-4 mr-1.5" />}
            Reject All
          </Button>
          <Button
            onClick={() => { setDecision('OFFER'); reviewMutation.mutate('OFFER'); }}
            disabled={
              reviewMutation.isPending ||
              (approvedCount > 0 && (
                !pickupDate ||
                !pickupSlot ||
                listing.items.some((item) => itemReviews[item.id]?.approved && !itemReviews[item.id]?.estimatedValue)
              ))
            }
            className="bg-violet-600 hover:bg-violet-700"
          >
            {reviewMutation.isPending && decision === 'OFFER'
              ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              : <IndianRupee className="h-4 w-4 mr-1.5" />}
            Send Offer to Seller
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Offer Dialog ─────────────────────────────────────────────────────

function EditOfferDialog({ listing, open, onClose }: { listing: ThriftListing; open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [pickupDate, setPickupDate] = useState(() => listing.pickupDate ? new Date(listing.pickupDate).toISOString().split('T')[0] : '');
  const [pickupSlot, setPickupSlot] = useState(listing.pickupSlot || '');
  const [adminNotes, setAdminNotes] = useState(listing.adminNotes || '');
  const [itemValues, setItemValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      listing.items
        .filter((i) => i.status !== 'REJECTED')
        .map((i) => [i.id, i.estimatedValue != null ? String(Number(i.estimatedValue)) : ''])
    )
  );

  const approvedItems = listing.items.filter((i) => i.status !== 'REJECTED');

  const updateMutation = useMutation({
    mutationFn: () =>
      adminThriftApi.updateOffer(listing.id, {
        pickupDate: pickupDate || undefined,
        pickupSlot: pickupSlot || undefined,
        adminNotes: adminNotes || undefined,
        items: approvedItems.map((item) => ({
          id: item.id,
          estimatedValue: parseFloat(itemValues[item.id] || '0') || 0,
        })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'thrift', 'requests'] });
      toast({ title: 'Offer updated!', description: 'The seller will see the revised offer.' });
      onClose();
    },
    onError: (e: any) => toast({ title: 'Error', description: e?.response?.data?.message || 'Update failed', variant: 'destructive' }),
  });

  const isValid = approvedItems.every((i) => !!itemValues[i.id] && parseFloat(itemValues[i.id]) > 0) && !!pickupDate && !!pickupSlot;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Offer</DialogTitle>
          <DialogDescription>
            Revise your offer for <strong>{listing.user?.name}</strong>. The seller will be notified to review the updated offer.
          </DialogDescription>
        </DialogHeader>

        {listing.contactRequested && (
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2.5 text-sm text-orange-700">
            <Phone className="h-4 w-4 shrink-0" />
            <span>Seller requested a call to negotiate pricing.</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Per-item offer values */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">Item Offer Values</p>
            {approvedItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 border border-gray-200 rounded-lg p-3">
                <ItemThumb src={item.images?.[0]} alt={item.name} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-gray-400">{CONDITION_LABEL[item.condition]}</p>
                </div>
                <div className="relative w-32 shrink-0">
                  <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    type="number" min="0" step="1" placeholder="0"
                    value={itemValues[item.id] ?? ''}
                    onChange={(e) => setItemValues((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    className="h-8 text-sm pl-7"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Pickup schedule */}
          <div className="space-y-3 border-t pt-3">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Pickup Schedule</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Pickup Date *</Label>
                <Input type="date" value={pickupDate} min={new Date().toISOString().split('T')[0]} onChange={(e) => setPickupDate(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Time Slot</Label>
                <Select value={pickupSlot} onValueChange={setPickupSlot}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select slot" /></SelectTrigger>
                  <SelectContent>{PICKUP_SLOTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Note to Seller (optional)</Label>
            <Textarea
              placeholder="Explain any changes or add context for the seller..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={2}
              className="text-sm resize-none"
            />
          </div>
        </div>

        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" onClick={onClose} disabled={updateMutation.isPending}>Cancel</Button>
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending || !isValid}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
            <IndianRupee className="h-4 w-4 mr-1.5" />
            Update &amp; Resend Offer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ItemPipelineDialog({ item, open, onClose }: { item: ThriftItem | null; open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState('');
  const [listedPrice, setListedPrice] = useState('');
  const [description, setDescription] = useState('');
  if (!item) return null;

  const statusMutation = useMutation({
    mutationFn: (status: string) => adminThriftApi.updateItemStatus(item.id, status as any, notes || undefined),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'thrift', 'requests'] }); toast({ title: 'Item status updated' }); onClose(); },
    onError: (e: any) => toast({ title: 'Error', description: e?.response?.data?.message || 'Failed', variant: 'destructive' }),
  });

  const listMutation = useMutation({
    mutationFn: () => adminThriftApi.listItem(item.id, { listedPrice: parseFloat(listedPrice), description: description || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'thrift', 'requests'] }); toast({ title: 'Item listed in store!' }); onClose(); },
    onError: (e: any) => toast({ title: 'Error', description: e?.response?.data?.message || 'Failed', variant: 'destructive' }),
  });

  const cfg = ITEM_STATUS_CFG[item.status as keyof typeof ITEM_STATUS_CFG];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Item</DialogTitle>
          <DialogDescription>{item.name} - {CONDITION_LABEL[item.condition]}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Current Status:</span>
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', cfg?.color)}>{cfg?.label}</span>
          </div>
          {item.estimatedValue && (
            <p className="text-sm text-green-700 font-medium">Offer to user: Rs.{fmtPrice(item.estimatedValue)}</p>
          )}
          <div className="space-y-1">
            <Label className="text-xs">Admin Notes</Label>
            <Input placeholder="Optional internal notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="h-9 text-sm" />
          </div>
          <div className="space-y-2 border-t pt-3">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Pipeline Actions</p>
            {item.status === 'PICKED_UP' && (
              <Button onClick={() => statusMutation.mutate('UNDER_REFURBISHMENT')} disabled={statusMutation.isPending}
                className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-9">
                <Wrench className="h-3.5 w-3.5 mr-1" /> Start Refurbishment
              </Button>
            )}
            {(item.status === 'PICKED_UP' || item.status === 'UNDER_REFURBISHMENT') && (
              <div className="space-y-2 border border-green-200 rounded-lg p-3 bg-green-50">
                <p className="text-xs font-semibold text-green-700 flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> List in Store</p>
                <div className="space-y-1">
                  <Label className="text-xs">Listing Price (Rs.) *</Label>
                  <Input type="number" min="0" step="1" placeholder={item.estimatedValue ? fmtPrice(item.estimatedValue) : '0'}
                    value={listedPrice} onChange={(e) => setListedPrice(e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Store Description (optional)</Label>
                  <Textarea placeholder="Leave blank to use original description" value={description}
                    onChange={(e) => setDescription(e.target.value)} rows={2} className="text-sm resize-none" />
                </div>
                <Button onClick={() => listMutation.mutate()} disabled={listMutation.isPending || !listedPrice}
                  className="w-full bg-green-600 hover:bg-green-700 text-white h-8 text-xs">
                  {listMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                  Publish to Thrift Store
                </Button>
              </div>
            )}
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={onClose}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ListingRow({ listing, onReview, onEditOffer, onMarkPickedUp, onManageItem, isMarkingPickedUp }: {
  listing: ThriftListing; onReview: () => void; onEditOffer: () => void; onMarkPickedUp: () => void;
  onManageItem: (item: ThriftItem) => void; isMarkingPickedUp: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = LISTING_STATUS_CFG[listing.status] || LISTING_STATUS_CFG.PENDING;
  const Icon = cfg?.icon || Package;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-sm">{listing.user?.name}</p>
            <span className="text-gray-400 dark:text-gray-500 text-xs">{listing.user?.email}</span>
            {listing.contactRequested && listing.status === 'OFFER_SENT' && (
              <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 border border-orange-200 rounded-full px-2 py-0.5">
                <Phone className="h-3 w-3" /> Call requested
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium', cfg.color)}>
              <Icon className="h-3 w-3" /> {cfg.label}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">{listing.items.length} items - {format(new Date(listing.createdAt), 'dd MMM yyyy')}</span>
            {listing.pickupDate && (
              <span className="text-xs text-blue-600 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {format(new Date(listing.pickupDate), 'dd MMM')}{listing.pickupSlot && ` - ${listing.pickupSlot}`}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {listing.status === 'PENDING' && (
            <Button size="sm" onClick={onReview} className="h-8 text-xs bg-blue-600 hover:bg-blue-700">
              <Eye className="h-3.5 w-3.5 mr-1" /> Review
            </Button>
          )}
          {listing.status === 'OFFER_SENT' && (
            <Button size="sm" onClick={onEditOffer} variant="outline" className="h-8 text-xs text-violet-700 border-violet-300 hover:bg-violet-50">
              <Pencil className="h-3.5 w-3.5 mr-1" /> Edit Offer
            </Button>
          )}
          {listing.status === 'APPROVED' && (
            <Button size="sm" onClick={onMarkPickedUp} disabled={isMarkingPickedUp} className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white">
              {isMarkingPickedUp ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Truck className="h-3.5 w-3.5 mr-1" /> Mark Picked Up</>}
            </Button>
          )}
          <button onClick={() => setExpanded((p) => !p)} className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-4 bg-gray-50 dark:bg-gray-800/30">
          {/* Pickup address */}
          {listing.pickupAddress && (
            <div className="flex items-start gap-2 mb-4 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 text-xs">
              <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-semibold text-blue-700">Pickup from: </span>
                <span className="text-blue-700">{listing.pickupAddress.name} &middot; {listing.pickupAddress.phone}</span>
                <span className="text-blue-600 ml-1">
                  &mdash; {listing.pickupAddress.addressLine1}{listing.pickupAddress.addressLine2 ? `, ${listing.pickupAddress.addressLine2}` : ''}, {listing.pickupAddress.city}, {listing.pickupAddress.state} {listing.pickupAddress.zipCode}
                </span>
              </div>
            </div>
          )}
          <div className="space-y-3">
            {listing.items.map((item) => {
              const itemCfg = ITEM_STATUS_CFG[item.status as keyof typeof ITEM_STATUS_CFG];
              const canManage = ['PICKED_UP', 'UNDER_REFURBISHMENT'].includes(item.status);
              return (
                <div key={item.id} className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-3">
                  <ItemThumb src={item.images?.[0]} alt={item.name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate dark:text-gray-200">{item.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{item.brand && `${item.brand} - `}{CONDITION_LABEL[item.condition]}{item.size && ` - ${item.size}`}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{[item.gender === 'MENS' ? "Men's" : item.gender === 'WOMENS' ? "Women's" : null, item.wearType === 'TOPWEAR' ? 'Topwear' : item.wearType === 'BOTTOMWEAR' ? 'Bottomwear' : null, item.category, item.subCategory?.replace(/_/g, ' ')].filter(Boolean).join(' · ')}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className={cn('text-xs px-1.5 py-0.5 rounded', itemCfg?.color)}>{itemCfg?.label}</span>
                      {item.estimatedValue && <span className="text-xs text-green-700 font-medium">Offer: Rs.{fmtPrice(item.estimatedValue)}</span>}
                      {item.listedPrice && <span className="text-xs text-gray-500">Listed: Rs.{fmtPrice(item.listedPrice)}</span>}
                    </div>
                    {item.rejectionReason && <p className="text-xs text-red-500 mt-0.5">Rejected: {item.rejectionReason}</p>}
                  </div>
                  {canManage && <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={() => onManageItem(item)}>Manage</Button>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminThriftRequests() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [reviewListing, setReviewListing] = useState<ThriftListing | null>(null);
  const [editOfferListing, setEditOfferListing] = useState<ThriftListing | null>(null);
  const [managingItem, setManagingItem] = useState<ThriftItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'thrift', 'requests'],
    queryFn: () => adminThriftApi.getAllListings({ limit: 100 }),
    refetchInterval: 60_000,
  });

  const pickupMutation = useMutation({
    mutationFn: (id: string) => adminThriftApi.markPickedUp(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'thrift', 'requests'] }); toast({ title: 'Marked as picked up' }); },
    onError: (e: any) => toast({ title: 'Error', description: e?.response?.data?.message || 'Failed', variant: 'destructive' }),
  });

  const allListings: ThriftListing[] = data?.data || [];
  const filtered = allListings.filter((l) => {
    const matchStatus = statusFilter ? l.status === statusFilter : true;
    const matchSearch = search ? l.user?.name?.toLowerCase().includes(search.toLowerCase()) || l.user?.email?.toLowerCase().includes(search.toLowerCase()) || l.items.some((i) => i.name.toLowerCase().includes(search.toLowerCase())) : true;
    return matchStatus && matchSearch;
  });

  const counts = {
    total: allListings.length,
    pending: allListings.filter((l) => l.status === 'PENDING').length,
    offerSent: allListings.filter((l) => l.status === 'OFFER_SENT').length,
    approved: allListings.filter((l) => l.status === 'APPROVED').length,
    pickedUp: allListings.filter((l) => l.status === 'PICKED_UP').length,
    completed: allListings.filter((l) => l.status === 'COMPLETED').length,
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Thrift Requests</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Review seller submissions, send offers, and schedule pickups</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { key: '',           label: 'All',       count: counts.total },
            { key: 'PENDING',    label: 'Pending',   count: counts.pending },
            { key: 'OFFER_SENT', label: 'Offer Sent', count: counts.offerSent },
            { key: 'APPROVED',   label: 'Approved',  count: counts.approved },
            { key: 'PICKED_UP',  label: 'Picked Up', count: counts.pickedUp },
            { key: 'COMPLETED',  label: 'Completed', count: counts.completed },
          ].map((s) => (
            <button key={s.key} onClick={() => setStatusFilter(s.key)}
              className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-colors', statusFilter === s.key ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500')}>
              {s.label} <span className="ml-1 font-bold">{s.count}</span>
            </button>
          ))}
        </div>
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search users or items..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-gray-400"><Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">No thrift requests found.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((listing) => (
              <ListingRow
                key={listing.id}
                listing={listing}
                onReview={() => setReviewListing(listing)}
                onEditOffer={() => setEditOfferListing(listing)}
                onMarkPickedUp={() => pickupMutation.mutate(listing.id)}
                onManageItem={(item) => setManagingItem(item)}
                isMarkingPickedUp={pickupMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
      {reviewListing && <ReviewDialog listing={reviewListing} open={!!reviewListing} onClose={() => setReviewListing(null)} />}
      {editOfferListing && <EditOfferDialog listing={editOfferListing} open={!!editOfferListing} onClose={() => setEditOfferListing(null)} />}
      {managingItem && <ItemPipelineDialog item={managingItem} open={!!managingItem} onClose={() => setManagingItem(null)} />}
    </AdminLayout>
  );
}
