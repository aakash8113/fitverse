import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { returnsApi, ReturnRequest, ReturnStatus } from "@/services/api";
import {
  Loader2, ChevronDown, ChevronUp, RotateCcw, RefreshCcw
} from "lucide-react";

const ALL_STATUSES: ReturnStatus[] = [
  "REQUESTED", "APPROVED", "REJECTED", "ITEM_RECEIVED",
  "REFUND_INITIATED", "REPLACEMENT_SHIPPED", "COMPLETED", "CANCELLED",
];

const STATUS_LABELS: Record<ReturnStatus, string> = {
  REQUESTED: "Requested",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  ITEM_RECEIVED: "Item Received",
  REFUND_INITIATED: "Refund Initiated",
  REPLACEMENT_SHIPPED: "Replacement Shipped",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_BADGE: Record<ReturnStatus, string> = {
  REQUESTED: "bg-yellow-100 text-yellow-800 border-yellow-200",
  APPROVED: "bg-blue-100 text-blue-800 border-blue-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
  ITEM_RECEIVED: "bg-purple-100 text-purple-800 border-purple-200",
  REFUND_INITIATED: "bg-indigo-100 text-indigo-800 border-indigo-200",
  REPLACEMENT_SHIPPED: "bg-cyan-100 text-cyan-800 border-cyan-200",
  COMPLETED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-gray-100 text-gray-600 border-gray-200",
};

// Next valid status transitions
const NEXT_STATUSES: Record<ReturnStatus, ReturnStatus[]> = {
  REQUESTED: ["APPROVED", "REJECTED"],
  APPROVED: ["ITEM_RECEIVED", "REJECTED"],
  REJECTED: [],
  ITEM_RECEIVED: ["REFUND_INITIATED", "REPLACEMENT_SHIPPED"],
  REFUND_INITIATED: ["COMPLETED"],
  REPLACEMENT_SHIPPED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

const reasonLabels: Record<string, string> = {
  DAMAGED: "Damaged",
  WRONG_ITEM: "Wrong Item",
  SIZE_ISSUE: "Size Issue",
  QUALITY_ISSUE: "Quality Issue",
  OTHER: "Other",
};

function RequestRow({ request }: { request: ReturnRequest }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ReturnStatus>(request.status);
  const [adminNote, setAdminNote] = useState(request.adminNote || "");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: ({ status, note }: { status: ReturnStatus; note: string }) =>
      returnsApi.adminUpdateStatus(request.id, { status, adminNote: note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-returns"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({ title: "Status updated" });
    },
    onError: (err: any) => {
      toast({ title: "Update failed", description: err.response?.data?.message || "An error occurred", variant: "destructive" });
    },
  });

  const nextOptions = NEXT_STATUSES[request.status] || [];

  return (
    <div className="border border-border/60 rounded-xl overflow-hidden">
      {/* Header row */}
      <button
        className="w-full text-left p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-3">
          <div>
            <p className="text-sm font-semibold">{request.requestNumber}</p>
            <p className="text-xs text-muted-foreground">Order #{request.order?.orderNumber}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{request.user?.name || "—"}</p>
            <p className="text-xs text-muted-foreground">{request.user?.email}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={STATUS_BADGE[request.status] || ""}>
              {STATUS_LABELS[request.status]}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {request.type === "RETURN"
                ? <><RotateCcw className="w-3 h-3 mr-1 inline" />Return</>
                : <><RefreshCcw className="w-3 h-3 mr-1 inline" />Replacement</>}
            </Badge>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 flex-shrink-0" />}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border/50 p-4 bg-muted/10 space-y-4">
          {/* Info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Reason</p>
              <p className="font-medium">{reasonLabels[request.reason] || request.reason}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Payment Method</p>
              <p className="font-medium">{request.order?.paymentMethod || "—"}</p>
            </div>
            {request.replacementSize && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Replacement Size</p>
                <p className="font-medium">{request.replacementSize}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Submitted</p>
              <p className="font-medium">{new Date(request.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
            </div>
          </div>

          {/* Description */}
          {request.description && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm bg-background border border-border/50 rounded-lg p-3">{request.description}</p>
            </div>
          )}

          {/* Refund details */}
          {request.type === "RETURN" && (request.upiHandle || request.bankAccountName) && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Refund Details</p>
              <div className="text-sm bg-background border border-border/50 rounded-lg p-3 grid grid-cols-2 gap-y-1">
                {request.upiHandle ? (
                  <>
                    <span className="text-muted-foreground">UPI</span>
                    <span className="font-medium">{request.upiHandle}</span>
                  </>
                ) : (
                  <>
                    <span className="text-muted-foreground">Account Name</span>
                    <span className="font-medium">{request.bankAccountName}</span>
                    <span className="text-muted-foreground">Account No.</span>
                    <span className="font-medium">{request.bankAccountNumber}</span>
                    <span className="text-muted-foreground">IFSC</span>
                    <span className="font-medium">{request.bankIFSC}</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Items */}
          {request.items?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Items</p>
              <div className="space-y-2">
                {request.items.map((ri) => (
                  <div key={ri.id} className="flex items-center gap-3 bg-background border border-border/50 rounded-lg p-2">
                    {ri.orderItem?.productImage && (
                      <img src={ri.orderItem.productImage} alt="" className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ri.orderItem?.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {ri.orderItem?.size && `Size: ${ri.orderItem.size} · `}Qty: {ri.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Images */}
          {request.images?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Proof Images</p>
              <div className="flex flex-wrap gap-2">
                {request.images.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt={`Proof ${i + 1}`} className="w-16 h-16 rounded-lg object-cover border border-border hover:opacity-80 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Admin actions */}
          {nextOptions.length > 0 && (
            <div className="border-t border-border/50 pt-4 space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {nextOptions.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedStatus(s)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      selectedStatus === s
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
              <textarea
                rows={2}
                placeholder="Admin note (optional, shown to customer)"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="w-full border border-border/60 rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              />
              <Button
                size="sm"
                disabled={updateMutation.isPending || selectedStatus === request.status}
                onClick={() => updateMutation.mutate({ status: selectedStatus, note: adminNote })}
              >
                {updateMutation.isPending ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Saving…</> : "Save Changes"}
              </Button>
            </div>
          )}

          {/* Existing admin note read-only */}
          {nextOptions.length === 0 && request.adminNote && (
            <div className="border-t border-border/50 pt-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Admin Note</p>
              <p className="text-sm">{request.adminNote}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminReturns() {
  const [statusFilter, setStatusFilter] = useState<ReturnStatus | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "RETURN" | "REPLACEMENT">("ALL");

  const params = {
    ...(statusFilter !== "ALL" && { status: statusFilter }),
    ...(typeFilter !== "ALL" && { type: typeFilter }),
  };

  const { data, isLoading } = useQuery({
    queryKey: ["admin-returns", params],
    queryFn: () => returnsApi.adminGetAll(params),
  });

  const requests: ReturnRequest[] = data?.data?.requests || [];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Returns & Replacements</h2>
        <p className="text-muted-foreground text-sm">Manage customer return and replacement requests</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Status filter */}
        <div className="flex gap-1 flex-wrap">
          {(["ALL", ...ALL_STATUSES] as (ReturnStatus | "ALL")[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {s === "ALL" ? "All Statuses" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        {/* Type filter */}
        <div className="flex gap-1">
          {(["ALL", "RETURN", "REPLACEMENT"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                typeFilter === t
                  ? "bg-secondary text-secondary-foreground border-secondary"
                  : "border-border hover:border-secondary/50"
              }`}
            >
              {t === "ALL" ? "All Types" : t === "RETURN" ? "Returns" : "Replacements"}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No requests found.</div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => <RequestRow key={r.id} request={r} />)}
        </div>
      )}
      </div>
    </AdminLayout>
  );
}
