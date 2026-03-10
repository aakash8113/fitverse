import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { returnsApi, ReturnRequest, ReturnStatus } from "@/services/api";
import {
  Loader2, ArrowLeft, RotateCcw, RefreshCcw, CheckCircle2,
  XCircle, Package, Truck, Banknote, AlertCircle
} from "lucide-react";

const statusConfig: Record<ReturnStatus, { label: string; color: string }> = {
  REQUESTED:           { label: "Requested",           color: "text-yellow-600" },
  APPROVED:            { label: "Approved",            color: "text-blue-600" },
  REJECTED:            { label: "Rejected",            color: "text-red-600" },
  ITEM_RECEIVED:       { label: "Item Received",       color: "text-purple-600" },
  REFUND_INITIATED:    { label: "Refund Initiated",    color: "text-indigo-600" },
  REPLACEMENT_SHIPPED: { label: "Replacement Shipped", color: "text-cyan-600" },
  COMPLETED:           { label: "Completed",           color: "text-green-600" },
  CANCELLED:           { label: "Cancelled",           color: "text-muted-foreground" },
};

const reasonLabels: Record<string, string> = {
  DAMAGED: "Item Damaged",
  WRONG_ITEM: "Wrong Item Received",
  SIZE_ISSUE: "Size Issue",
  QUALITY_ISSUE: "Quality Not as Expected",
  OTHER: "Other",
};

// Timeline steps in order
const RETURN_TIMELINE: { status: ReturnStatus; label: string; icon: React.ElementType }[] = [
  { status: "REQUESTED",        label: "Requested",        icon: RotateCcw },
  { status: "APPROVED",         label: "Approved",         icon: CheckCircle2 },
  { status: "ITEM_RECEIVED",    label: "Item Received",    icon: Package },
  { status: "REFUND_INITIATED", label: "Refund Initiated", icon: Banknote },
  { status: "COMPLETED",        label: "Completed",        icon: CheckCircle2 },
];

const REPLACEMENT_TIMELINE: { status: ReturnStatus; label: string; icon: React.ElementType }[] = [
  { status: "REQUESTED",           label: "Requested",           icon: RefreshCcw },
  { status: "APPROVED",            label: "Approved",            icon: CheckCircle2 },
  { status: "ITEM_RECEIVED",       label: "Item Received",       icon: Package },
  { status: "REPLACEMENT_SHIPPED", label: "Replacement Shipped", icon: Truck },
  { status: "COMPLETED",           label: "Completed",           icon: CheckCircle2 },
];

const STATUS_ORDER: ReturnStatus[] = [
  "REQUESTED", "APPROVED", "ITEM_RECEIVED",
  "REFUND_INITIATED", "REPLACEMENT_SHIPPED", "COMPLETED",
];

