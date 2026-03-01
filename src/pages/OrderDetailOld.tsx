import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Package, Truck, CheckCircle } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function OrderDetail() {
  const { id } = useParams();

  const orderDetails = {
    orderNumber: "FV-2024-001234",
    date: "Feb 24, 2026",
    status: "Delivered",
    estimatedDelivery: "Feb 27, 2026",
    actualDelivery: "Feb 26, 2026",
    carrier: "FedEx Express",
    trackingNumber: "1Z999AA10123456784",
    shippingAddress: {
      name: "John Doe",
      street: "123 Fashion Street",
      city: "New York",
      state: "NY",
      zip: "10001",
    },
    items: [
      {
        id: 1,
        name: "Premium Cotton T-Shirt",
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
        size: "L",
        color: "Navy Blue",
        quantity: 2,
        price: 149.0,
      },
      {
        id: 2,
        name: "Slim Fit Jeans",
        image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400",
        size: "32",
        color: "Dark Wash",
        quantity: 1,
        price: 180.0,
      },
    ],
    subtotal: 478.0,
    shipping: 12.99,
    tax: 46.8,
    total: 537.79,
  };

  const trackingSteps = [
    {
      status: "Delivered",
      date: "Feb 26, 2026",
      time: "3:45 PM",
      location: "New York, NY",
      completed: true,
    },
    {
      status: "Out for Delivery",
      date: "Feb 26, 2026",
      time: "8:30 AM",
      location: "New York Distribution Center",
      completed: true,
    },
    {
      status: "In Transit",
      date: "Feb 25, 2026",
      time: "2:15 PM",
      location: "Newark, NJ",
      completed: true,
    },
    {
      status: "Shipped",
      date: "Feb 24, 2026",
      time: "5:00 PM",
      location: "Los Angeles, CA",
      completed: true,
    },
    {
      status: "Order Confirmed",
      date: "Feb 24, 2026",
      time: "2:30 PM",
      location: "Order Placed",
      completed: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="section-container py-8 lg:py-12">
        <div className="max-w-6xl mx-auto">
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Order Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Header */}
              <div className="glass rounded-2xl border border-border/50 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold mb-1">
                      Order {orderDetails.orderNumber}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Placed on {orderDetails.date}
                    </p>
                  </div>
                  <Badge className="bg-green-500/10 text-green-700 border-green-200">
                    {orderDetails.status}
                  </Badge>
                </div>

                <Separator className="my-4" />

                {/* Tracking Timeline */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Order Tracking</h2>
                  <div className="space-y-3">
                    {trackingSteps.map((step, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              step.completed
                                ? "bg-green-500"
                                : "bg-muted border-2 border-border"
                            }`}
                          >
                            {step.completed && (
                              <CheckCircle className="h-5 w-5 text-white" />
                            )}
                          </div>
                          {index < trackingSteps.length - 1 && (
                            <div
                              className={`w-0.5 h-12 ${
                                step.completed ? "bg-green-500" : "bg-border"
                              }`}
                            />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-start justify-between mb-1">
                            <h3
                              className={`font-semibold ${
                                step.completed ? "text-foreground" : "text-muted-foreground"
                              }`}
                            >
                              {step.status}
                            </h3>
                            <span className="text-sm text-muted-foreground">
                              {step.time}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{step.location}</p>
                          <p className="text-xs text-muted-foreground">{step.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="glass rounded-2xl border border-border/50 p-6">
                <h2 className="text-lg font-semibold mb-4">Order Items</h2>
                <div className="space-y-4">
                  {orderDetails.items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{item.name}</h3>
                        <div className="text-sm text-muted-foreground space-y-0.5">
                          <p>Size: {item.size}</p>
                          <p>Color: {item.color}</p>
                          <p>Quantity: {item.quantity}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{item.price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{orderDetails.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>₹{orderDetails.shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>₹{orderDetails.tax.toFixed(2)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>₹{orderDetails.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Shipping Info */}
              <div className="glass rounded-2xl border border-border/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Truck className="h-5 w-5 text-accent" />
                  </div>
                  <h2 className="text-lg font-semibold">Shipping Details</h2>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Carrier</p>
                    <p className="font-medium">{orderDetails.carrier}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Tracking Number</p>
                    <p className="font-mono text-xs">{orderDetails.trackingNumber}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Delivered On</p>
                    <p className="font-medium">{orderDetails.actualDelivery}</p>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="glass rounded-2xl border border-border/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-accent" />
                  </div>
                  <h2 className="text-lg font-semibold">Delivery Address</h2>
                </div>
                <div className="text-sm">
                  <p className="font-medium mb-1">{orderDetails.shippingAddress.name}</p>
                  <p className="text-muted-foreground">
                    {orderDetails.shippingAddress.street}
                  </p>
                  <p className="text-muted-foreground">
                    {orderDetails.shippingAddress.city}, {orderDetails.shippingAddress.state}{" "}
                    {orderDetails.shippingAddress.zip}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Link to="/track-order">
                  <Button variant="outline" className="w-full">
                    Track Package
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline" className="w-full">
                    Contact Support
                  </Button>
                </Link>
                <Link to={`/product/₹{orderDetails.items[0].id}`}>
                  <Button className="w-full">Buy Again</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
