import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Package, Truck, CheckCircle, Clock, Loader2, AlertCircle } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ordersApi } from "@/services/api";

interface TrackingStep {
  status: string;
  description: string;
  completed: boolean;
}

// Map backend order status to timeline steps
function buildTimeline(status: string): TrackingStep[] {
  const ORDER_STEPS = [
    { key: 'placed',     status: "Order Placed",       description: "Your order has been received" },
    { key: 'paid',       status: "Payment Confirmed",   description: "Payment successfully processed" },
    { key: 'processing', status: "Processing",          description: "Items are being prepared for shipment" },
    { key: 'shipped',    status: "Shipped",             description: "Your package is on its way" },
    { key: 'delivered',  status: "Delivered",           description: "Your order has been delivered" },
  ];

  const reachedIndex = (() => {
    switch (status) {
      case 'PENDING':    return 0;
      case 'PAID':       return 1;
      case 'PROCESSING': return 2;
      case 'SHIPPED':    return 3;
      case 'DELIVERED':  return 4;
      case 'CANCELLED':  return -1;
      case 'REFUNDED':   return -1;
      default:           return 0;
    }
  })();

  if (reachedIndex === -1) {
    return ORDER_STEPS.map((s) => ({ status: s.status, description: s.description, completed: false }));
  }

  return ORDER_STEPS.map((s, i) => ({
    status: s.status,
    description: s.description,
    completed: i <= reachedIndex,
  }));
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Order Placed',
  PAID: 'Payment Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [orderData, setOrderData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await ordersApi.trackOrder(orderNumber.trim(), email.trim());
      setOrderData(result.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Order not found. Please check your order number and email.");
      setOrderData(null);
    } finally {
      setLoading(false);
    }
  };

  const tracking = orderData ? buildTimeline(orderData.status) : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="section-container py-8 lg:py-12">
        {/* Header */}
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-3xl lg:text-5xl font-bold mb-4">Track Your Order</h1>
          <p className="text-lg text-muted-foreground">
            Enter your order number and email to track your package in real-time
          </p>
        </div>

        {/* Tracking Form */}
        {!tracking ? (
          <div className="max-w-2xl mx-auto">
            <div className="glass rounded-2xl border border-border/50 p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="orderNumber">Order Number</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="orderNumber"
                      placeholder="e.g., FV-2024-001234"
                      className="pl-10"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      required
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Found in your orders
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full h-11" size="lg" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Searching...</>
                  ) : (
                    <><Search className="mr-2 h-5 w-5" /> Track Order</>
                  )}
                </Button>
              </form>

              <Separator className="my-6" />

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Have an account?
                </p>
                <Link to="/orders">
                  <Button variant="outline" className="w-full">
                    View All Orders
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Tracking Results */
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Order Summary Card */}
            <div className="glass rounded-2xl border border-border/50 p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Order Number</p>
                  <p className="text-lg font-semibold">{orderData?.orderNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">Current Status</p>
                  <p className="text-lg font-semibold">{STATUS_LABELS[orderData?.status] || orderData?.status}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium">{STATUS_LABELS[orderData?.status] || orderData?.status}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Truck className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment</p>
                    <p className="font-medium">{orderData?.paymentMethod === 'COD' ? 'Cash on Delivery' : orderData?.paymentMethod === 'CARD' ? 'Card' : orderData?.paymentMethod}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Placed On</p>
                    <p className="font-medium">{orderData?.createdAt ? new Date(orderData.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking Timeline */}
            <div className="glass rounded-2xl border border-border/50 p-6">
              <h3 className="text-xl font-semibold mb-6">Order Progress</h3>
              
              <div className="space-y-6">
                {(orderData?.status === 'CANCELLED' || orderData?.status === 'REFUNDED') ? (
                  <div className="flex items-center gap-3 text-destructive">
                    <AlertCircle className="h-6 w-6" />
                    <p className="font-medium">This order has been {orderData.status.toLowerCase()}.</p>
                  </div>
                ) : (
                  tracking.map((step, index) => (
                    <div key={index} className="relative pl-8">
                      {/* Timeline Line */}
                      {index !== tracking.length - 1 && (
                        <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-border" />
                      )}
                      
                      {/* Timeline Dot */}
                      <div
                        className={cn(
                          "absolute left-0 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center",
                          step.completed
                            ? "bg-green-500 border-green-500"
                            : "bg-background border-border"
                        )}
                      >
                        {step.completed && (
                          <CheckCircle className="h-4 w-4 text-white" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="pb-6">
                        <h4 className={cn("font-semibold", !step.completed && "text-muted-foreground")}>{step.status}</h4>
                        <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setOrderData(null); setError(null); }}
              >
                Track Another Order
              </Button>
              <Link to="/orders" className="flex-1">
                <Button className="w-full">View All Orders</Button>
              </Link>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 rounded-xl bg-muted/50">
              <Clock className="h-8 w-8 mx-auto mb-3 text-accent" />
              <h3 className="font-semibold mb-2">Delivery Times</h3>
              <p className="text-sm text-muted-foreground">
                Standard: 5-7 days
                
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-muted/50">
              <Package className="h-8 w-8 mx-auto mb-3 text-accent" />
              <h3 className="font-semibold mb-2">Order Issues</h3>
              <p className="text-sm text-muted-foreground">
                <Link to="/contact" className="text-accent hover:underline">
                  Contact Support
                </Link>{" "}
                if you have any concerns
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-muted/50">
              <Truck className="h-8 w-8 mx-auto mb-3 text-accent" />
              <h3 className="font-semibold mb-2">Shipping Info</h3>
              <p className="text-sm text-muted-foreground">
                <Link to="/shipping" className="text-accent hover:underline">
                  Learn more
                </Link>{" "}
                about our shipping policy
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
