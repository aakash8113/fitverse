import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Plus, ChevronLeft, ChevronRight, Package, Clock, CheckCircle,
  XCircle, Truck, Wrench, Tag, Eye, AlertTriangle, Loader2,
  Calendar, CircleDollarSign, ImageOff, Phone,
} from 'lucide-react';
import { thriftApi, ThriftListing, ThriftItem } from '@/services/api';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// ─── Status config ───────────────────────────────────────────────────────────

const LISTING_STATUS = {
  PENDING: {
    label: 'Under Review',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: Clock,
    desc: 'Our team is reviewing your submission.',
  },
  OFFER_SENT: {
    label: 'Offer Received',
    color: 'bg-violet-100 text-violet-700 border-violet-200',
    icon: CircleDollarSign,
    desc: 'We have evaluated your items and sent you an offer.',
  },
  APPROVED: {
    label: 'Approved — Pickup Scheduled',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Calendar,
    desc: "We'll pick up your items on the scheduled date.",
  },
  REJECTED: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: XCircle,
    desc: 'Your listing was rejected.',
  },
  PICKED_UP: {
    label: 'Picked Up',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    icon: Truck,
    desc: 'Items received. Processing in progress.',
  },
  COMPLETED: {
    label: 'Completed',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: CheckCircle,
    desc: 'All items have been processed.',
  },
};

const ITEM_STATUS = {
  PENDING: { label: 'Pending Review', color: 'bg-amber-50 text-amber-600', icon: Clock },
  APPROVED: { label: 'Approved', color: 'bg-blue-50 text-blue-600', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'bg-red-50 text-red-600', icon: XCircle },
  PICKED_UP: { label: 'Picked Up', color: 'bg-purple-50 text-purple-600', icon: Truck },
  UNDER_REFURBISHMENT: { label: 'Refurbishment', color: 'bg-orange-50 text-orange-600', icon: Wrench },
  LISTED: { label: 'Listed in Store', color: 'bg-green-50 text-green-600', icon: Tag },
  SOLD: { label: 'Sold!', color: 'bg-emerald-50 text-emerald-700', icon: CheckCircle },
};

const CONDITION_LABELS: Record<string, string> = {
  POOR: 'Poor', FAIR: 'Fair', GOOD: 'Good', VERY_GOOD: 'Very Good', LIKE_NEW: 'Like New',
};

