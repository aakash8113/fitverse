import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Package, MapPin, Truck, CheckCircle, Clock } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface TrackingStep {
  status: string;
  location: string;
  date: string;
  time: string;
  completed: boolean;
}

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [tracking, setTracking] = useState<TrackingStep[] | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock tracking data
    setTracking([
      {
        status: "Order Delivered",
        location: "New York, NY 10001",
        date: "Feb 27, 2026",
        time: "2:45 PM",
        completed: true,
      },
      {
        status: "Out for Delivery",
        location: "New York Distribution Center",
        date: "Feb 27, 2026",
        time: "8:30 AM",
        completed: true,
      },
      {
        status: "In Transit",
        location: "Newark, NJ",
        date: "Feb 26, 2026",
        time: "11:20 PM",
        completed: true,
      },
      {
        status: "Shipped",
        location: "Warehouse - Philadelphia, PA",
        date: "Feb 25, 2026",
        time: "4:15 PM",
        completed: true,
      },
      {
        status: "Order Confirmed",
        location: "Processing Center",
        date: "Feb 24, 2026",
        time: "10:30 AM",
        completed: true,
      },
    ]);
  };

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
                    Found in your order confirmation email
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

                <Button type="submit" className="w-full h-11" size="lg">
                  <Search className="mr-2 h-5 w-5" />
                  Track Order
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
                  <p className="text-lg font-semibold">{orderNumber || "FV-2024-001234"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">Estimated Delivery</p>
                  <p className="text-lg font-semibold text-green-600">Delivered</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium">Delivered</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Truck className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Carrier</p>
                    <p className="font-medium">FedEx Express</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Destination</p>
                    <p className="font-medium">New York, NY</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking Timeline */}
            <div className="glass rounded-2xl border border-border/50 p-6">
              <h3 className="text-xl font-semibold mb-6">Tracking History</h3>
              
              <div className="space-y-6">
                {tracking.map((step, index) => (
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
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-semibold">{step.status}</h4>
                        <div className="text-right">
                          <p className="text-sm font-medium">{step.date}</p>
                          <p className="text-sm text-muted-foreground">{step.time}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {step.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setTracking(null)}
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
                <br />
                Express: 2-3 days
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