function StatusTimeline({ request }: { request: ReturnRequest }) {
  const steps = request.type === "REPLACEMENT" ? REPLACEMENT_TIMELINE : RETURN_TIMELINE;
  const currentIdx = STATUS_ORDER.indexOf(request.status);
  const isRejected = request.status === "REJECTED";
  const isCancelled = request.status === "CANCELLED";

  if (isRejected || isCancelled) {
    return (
      <div className="flex items-center gap-2 text-sm py-3">
        <XCircle className="w-5 h-5 text-red-500" />
        <span className="font-medium text-red-600">
          {isRejected ? "Request Rejected" : "Request Cancelled"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {steps.map((step, i) => {
        const stepIdx = STATUS_ORDER.indexOf(step.status);
        const done = currentIdx >= stepIdx;
        const Icon = step.icon;
        return (
          <div key={step.status} className="flex items-center gap-1">
            <div className={`flex items-center gap-1.5 text-xs ${done ? "text-primary font-medium" : "text-muted-foreground"}`}>
              <Icon className={`w-3.5 h-3.5 ${done ? "text-primary" : "text-muted-foreground"}`} />
              {step.label}
            </div>
            {i < steps.length - 1 && (
              <div className={`h-px w-4 mx-1 ${stepIdx < currentIdx ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ReturnDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["return-request", id],
    queryFn: () => returnsApi.getRequestById(id!),
    enabled: !!id,
  });

  const request: ReturnRequest | undefined = data?.data;

  const cancelMutation = useMutation({
    mutationFn: () => returnsApi.cancelRequest(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["return-request", id] });
      queryClient.invalidateQueries({ queryKey: ["my-returns"] });
      toast({ title: "Request cancelled" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to cancel", description: err.response?.data?.message || "An error occurred", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background"><Navbar />
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        <Footer />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-background"><Navbar />
        <div className="section-container py-12 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground">Request not found.</p>
          <Link to="/returns"><Button variant="outline" className="mt-4">Back to My Returns</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  const cfg = statusConfig[request.status] || statusConfig.REQUESTED;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="section-container py-8 lg:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Back */}
          <Link to="/returns" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to My Returns
          </Link>

          <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold">{request.requestNumber}</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                {request.type === "RETURN" ? "Return Request" : "Replacement Request"} ·{" "}
                Order #{request.order?.orderNumber}
              </p>
            </div>
            <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
          </div>

          {/* Timeline */}
          <div className="glass rounded-2xl border border-border/50 p-5 mb-4">
            <h2 className="font-semibold mb-3">Status</h2>
            <StatusTimeline request={request} />
            {request.adminNote && (
              <div className="mt-4 pt-4 border-t border-border/50 bg-muted/40 rounded-lg px-3 py-2 text-sm">
                <span className="font-medium">Note from team: </span>{request.adminNote}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="glass rounded-2xl border border-border/50 p-5 mb-4 space-y-3">
            <h2 className="font-semibold mb-2">Request Details</h2>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium">{request.type === "RETURN" ? "Return" : "Replacement"}</span>
              <span className="text-muted-foreground">Reason</span>
              <span className="font-medium">{reasonLabels[request.reason] || request.reason}</span>
              {request.replacementSize && (
                <>
                  <span className="text-muted-foreground">Replacement Size</span>
                  <span className="font-medium">{request.replacementSize}</span>
                </>
              )}
              <span className="text-muted-foreground">Submitted</span>
              <span className="font-medium">{new Date(request.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
              {request.resolvedAt && (
                <>
                  <span className="text-muted-foreground">Resolved</span>
                  <span className="font-medium">{new Date(request.resolvedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
                </>
              )}
            </div>
            {request.description && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{request.description}</p>
              </div>
            )}
          </div>

          {/* Items */}
          {request.items?.length > 0 && (
            <div className="glass rounded-2xl border border-border/50 p-5 mb-4">
              <h2 className="font-semibold mb-3">Items</h2>
              <div className="space-y-3">
                {request.items.map((ri) => (
                  <div key={ri.id} className="flex items-center gap-3">
                    {ri.orderItem?.productImage && (
                      <img src={ri.orderItem.productImage} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ri.orderItem?.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {ri.orderItem?.size && <span>Size: {ri.orderItem.size} · </span>}
                        Qty: {ri.quantity}
                      </p>
                    </div>
                    {ri.orderItem?.price && (
                      <p className="text-sm font-medium flex-shrink-0">₹{ri.orderItem.price.toLocaleString("en-IN")}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Refund details (only for RETURN type) */}
          {request.type === "RETURN" && (request.upiHandle || request.bankAccountName) && (
            <div className="glass rounded-2xl border border-border/50 p-5 mb-4">
              <h2 className="font-semibold mb-3">Refund Details</h2>
              {request.upiHandle ? (
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-muted-foreground">Method</span>
                  <span className="font-medium">UPI</span>
                  <span className="text-muted-foreground">UPI ID</span>
                  <span className="font-medium">{request.upiHandle}</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-muted-foreground">Method</span>
                  <span className="font-medium">Bank Transfer</span>
                  <span className="text-muted-foreground">Account Name</span>
                  <span className="font-medium">{request.bankAccountName}</span>
                  <span className="text-muted-foreground">Account Number</span>
                  <span className="font-medium">{"*".repeat(Math.max(0, (request.bankAccountNumber?.length || 4) - 4))}{request.bankAccountNumber?.slice(-4)}</span>
                  <span className="text-muted-foreground">IFSC</span>
                  <span className="font-medium">{request.bankIFSC}</span>
                </div>
              )}
            </div>
          )}

          {/* Images */}
          {request.images?.length > 0 && (
            <div className="glass rounded-2xl border border-border/50 p-5 mb-4">
              <h2 className="font-semibold mb-3">Proof Images</h2>
              <div className="flex flex-wrap gap-2">
                {request.images.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt={`Proof ${i + 1}`} className="w-20 h-20 rounded-lg object-cover border border-border hover:opacity-80 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Cancel */}
          {request.status === "REQUESTED" && (
            <Button
              variant="destructive"
              className="w-full"
              disabled={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              {cancelMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Cancelling…</> : "Cancel Request"}
            </Button>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