// Format a monetary value: strips floating point drift, no decimals if whole number
const fmtPrice = (val: any) => {
  const n = Math.round(Number(val) * 100) / 100;
  return n % 1 === 0 ? n.toLocaleString('en-IN') : n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// ─── Offer Banner ─────────────────────────────────────────────────────────────

function OfferBanner({
  listing,
  onAccept,
  onDecline,
  onCall,
  isLoading,
  loadingAction,
}: {
  listing: ThriftListing;
  onAccept: () => void;
  onDecline: () => void;
  onCall: () => void;
  isLoading: boolean;
  loadingAction: string | null;
}) {
  const approvedItems = listing.items.filter((i) => i.status !== 'REJECTED');
  const rejectedItems = listing.items.filter((i) => i.status === 'REJECTED');
  const totalOffer = approvedItems.reduce((sum, i) => sum + Math.round(Number(i.estimatedValue || 0) * 100) / 100, 0);

  return (
    <div className="border border-violet-200 dark:border-violet-700/30 bg-violet-50 dark:bg-violet-950/20 rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0">
          <CircleDollarSign className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="font-semibold text-violet-900 dark:text-violet-100 text-sm">Fitverse has evaluated your items!</p>
          <p className="text-xs text-violet-600 dark:text-violet-300">If you accept, these coins will be credited when we pick up.</p>
        </div>
      </div>

      {/* Offer breakdown */}
      <div className="space-y-1.5">
        {approvedItems.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <span className="dark:text-gray-200 truncate max-w-[60%]">{item.name}</span>
            <span className="font-semibold text-yellow-700 flex items-center gap-1">
              <CircleDollarSign className="h-3.5 w-3.5" />
              {Math.round(Number(item.estimatedValue || 0))} coins
            </span>
          </div>
        ))}
        {rejectedItems.length > 0 && (
          <div className="text-xs text-red-500 pt-0.5">
            {rejectedItems.length} item{rejectedItems.length !== 1 ? 's' : ''} not accepted
          </div>
        )}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between border-t border-violet-200 dark:border-violet-800/30 pt-2">
        <span className="text-sm font-semibold dark:text-gray-200">Total Coins</span>
        <span className="text-lg font-bold text-yellow-700 flex items-center gap-1">
          <CircleDollarSign className="h-5 w-5" />
          {Math.round(totalOffer)} Fitverse Coins
        </span>
      </div>

      {/* Admin note */}
      {listing.adminNotes && (
        <div className="text-xs text-violet-800 dark:text-violet-200 bg-violet-100 dark:bg-violet-900/30 rounded-lg px-3 py-2">
          <span className="font-medium">Message from Fitverse: </span>{listing.adminNotes}
        </div>
      )}

      {/* Pickup info */}
      {listing.pickupDate && (
        <div className="text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/20 rounded-lg px-3 py-2 flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          Proposed pickup: <strong>{format(new Date(listing.pickupDate), 'EEE, dd MMM yyyy')}{listing.pickupSlot ? ` · ${listing.pickupSlot}` : ''}</strong>
        </div>
      )}

      {/* Call requested confirmation */}
      {listing.contactRequested && (
        <div className="text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-lg px-3 py-2 flex items-center gap-2">
          <Phone className="h-3.5 w-3.5 shrink-0" />
          You requested a call. Our team will reach out to you shortly to discuss the pricing.
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white flex-1 min-w-[100px]"
          disabled={isLoading}
          onClick={onAccept}
        >
          {isLoading && loadingAction === 'ACCEPT' ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle className="h-3.5 w-3.5 mr-1" />}
          Accept Offer
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-red-600 border-red-300 hover:bg-red-50 flex-1 min-w-[100px]"
          disabled={isLoading}
          onClick={onDecline}
        >
          {isLoading && loadingAction === 'DECLINE' ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <XCircle className="h-3.5 w-3.5 mr-1" />}
          Decline
        </Button>
        {!listing.contactRequested && (
          <Button
            size="sm"
            variant="outline"
            className="text-blue-600 border-blue-300 hover:bg-blue-50 w-full"
            disabled={isLoading}
            onClick={onCall}
          >
            {isLoading && loadingAction === 'CALL' ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Phone className="h-3.5 w-3.5 mr-1" />}
            Call Us to Negotiate Price
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Item Progress Bar ────────────────────────────────────────────────────────

const PIPELINE_STEPS = [
  { key: 'submitted', label: 'Submitted',   statuses: ['PENDING', 'APPROVED'] },
  { key: 'pickedup',  label: 'Picked Up',   statuses: ['PICKED_UP', 'UNDER_REFURBISHMENT'] },
  { key: 'listed',    label: 'Listed',      statuses: ['LISTED', 'SOLD'] },
];

function getStepIndex(status: string): number {
  for (let i = PIPELINE_STEPS.length - 1; i >= 0; i--) {
    if (PIPELINE_STEPS[i].statuses.includes(status)) return i;
  }
  return 0;
}

function ItemProgressBar({ status }: { status: string }) {
  if (status === 'REJECTED') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-red-500 mt-1">
        <XCircle className="h-3.5 w-3.5" /> Not accepted
      </div>
    );
  }
  const currentIdx = getStepIndex(status);
  return (
    <div className="flex items-center mt-1.5">
      {PIPELINE_STEPS.map((step, i) => {
        const done    = i < currentIdx;
        const active  = i === currentIdx;
        return (
          <div key={step.key} className="flex items-center flex-1 min-w-0 last:flex-none">
            {/* Circle */}
            <div className="flex flex-col items-center gap-0.5 shrink-0">
              <div
                className={cn(
                  'h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold border-2 transition-colors',
                  done   ? 'bg-green-500 border-green-500 text-white'
                  : active ? 'bg-white border-green-500 text-green-600'
                  :          'bg-white border-gray-300 text-gray-400'
                )}
              >
                {done ? '✓' : i + 1}
              </div>
              <span
                className={cn(
                  'text-[9px] leading-tight whitespace-nowrap',
                  active ? 'text-green-600 font-semibold' : done ? 'text-green-500' : 'text-gray-400'
                )}
              >
                {step.label}
              </span>
            </div>
            {/* Connector */}
            {i < PIPELINE_STEPS.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-1 mb-3',
                  done ? 'bg-green-400' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Item Tile ────────────────────────────────────────────────────────────────

function ItemTile({ item }: { item: ThriftItem }) {
  const statusCfg = ITEM_STATUS[item.status as keyof typeof ITEM_STATUS];
  const StatusIcon = statusCfg?.icon || Package;

  return (
    <div className="flex gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-card transition-colors">
      {/* Image */}
      <div className="h-16 w-16 rounded-md border border-border overflow-hidden shrink-0 bg-muted">
        {item.images?.[0] ? (
          <img
            src={item.images[0].startsWith('http') ? item.images[0] : `http://localhost:5000/${item.images[0]}`}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <ImageOff className="h-5 w-5 text-gray-300" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-sm truncate">{item.name}</p>
            <p className="text-xs text-muted-foreground">
              {item.brand && `${item.brand} · `}{CONDITION_LABELS[item.condition]}{item.size && ` · ${item.size}`}
            </p>
          </div>
          <span className={cn('text-[10px] px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1', statusCfg?.color)}>
            <StatusIcon className="h-2.5 w-2.5" />
            {statusCfg?.label}
          </span>
        </div>

        {/* Values */}
        <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {item.originalPrice && (
            <span>Paid: <span className="font-medium">₹{fmtPrice(item.originalPrice)}</span></span>
          )}
          {item.estimatedValue && (
            <span className="text-yellow-700 font-semibold flex items-center gap-0.5">
              <CircleDollarSign className="h-3 w-3" /> {Math.round(Number(item.estimatedValue))} coins
            </span>
          )}
          {item.listedPrice && (
            <span>Listed at: <span className="font-medium">₹{fmtPrice(item.listedPrice)}</span></span>
          )}
        </div>

        {/* Rejection reason */}
        {item.status === 'REJECTED' && item.rejectionReason && (
          <p className="mt-1.5 text-xs text-red-500 flex items-start gap-1">
            <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
            {item.rejectionReason}
          </p>
        )}

        {/* Admin notes */}
        {item.adminNotes && item.status !== 'REJECTED' && (
          <p className="mt-1.5 text-xs text-muted-foreground italic">"{item.adminNotes}"</p>
        )}
      </div>
    </div>
  );
}

// ─── Listing Card ─────────────────────────────────────────────────────────────

interface ListingCardProps {
  listing: ThriftListing;
  onView: () => void;
  onCancel: () => void;
  isCancelling: boolean;
  onRespond: (action: 'ACCEPT' | 'DECLINE' | 'CALL') => void;
  isResponding: boolean;
  respondingAction: string | null;
}

function ListingCard({ listing, onView, onCancel, isCancelling, onRespond, isResponding, respondingAction }: ListingCardProps) {
  const cfg = LISTING_STATUS[listing.status];
  const Icon = cfg?.icon || Clock;
  const approvedItems = listing.items.filter((i) => i.status !== 'REJECTED');
  const rejectedItems = listing.items.filter((i) => i.status === 'REJECTED');
  const totalOffer = approvedItems.reduce((sum, i) => sum + Math.round(Number(i.estimatedValue || 0) * 100) / 100, 0);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 bg-muted/30 border-b border-border">
        <div>
          <p className="text-xs text-muted-foreground mb-1">
            Submitted {format(new Date(listing.createdAt), 'dd MMM yyyy, h:mm a')}
          </p>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border',
                cfg.color
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {cfg.label}
            </span>
            <span className="text-xs text-muted-foreground">{listing.items.length} item{listing.items.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <button
          onClick={onView}
          className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 border border-gray-200 rounded px-2 py-1 hover:bg-gray-100 transition-colors dark:text-white"
        >
          <Eye className="h-3.5 w-3.5 text-white" /> Details
        </button>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-3">
        {/* Pickup info */}
        {listing.pickupDate && (
          <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/20 rounded-lg px-3 py-2">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>
              Pickup: <strong>{format(new Date(listing.pickupDate), 'EEEE, dd MMM yyyy')}</strong>
              {listing.pickupSlot && ` · ${listing.pickupSlot}`}
            </span>
          </div>
        )}

        {/* Admin notes */}
        {listing.adminNotes && (
          <div className="text-xs text-gray-600 dark:text-gray-300 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-900/30 rounded px-3 py-2">
            <span className="font-medium">Admin note: </span>{listing.adminNotes}
          </div>
        )}

        {/* Offer summary */}
        {totalOffer > 0 && (
          <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg px-3 py-2">
            <CircleDollarSign className="h-4 w-4 shrink-0" />
            <span>
              {listing.status === 'PICKED_UP' ? (
                <>You have earned <strong>{Math.round(totalOffer).toLocaleString()} Fitverse Coins</strong></>
              ) : (
                <>You'll earn <strong>{Math.round(totalOffer).toLocaleString()} Fitverse Coins</strong> when picked up</>
              )}
              {rejectedItems.length > 0 && (
                <span className="text-muted-foreground ml-1">
                  ({rejectedItems.length} item{rejectedItems.length !== 1 ? 's' : ''} not accepted)
                </span>
              )}
            </span>
          </div>
        )}

        {/* Offer banner — shown when listing is OFFER_SENT */}
        {listing.status === 'OFFER_SENT' && (
          <OfferBanner
            listing={listing}
            onAccept={() => onRespond('ACCEPT')}
            onDecline={() => onRespond('DECLINE')}
            onCall={() => onRespond('CALL')}
            isLoading={isResponding}
            loadingAction={respondingAction}
          />
        )}

        {/* Items preview */}
        <div className="space-y-2">
          {listing.items.slice(0, 3).map((item) => (
            <ItemTile key={item.id} item={item} />
          ))}
          {listing.items.length > 3 && (
            <button onClick={onView} className="text-xs text-gray-500 hover:text-gray-700 underline">
              +{listing.items.length - 3} more items
            </button>
          )}
        </div>
      </div>

      {/* Cancel button only for PENDING */}
      {listing.status === 'PENDING' && (
        <div className="px-5 py-3 border-t border-border flex justify-end">
          <Button
            variant="outline"
            size="sm"
            disabled={isCancelling}
            onClick={onCancel}
            className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            {isCancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Cancel Listing'}
          </Button>
        </div>
      )}
    </div>
  );
}

function ListingDetailDialog({
  listing,
  open,
  onClose,
  onRespond,
  isResponding,
  respondingAction,
}: {
  listing: ThriftListing | null;
  open: boolean;
  onClose: () => void;
  onRespond: (action: 'ACCEPT' | 'DECLINE' | 'CALL') => void;
  isResponding: boolean;
  respondingAction: string | null;
}) {
  if (!listing) return null;
  const cfg = LISTING_STATUS[listing.status];
  const Icon = cfg?.icon || Clock;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Listing Details</DialogTitle>
          <DialogDescription>
            Submitted {format(new Date(listing.createdAt), 'dd MMM yyyy')} · {listing.items.length} items
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div className={cn('flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border', cfg.color)}>
            <Icon className="h-4 w-4" /> {cfg.label}
            <span className="text-xs font-normal ml-1 opacity-80">— {cfg.desc}</span>
          </div>

          {/* Pickup */}
          {listing.pickupDate && listing.status !== 'OFFER_SENT' && (
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-0.5 flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Scheduled Pickup
              </p>
              <p>{format(new Date(listing.pickupDate), 'EEEE, dd MMMM yyyy')}{listing.pickupSlot && ` · ${listing.pickupSlot}`}</p>
            </div>
          )}

          {/* Admin notes (non-offer context) */}
          {listing.adminNotes && listing.status !== 'OFFER_SENT' && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-lg px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
              <strong>Message from admin:</strong> {listing.adminNotes}
            </div>
          )}

          {/* Offer banner in detail dialog */}
          {listing.status === 'OFFER_SENT' && (
            <OfferBanner
              listing={listing}
              onAccept={() => onRespond('ACCEPT')}
              onDecline={() => onRespond('DECLINE')}
              onCall={() => onRespond('CALL')}
              isLoading={isResponding}
              loadingAction={respondingAction}
            />
          )}

          {/* All items */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-700">All Items</h3>
            <div className="space-y-3">
              {listing.items.map((item) => (
                <ItemTile key={item.id} item={item} />
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ThriftMyListings() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selectedListing, setSelectedListing] = useState<ThriftListing | null>(null);
  const [page, setPage] = useState(1);
  const [respondingAction, setRespondingAction] = useState<string | null>(null);
  const PAGE_SIZE = 5;

  const { data, isLoading, error } = useQuery({
    queryKey: ['thrift', 'my-listings'],
    queryFn: () => thriftApi.getMyListings(),
    retry: 1,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => thriftApi.cancelListing(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['thrift', 'my-listings'] });
      toast({ title: 'Listing cancelled' });
    },
    onError: (e: any) => {
      toast({ title: 'Error', description: e?.response?.data?.message || 'Failed to cancel', variant: 'destructive' });
    },
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'ACCEPT' | 'DECLINE' | 'CALL' }) =>
      thriftApi.respondToOffer(id, action),
    onMutate: ({ action }) => setRespondingAction(action),
    onSuccess: (_data, { action }) => {
      qc.invalidateQueries({ queryKey: ['thrift', 'my-listings'] });
      if (action === 'ACCEPT') {
        toast({ title: 'Offer accepted! 🎉', description: 'Pickup will be arranged as per the schedule.' });
        setSelectedListing(null);
      } else if (action === 'DECLINE') {
        toast({ title: 'Offer declined', description: 'You can submit a new listing anytime.' });
        setSelectedListing(null);
      } else {
        toast({ title: '📞 Call requested!', description: "Our team will reach out to you shortly to discuss pricing." });
      }
    },
    onError: (e: any) => {
      toast({ title: 'Error', description: e?.response?.data?.message || 'Something went wrong', variant: 'destructive' });
    },
    onSettled: () => setRespondingAction(null),
  });

  const handleRespond = (listing: ThriftListing, action: 'ACCEPT' | 'DECLINE' | 'CALL') => {
    respondMutation.mutate({ id: listing.id, action });
  };

  const listings: ThriftListing[] = data?.data || [];
  const totalPages = Math.ceil(listings.length / PAGE_SIZE);
  const paginatedListings = listings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-[hsl(var(--page-background))]">
      <Navbar />

      {/* Header */}
      <div className="bg-background border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5">
          <button
            onClick={() => navigate('/thrift')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Thrift Store
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">My Listings</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Track your thrift submissions and earnings</p>
            </div>
            <Button
              onClick={() => navigate('/thrift/sell')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="h-4 w-4 mr-1.5" /> New Listing
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-24 text-muted-foreground">
            <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-amber-400" />
            <p>Failed to load listings. Please try again.</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-24">
            <Package className="h-14 w-14 mx-auto mb-4 text-muted" />
            <h2 className="text-lg font-semibold mb-2">No listings yet</h2>
            <p className="text-muted-foreground mb-6 text-sm">Start selling your pre-loved items today!</p>
            <Button
              onClick={() => navigate('/thrift/sell')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Sell My Items
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">{listings.length} listing{listings.length !== 1 ? 's' : ''} total</p>
            {paginatedListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onView={() => setSelectedListing(listing)}
                onCancel={() => cancelMutation.mutate(listing.id)}
                isCancelling={cancelMutation.isPending}
                onRespond={(action) => handleRespond(listing, action)}
                isResponding={respondMutation.isPending && respondingAction !== null}
                respondingAction={respondingAction}
              />
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <ListingDetailDialog
        listing={selectedListing}
        open={!!selectedListing}
        onClose={() => setSelectedListing(null)}
        onRespond={(action) => selectedListing && handleRespond(selectedListing, action)}
        isResponding={respondMutation.isPending && respondingAction !== null}
        respondingAction={respondingAction}
      />

      <Footer />
    </div>
  );
}
