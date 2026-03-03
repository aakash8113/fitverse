import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ordersApi, returnsApi, CreateReturnRequestPayload, ReturnType, ReturnReason } from "@/services/api";
import { ArrowLeft, Package, Loader2, RefreshCcw, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZES_TOPWEAR    = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
const SIZES_BOTTOMWEAR = ["28", "30", "32", "34", "36", "38", "40", "42"];

const REASONS: { value: ReturnReason; label: string }[] = [
  { value: "DAMAGED",      label: "Item arrived damaged" },
  { value: "WRONG_ITEM",   label: "Wrong item received" },
  { value: "SIZE_ISSUE",   label: "Size doesn't fit" },
  { value: "QUALITY_ISSUE",label: "Quality not as expected" },
  { value: "OTHER",        label: "Other" },
];

export default function ReturnRequest() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId") || "";
  const navigate = useNavigate();
  const { toast } = useToast();

  const [requestType, setRequestType] = useState<ReturnType>("RETURN");
  const [reason, setReason]           = useState<ReturnReason | "">("");
  const [description, setDescription] = useState("");
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [replacementSize, setReplacementSize] = useState("");

  // Bank / UPI fields (for RETURN + COD)
  const [bankAccountName,   setBankAccountName]   = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIFSC,          setBankIFSC]          = useState("");
  const [upiHandle,         setUpiHandle]         = useState("");
  const [refundMethod,      setRefundMethod]      = useState<"bank" | "upi">("upi");

  const { data: orderData, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => ordersApi.getOrder(orderId),
    enabled: !!orderId,
  });

  const order = orderData?.data;

  const mutation = useMutation({
    mutationFn: (payload: CreateReturnRequestPayload) => returnsApi.createRequest(payload),
    onSuccess: (data) => {
      toast({ title: "Request submitted", description: `Your ${requestType.toLowerCase()} request has been received.` });
      navigate(`/returns/${data.data?.id}`);
    },
    onError: (err: any) => {
      toast({ title: "Submission failed", description: err.response?.data?.message || "Something went wrong.", variant: "destructive" });
    },
  });

  const toggleItem = (itemId: string) => {
    setSelectedItems((prev) => {
      if (prev[itemId] !== undefined) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: 1 };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) { toast({ title: "Select a reason", variant: "destructive" }); return; }
    const items = Object.entries(selectedItems).map(([orderItemId, quantity]) => ({ orderItemId, quantity }));
    if (items.length === 0) { toast({ title: "Select at least one item", variant: "destructive" }); return; }
    if (requestType === "REPLACEMENT" && !replacementSize) {
      toast({ title: "Select replacement size", variant: "destructive" }); return;
    }

    const payload: CreateReturnRequestPayload = {
      orderId,
      type: requestType,
      reason,
      description: description || undefined,
      items,
      replacementSize: requestType === "REPLACEMENT" ? replacementSize : undefined,
    };

    if (requestType === "RETURN" && order?.paymentMethod === "COD") {
      if (refundMethod === "bank") {
        payload.bankAccountName   = bankAccountName;
        payload.bankAccountNumber = bankAccountNumber;
        payload.bankIFSC          = bankIFSC;
      } else {
        payload.upiHandle = upiHandle;
      }
    }

    mutation.mutate(payload);
  };

  if (!orderId) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="section-container py-20 text-center">
        <p className="text-muted-foreground">No order specified.</p>
        <Link to="/orders"><Button className="mt-4">Back to Orders</Button></Link>
      </div>
      <Footer />
    </div>
  );

  if (isLoading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="section-container py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
      <Footer />
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="section-container py-20 text-center">
        <p className="text-muted-foreground">Order not found.</p>
        <Link to="/orders"><Button className="mt-4">Back to Orders</Button></Link>
      </div>
      <Footer />
    </div>
  );

  const isCOD = order.paymentMethod === "COD";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="section-container py-8 max-w-2xl">
        {/* Back */}
        <Link to={`/orders/${orderId}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Order
        </Link>

        <h1 className="text-2xl font-bold mb-1">Request Return / Replacement</h1>
        <p className="text-sm text-muted-foreground mb-8">Order #{order.orderNumber}</p>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Type selector */}
          <div className="grid grid-cols-2 gap-3">
            {([
              { value: "RETURN",      icon: RotateCcw,    label: "Return",      sub: "Refund to original payment" },
              { value: "REPLACEMENT", icon: RefreshCcw,   label: "Replacement", sub: "Exchange for different size" },
            ] as const).map(({ value, icon: Icon, label, sub }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRequestType(value)}
                className={cn(
                  "flex flex-col items-start gap-1 p-4 rounded-xl border-2 text-left transition-all",
                  requestType === value
                    ? "border-foreground bg-foreground/5"
                    : "border-border hover:border-foreground/40"
                )}
              >
                <Icon className={cn("w-5 h-5 mb-1", requestType === value ? "text-foreground" : "text-muted-foreground")} />
                <span className="font-semibold text-sm">{label}</span>
                <span className="text-xs text-muted-foreground">{sub}</span>
              </button>
            ))}
          </div>

          {/* Items */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Select items to {requestType.toLowerCase()}</Label>
            <div className="space-y-2">
              {order.items?.map((item: any) => {
                const checked = selectedItems[item.id] !== undefined;
                const imgUrl = item.productImage?.startsWith("http")
                  ? item.productImage
                  : `http://localhost:5000/${item.productImage || ""}`;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
                      checked ? "border-foreground bg-foreground/5" : "border-border hover:border-foreground/30"
                    )}
                  >
                    <div className={cn("w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all",
                      checked ? "bg-foreground border-foreground" : "border-muted-foreground")}>
                      {checked && <svg className="w-3 h-3 text-background" fill="currentColor" viewBox="0 0 12 12"><path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
                    </div>
                    <img src={imgUrl} alt={item.productName} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/48?text=?"; }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}{item.size ? ` · Size: ${item.size}` : ""}</p>
                    </div>
                    <p className="text-sm font-semibold flex-shrink-0">₹{Number(item.price).toFixed(2)}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Replacement size */}
          {requestType === "REPLACEMENT" && (
            <div>
              <Label className="text-base font-semibold mb-3 block">Select replacement size</Label>
              <div className="flex flex-wrap gap-2">
                {[...SIZES_TOPWEAR, ...SIZES_BOTTOMWEAR].filter((v, i, a) => a.indexOf(v) === i).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setReplacementSize(s)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all",
                      replacementSize === s ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/40"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Reason</Label>
            <div className="space-y-2">
              {REASONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setReason(value)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left text-sm transition-all",
                    reason === value ? "border-foreground bg-foreground/5 font-medium" : "border-border hover:border-foreground/30"
                  )}
                >
                  <span className={cn("w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all",
                    reason === value ? "border-foreground bg-foreground" : "border-muted-foreground")} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-base font-semibold mb-1 block">Additional details <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in more detail..."
              rows={3}
            />
          </div>

          {/* COD refund details */}
          {requestType === "RETURN" && isCOD && (
            <div className="glass rounded-xl border border-border/50 p-5">
              <p className="font-semibold mb-1">Refund Details</p>
              <p className="text-sm text-muted-foreground mb-4">Since this was a Cash on Delivery order, please provide your refund details.</p>

              <div className="flex gap-3 mb-4">
                {(["upi", "bank"] as const).map((m) => (
                  <button key={m} type="button" onClick={() => setRefundMethod(m)}
                    className={cn("flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all",
                      refundMethod === m ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/40")}>
                    {m === "upi" ? "UPI" : "Bank Transfer"}
                  </button>
                ))}
              </div>

              {refundMethod === "upi" ? (
                <div>
                  <Label htmlFor="upi">UPI Handle / ID</Label>
                  <Input id="upi" value={upiHandle} onChange={(e) => setUpiHandle(e.target.value)} placeholder="yourname@upi" className="mt-1" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="accName">Account Holder Name</Label>
                    <Input id="accName" value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} placeholder="Full name" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="accNum">Account Number</Label>
                    <Input id="accNum" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} placeholder="Account number" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="ifsc">IFSC Code</Label>
                    <Input id="ifsc" value={bankIFSC} onChange={(e) => setBankIFSC(e.target.value)} placeholder="e.g. HDFC0001234" className="mt-1" />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-2">
            <Button type="submit" className="w-full h-12" disabled={mutation.isPending}>
              {mutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : `Submit ${requestType.charAt(0) + requestType.slice(1).toLowerCase()} Request`}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-3">Our team will review your request and contact you within 24–48 hours.</p>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}
