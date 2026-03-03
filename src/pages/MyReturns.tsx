import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { returnsApi, ReturnRequest, ReturnStatus } from "@/services/api";
import { Loader2, Package, ChevronRight, RotateCcw, RefreshCcw } from "lucide-react";

const statusConfig: Record<ReturnStatus, { label: string; className: string }> = {
  REQUESTED:           { label: "Requested",           className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  APPROVED:            { label: "Approved",            className: "bg-blue-100 text-blue-800 border-blue-200" },
  REJECTED:            { label: "Rejected",            className: "bg-red-100 text-red-800 border-red-200" },
  ITEM_RECEIVED:       { label: "Item Received",       className: "bg-purple-100 text-purple-800 border-purple-200" },
  REFUND_INITIATED:    { label: "Refund Initiated",    className: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  REPLACEMENT_SHIPPED: { label: "Replacement Shipped", className: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  COMPLETED:           { label: "Completed",           className: "bg-green-100 text-green-800 border-green-200" },
  CANCELLED:           { label: "Cancelled",           className: "bg-gray-100 text-gray-600 border-gray-200" },
};

const reasonLabels: Record<string, string> = {
  DAMAGED: "Damaged",
  WRONG_ITEM: "Wrong Item",
  SIZE_ISSUE: "Size Issue",
  QUALITY_ISSUE: "Quality Issue",
  OTHER: "Other",
};

export default function MyReturns() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-returns"],
    queryFn: returnsApi.getMyRequests,
  });

  const requests: ReturnRequest[] = data?.data || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="section-container py-8 lg:py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-1">My Returns & Replacements</h1>
            <p className="text-muted-foreground">Track your return and replacement requests</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-20">
              <RotateCcw className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">No requests yet</h2>
              <p className="text-muted-foreground mb-6">You haven't raised any return or replacement requests.</p>
              <Link to="/orders"><Button>View My Orders</Button></Link>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => {
                const cfg = statusConfig[req.status] || statusConfig.REQUESTED;
                return (
                  <div key={req.id} className="glass rounded-2xl border border-border/50 p-5">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {req.type === "RETURN"
                            ? <RotateCcw className="w-4 h-4 text-muted-foreground" />
                            : <RefreshCcw className="w-4 h-4 text-muted-foreground" />}
                          <span className="font-semibold">{req.requestNumber}</span>
                          <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>
                          <Badge variant="secondary">{req.type === "RETURN" ? "Return" : "Replacement"}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Order #{req.order?.orderNumber} · {reasonLabels[req.reason] || req.reason}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(req.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <Link to={`/returns/${req.id}`}>
                        <Button variant="outline" size="sm" className="gap-1 flex-shrink-0">
                          View Details <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>

                    {/* Items preview */}
                    {req.items?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50 flex gap-2 flex-wrap">
                        {req.items.map((ri) => (
                          <span key={ri.id} className="text-xs bg-secondary px-2 py-1 rounded-md">
                            {ri.orderItem?.productName || "Item"} × {ri.quantity}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
